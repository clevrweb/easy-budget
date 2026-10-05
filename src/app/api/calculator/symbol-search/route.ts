import { NextResponse } from "next/server";

export interface SymbolMatch {
  symbol: string;
  name: string;
  region: string;
  currency: string;
}

export interface SymbolSearchResponse {
  matches: SymbolMatch[];
}

export type SymbolSearchErrorCode =
  | "missing_query"
  | "rate_limited"
  | "premium_required"
  | "upstream_error"
  | "server_misconfigured";

export interface SymbolSearchError {
  error: SymbolSearchErrorCode;
  message: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json<SymbolSearchError>(
      { error: "missing_query", message: "A search query is required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json<SymbolSearchError>(
      { error: "server_misconfigured", message: "Stock data provider is not configured." },
      { status: 500 }
    );
  }

  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;

  let json: Record<string, unknown>;
  try {
    const res = await fetch(url);
    json = await res.json();
  } catch {
    return NextResponse.json<SymbolSearchError>(
      { error: "upstream_error", message: "Could not reach the stock data provider." },
      { status: 502 }
    );
  }

  if (typeof json["Note"] === "string") {
    return NextResponse.json<SymbolSearchError>(
      { error: "rate_limited", message: "Stock data rate limit reached. Try again in a minute." },
      { status: 429 }
    );
  }
  if (typeof json["Information"] === "string") {
    const info = json["Information"] as string;
    const isPremium = /premium/i.test(info);
    return NextResponse.json<SymbolSearchError>(
      { error: isPremium ? "premium_required" : "rate_limited", message: info },
      { status: isPremium ? 403 : 429 }
    );
  }

  const rawMatches = json["bestMatches"] as Record<string, string>[] | undefined;
  const matches: SymbolMatch[] = (rawMatches ?? [])
    .slice(0, 8)
    .map((m) => ({
      symbol: m["1. symbol"],
      name: m["2. name"],
      region: m["4. region"],
      currency: m["8. currency"],
    }));

  return NextResponse.json<SymbolSearchResponse>({ matches });
}

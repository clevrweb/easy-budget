import { NextResponse } from "next/server";

export interface StockHistoryPoint {
  date: string;
  close: number;
  adjustedClose: number;
  dividend: number;
}

export interface StockHistoryResponse {
  symbol: string;
  series: StockHistoryPoint[];
}

export type StockHistoryErrorCode =
  | "missing_symbol"
  | "invalid_symbol"
  | "rate_limited"
  | "premium_required"
  | "upstream_error"
  | "server_misconfigured";

export interface StockHistoryError {
  error: StockHistoryErrorCode;
  message: string;
}

const SYMBOL_RE = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();

  if (!symbol || !SYMBOL_RE.test(symbol)) {
    return NextResponse.json<StockHistoryError>(
      { error: "missing_symbol", message: "A valid ticker symbol is required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json<StockHistoryError>(
      { error: "server_misconfigured", message: "Stock data provider is not configured." },
      { status: 500 }
    );
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  let json: Record<string, unknown>;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    json = await res.json();
  } catch {
    return NextResponse.json<StockHistoryError>(
      { error: "upstream_error", message: "Could not reach the stock data provider." },
      { status: 502 }
    );
  }

  if (typeof json["Error Message"] === "string") {
    return NextResponse.json<StockHistoryError>(
      { error: "invalid_symbol", message: `"${symbol}" is not a recognized ticker symbol.` },
      { status: 400 }
    );
  }
  if (typeof json["Note"] === "string") {
    return NextResponse.json<StockHistoryError>(
      { error: "rate_limited", message: "Stock data rate limit reached. Try again in a minute." },
      { status: 429 }
    );
  }
  if (typeof json["Information"] === "string") {
    const info = json["Information"] as string;
    const isPremium = /premium/i.test(info);
    return NextResponse.json<StockHistoryError>(
      { error: isPremium ? "premium_required" : "rate_limited", message: info },
      { status: isPremium ? 403 : 429 }
    );
  }

  const rawSeries = json["Monthly Adjusted Time Series"] as Record<string, Record<string, string>> | undefined;
  if (!rawSeries) {
    return NextResponse.json<StockHistoryError>(
      { error: "upstream_error", message: "Unexpected response from stock data provider." },
      { status: 502 }
    );
  }

  const series: StockHistoryPoint[] = Object.entries(rawSeries)
    .map(([date, values]) => ({
      date,
      close: parseFloat(values["4. close"]),
      adjustedClose: parseFloat(values["5. adjusted close"]),
      dividend: parseFloat(values["7. dividend amount"] ?? "0") || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json<StockHistoryResponse>({ symbol, series });
}

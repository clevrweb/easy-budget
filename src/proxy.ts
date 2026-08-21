import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetPassword = pathname.startsWith("/set-password");
  const isChooseAccount = pathname.startsWith("/choose-account");

  if (!user && !isAuthRoute && !isSetPassword && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Account gating: attach the active account cookie, or send the user to
  // pick one if they belong to more than one account.
  if (user && !isAuthRoute && !isSetPassword && !isChooseAccount) {
    const { data: memberships } = await supabase
      .from("account_members")
      .select("account_id")
      .eq("user_id", user.id);
    const accountIds = (memberships ?? []).map((m: { account_id: string }) => m.account_id);
    const cookieId = request.cookies.get("account_id")?.value;

    if (accountIds.length > 0 && (!cookieId || !accountIds.includes(cookieId))) {
      if (accountIds.length === 1) {
        supabaseResponse.cookies.set("account_id", accountIds[0], {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      } else {
        return NextResponse.redirect(new URL("/choose-account", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

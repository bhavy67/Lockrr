import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh for the `supabase` data mode.
 *
 * Access tokens are short-lived. Without something refreshing them between
 * requests, a vault left open in a tab quietly stops working — every query
 * comes back empty because the JWT expired, which looks like data loss rather
 * than an expired token. This runs on each request, refreshes when needed, and
 * writes the rotated cookies back onto the response.
 *
 * In `mock` mode there is no server-side session at all: the account lives in
 * localStorage, which middleware cannot see. Bouncing anyone here would lock
 * them out of their own browser-local vault, so this is a no-op.
 */

const APP_ROUTES = [
  "/dashboard",
  "/vault",
  "/categories",
  "/collections",
  "/timeline",
  "/reminders",
];

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== "supabase") {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser(), not getSession(): this revalidates the token with the auth
  // server and triggers the refresh. Nothing here trusts the cookie's claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && APP_ROUTES.some((r) => path === r || path.startsWith(`${r}/`))) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/sign-in";
    return NextResponse.redirect(redirect);
  }

  if (user && AUTH_ROUTES.includes(path)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never carry a
     * session worth refreshing, and running on them would cost a token
     * revalidation per icon.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

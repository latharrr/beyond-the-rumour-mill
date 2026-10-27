import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "./env";

// §2.1 protected paths: no session → /login. Mirrors the spec matcher
// ['/admin/:path*', '/dashboard/:path*', '/onboarding', '/experiences/new',
//  '/api/plans/:path*']. Roles are not checked here.
const PREFIXES = ["/admin", "/dashboard", "/api/plans"];
const EXACT = ["/onboarding", "/experiences/new"];

export function isProtectedPath(pathname: string) {
  return (
    EXACT.includes(pathname) ||
    PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

// Refreshes the auth cookie on every request (Server Components cannot write
// cookies), then gates the protected paths on a valid session.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() verifies the JWT and refreshes it when expired. Nothing may
  // run between client creation and this call, or sessions can drop.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return response;
}

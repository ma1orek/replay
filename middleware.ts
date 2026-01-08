import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware for Replay:
 * 1. Handle Supabase auth session refresh
 * 2. Route "/" to landing page and "/tool" to the app
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return res;
  }

  // Only create Supabase client if env vars are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Create Supabase client for session management
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            try {
              return req.cookies.get(name)?.value;
            } catch {
              return undefined;
            }
          },
          set(name: string, value: string, options: any) {
            try {
              req.cookies.set({ name, value, ...options });
              res = NextResponse.next({
                request: { headers: req.headers },
              });
              res.cookies.set({ name, value, ...options });
            } catch {
              // Ignore cookie set errors
            }
          },
          remove(name: string, options: any) {
            try {
              req.cookies.set({ name, value: "", ...options });
              res = NextResponse.next({
                request: { headers: req.headers },
              });
              res.cookies.set({ name, value: "", ...options });
            } catch {
              // Ignore cookie remove errors
            }
          },
        },
      });

      // Refresh session if needed (important for server components)
      await supabase.auth.getSession();
    } catch {
      // If Supabase auth fails (e.g., invalid UTF-8 in cookies), continue without auth
      console.error("Middleware auth error - continuing without session");
    }
  }

  // Routing: Home -> Landing
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.rewrite(url, { headers: res.headers });
  }

  // Routing: /tool -> App (page.tsx at root)
  if (pathname === "/tool" || pathname.startsWith("/tool/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url, { headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image
     * - favicon.ico
     * - public files with extensions
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};




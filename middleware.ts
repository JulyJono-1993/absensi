import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = await updateSession(request);
    const { data } = await supabase.auth.getSession();
    
    const session = data.session;
    const isLoggedIn = !!(session && session.access_token);
    const isLoginPage = request.nextUrl.pathname === "/login";

    // If on login page, check if already logged in
    if (isLoginPage) {
      if (isLoggedIn) {
        // Redirect logged-in users away from login page
        return NextResponse.redirect(new URL("/", request.url));
      }
      // If not logged in, let the login page render normally
      return response;
    }

    // Define protected paths
    const protectedPaths = ["/", "/classes", "/students", "/attendance", "/reports", "/print"];
    const isProtected = protectedPaths.some((path) => {
      if (path === "/") {
        return request.nextUrl.pathname === "/";
      }
      return request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/");
    });

    // Redirect to login if not authenticated and trying to access protected routes
    if (isProtected && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  } catch {
    // If any error occurs, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
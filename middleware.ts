import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const supabase = await updateSession(request);
    const { data } = await supabase.auth.getSession();

    const session = data.session;
    const isLoggedIn = !!(session && session.access_token);
    const isLoginPage = request.nextUrl.pathname === "/login";

    if (isLoginPage) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    const protectedPaths = ["/", "/classes", "/students", "/attendance", "/reports", "/print"];
    const isProtected = protectedPaths.some((path) => {
      if (path === "/") return request.nextUrl.pathname === "/";
      return request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/");
    });

    if (isProtected && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

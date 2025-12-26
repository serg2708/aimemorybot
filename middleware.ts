import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow HEAD requests to pass through without authentication
  // These are used for API availability checks
  if (request.method === "HEAD") {
    return NextResponse.next();
  }

  // Allow public access to homepage (pricing page)
  if (pathname === "/" || pathname === "/pricing") {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: !isDevelopmentEnvironment,
    });

    if (!token) {
      const redirectUrl = encodeURIComponent(request.url);

      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
      );
    }

    const isGuest = guestRegex.test(token?.email ?? "");

    if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Log error but continue to avoid blocking the app
    console.error("[Middleware] Error processing request:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

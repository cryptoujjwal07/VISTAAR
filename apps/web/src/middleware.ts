import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-protected route prefixes
const ROLE_ROUTE_PREFIXES = ["/scientist", "/researcher", "/teacher", "/student", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api routes, next internal assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if target is a strictly role-protected route
  const isProtectedRoleRoute = ROLE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoleRoute) {
    // If the request is for a protected route, client-side AuthGate and bearer token verification
    // handles deep auth checks. Middleware attaches a security header indicating protected workspace.
    const response = NextResponse.next();
    response.headers.set("x-vistaar-rbac-protected", "true");
    response.headers.set("x-vistaar-route", pathname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/scientist/:path*",
    "/researcher/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/admin/:path*",
  ],
};

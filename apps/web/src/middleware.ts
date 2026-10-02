import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-to-allowed-routes mapping
const ROLE_PERMITTED_ROUTES: Record<string, string[]> = {
  SCIENTIST: ["/scientist"],
  FIELD_SCIENTIST: ["/scientist"],
  RESEARCHER: ["/researcher"],
  JOURNALIST: ["/researcher"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
  PUBLIC_USER: ["/student"],
  ADMIN: ["/admin", "/scientist", "/researcher", "/teacher", "/student"],
  SUPER_ADMIN: ["/admin", "/scientist", "/researcher", "/teacher", "/student"],
};

const PROTECTED_PREFIXES = ["/scientist", "/researcher", "/teacher", "/student", "/admin"];

function getRequiredRoleForRoute(pathname: string): string {
  if (pathname.startsWith("/scientist")) return "Scientist";
  if (pathname.startsWith("/researcher")) return "Researcher";
  if (pathname.startsWith("/teacher")) return "Teacher";
  if (pathname.startsWith("/student")) return "Student";
  if (pathname.startsWith("/admin")) return "Admin";
  return "Authorized User";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static, Next internals, api assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Find if route matches any protected portal prefix
  const matchedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  // Read role from cookie or auth header
  const roleCookie = request.cookies.get("vistaar_user_role")?.value?.toUpperCase() ||
    request.headers.get("x-vistaar-role")?.toUpperCase();

  if (roleCookie) {
    const permittedRoutes = ROLE_PERMITTED_ROUTES[roleCookie] || [];
    const isAllowed = permittedRoutes.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (!isAllowed) {
      const requiredRole = getRequiredRoleForRoute(pathname);
      const html403 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Forbidden • VISTAAR RBAC</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #FAF7F0; color: #17202A; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #FFFFFF; border: 1px solid #FECACA; border-radius: 12px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }
    .badge { display: inline-block; background: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase; }
    h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #7F1D1D; }
    p { color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
    .details { background: #FEF2F2; border: 1px dashed #FCA5A5; border-radius: 8px; padding: 12px; font-size: 13px; text-align: left; margin-bottom: 24px; }
    .btn { display: inline-block; background: #2563EB; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 8px; transition: background 0.15s; }
    .btn:hover { background: #1D4ED8; }
    .btn-secondary { background: #E5E7EB; color: #374151; margin-left: 8px; }
    .btn-secondary:hover { background: #D1D5DB; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">403 Forbidden • Access Denied</div>
    <h1>Access Restricted by RBAC Policy</h1>
    <p>You do not have permission to view this portal. Your current role does not have authorization to access <strong>${pathname}</strong>.</p>
    <div class="details">
      <div><strong>Current Role:</strong> ${roleCookie}</div>
      <div><strong>Required Role:</strong> ${requiredRole} Portal Authorization</div>
      <div><strong>Target Route:</strong> ${pathname}</div>
      <div><strong>Enforcement:</strong> VISTAAR Edge Gateway RBAC</div>
    </div>
    <div>
      <a href="/" class="btn">Return to Home</a>
      <a href="/login" class="btn btn-secondary">Switch Account</a>
    </div>
  </div>
</body>
</html>`;

      return new NextResponse(html403, {
        status: 403,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-vistaar-rbac-status": "403_FORBIDDEN",
        },
      });
    }
  }

  // Allow authorized access or pass through to client AuthGate
  const response = NextResponse.next();
  response.headers.set("x-vistaar-rbac-protected", "true");
  response.headers.set("x-vistaar-route", pathname);
  return response;
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

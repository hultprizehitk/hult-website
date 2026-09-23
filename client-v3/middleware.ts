import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = (request.headers.get("host") || "").toLowerCase();

  const isAdminSubdomain =
    host.startsWith("admin.localhost") ||
    host.startsWith("admin.hultprizehitk.live") ||
    host.startsWith("admin.");

  // 1. When hitting admin.localhost:3000 or admin.hultprizehitk.live
  if (isAdminSubdomain) {
    const isSpecialPath =
      url.pathname.startsWith("/_next") ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/assets") ||
      url.pathname === "/favicon.ico";

    if (!isSpecialPath) {
      // Clean URLs: normalize /admin or /admin/xyz to / or /xyz on the admin subdomain
      if (url.pathname === "/admin") {
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      if (url.pathname.startsWith("/admin/")) {
        url.pathname = url.pathname.replace(/^\/admin/, "");
        return NextResponse.redirect(url);
      }

      // Internally rewrite / or /teams to /admin or /admin/teams
      url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // 2. When hitting the main domain (e.g. hultprizehitk.live or www.hultprizehitk.live)
    // In production, enforce that all /admin traffic is redirected to admin.hultprizehitk.live
    const isMainDomainAdmin =
      (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1");

    if (isMainDomainAdmin) {
      const subPath = url.pathname.replace(/^\/admin/, "");
      const adminSubdomainUrl = new URL(
        subPath === "" ? "/" : subPath,
        "https://admin.hultprizehitk.live"
      );
      adminSubdomainUrl.search = url.search;
      return NextResponse.redirect(adminSubdomainUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, favicon, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = (request.headers.get("host") || "").toLowerCase();

  const isAdminSubdomain =
    host.startsWith("admin.localhost") ||
    host.startsWith("admin.hultprizehitk.live") ||
    host.startsWith("admin.");

  // When hitting admin.localhost:3000 or admin.hultprizehitk.live
  if (isAdminSubdomain) {
    const isSpecialPath =
      url.pathname.startsWith("/_next") ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/assets") ||
      url.pathname === "/favicon.ico";

    if (!isSpecialPath) {
      const isAlreadyAdminPath =
        url.pathname === "/admin" || url.pathname.startsWith("/admin/");

      if (!isAlreadyAdminPath) {
        url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
        return NextResponse.rewrite(url);
      }
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

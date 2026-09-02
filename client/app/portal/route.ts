import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-check";

// Stealth Gateway: Only authenticates and redirects verified admins to the secret dashboard slug
export async function GET(req: Request) {
  const isAuthorized = await isAuthorizedAdmin(req);
  const baseUrl = req.url ? new URL(req.url).origin : "https://www.hultprizehitk.live";

  if (isAuthorized) {
    const slug = process.env.ADMIN_SECRET_SLUG || "portal-hult-8f4b2c1e9a7d";
    return NextResponse.redirect(new URL(`/${slug}/dashboard`, baseUrl));
  }

  // Non-admins or unauthenticated visitors are redirected to home
  return NextResponse.redirect(new URL("/", baseUrl));
}

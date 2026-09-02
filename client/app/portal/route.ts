import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

// Stealth Gateway: Only authenticates and redirects verified admins to the secret dashboard slug
export async function GET(req: Request) {
  const session = await auth();
  const email = (session?.user?.email || "").toLowerCase().trim();
  const role = (session?.user as { role?: string })?.role;

  const isAuthorized =
    SUPER_ADMINS.includes(email) || role === "superadmin" || role === "admin";

  const baseUrl = req.url ? new URL(req.url).origin : "https://www.hultprizehitk.live";

  if (isAuthorized) {
    const slug = process.env.ADMIN_SECRET_SLUG || "portal-hult-8f4b2c1e9a7d";
    return NextResponse.redirect(new URL(`/${slug}/dashboard`, baseUrl));
  }

  // Non-admins or unauthenticated visitors are redirected to home
  return NextResponse.redirect(new URL("/", baseUrl));
}

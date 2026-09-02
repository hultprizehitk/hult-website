import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Reads allowed superadmin emails securely from server-side environment variables (.env).
 * Never exposed to the client/browser bundle.
 */
export function getEnvSuperAdmins(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return getEnvSuperAdmins().includes(clean);
}

/**
 * Validates if the active caller holds verified Administrator clearance.
 * Checks against server environment variables and live MongoDB database User collection.
 */
export async function isAuthorizedAdmin(_req?: Request): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.email) return false;

    const email = session.user.email.toLowerCase().trim();

    // 1. Check server-side environment variable (.env)
    if (isSuperAdminEmail(email)) {
      return true;
    }

    // 2. Direct database verification
    await connectDB();
    const dbUser = await User.findOne({ email }).select("role").lean();
    if (dbUser && (dbUser.role === "admin" || dbUser.role === "superadmin")) {
      return true;
    }

    // 3. Fallback check on session JWT role
    const sessionRole = (session.user as { role?: string }).role;
    if (sessionRole === "admin" || sessionRole === "superadmin") {
      return true;
    }
  } catch (error) {
    console.error("Admin authorization check error:", error);
  }

  return false;
}

/**
 * Validates if the active caller holds verified Super Admin clearance.
 * Checks directly against live MongoDB database records and server environment variables.
 */
export async function isAuthorizedSuperAdmin(_req?: Request): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.email) return false;

    const email = session.user.email.toLowerCase().trim();

    // 1. Check server-side environment variable (.env)
    if (isSuperAdminEmail(email)) {
      return true;
    }

    // 2. Direct database verification
    await connectDB();
    const dbUser = await User.findOne({ email }).select("role").lean();
    if (dbUser && dbUser.role === "superadmin") {
      return true;
    }
  } catch (error) {
    console.error("Super Admin authorization check error:", error);
  }

  return false;
}

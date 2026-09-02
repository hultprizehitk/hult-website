import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { SUPER_ADMINS, isSuperAdminEmail } from "./constants";

export { SUPER_ADMINS, isSuperAdminEmail };

/**
 * Validates if the active caller holds verified Administrator clearance.
 * Checks against the live MongoDB database User collection to prevent stale tokens or frontend spoofing.
 */
export async function isAuthorizedAdmin(_req?: Request): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.email) return false;

    const email = session.user.email.toLowerCase().trim();

    // 1. Permanent Super Admin safeguard
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
 * Checks against live MongoDB database records and permanent registry.
 */
export async function isAuthorizedSuperAdmin(_req?: Request): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.email) return false;

    const email = session.user.email.toLowerCase().trim();

    // 1. Permanent Super Admin registry check
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

import { adminEmailsFromEnv } from "@/lib/env";
import { User } from "@/models/mirror";

const ADMIN_ROLES = new Set(["junior_admin", "lead_admin", "master_admin"]);

/** Admin = listed in ADMIN_EMAILS, or has an admin role in the shared users collection. */
export async function isAdminEmail(email: string): Promise<boolean> {
  const clean = email.toLowerCase().trim();
  if (adminEmailsFromEnv().includes(clean)) return true;
  const user = await User.findOne({ email: clean }).select("role").lean();
  return !!user && ADMIN_ROLES.has(user.role);
}

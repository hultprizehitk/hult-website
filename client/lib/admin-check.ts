import { auth } from "@/auth";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

export async function isAuthorizedAdmin(_req?: Request): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;

    const role = (session.user as { role?: string }).role;
    if (role === "superadmin" || role === "admin") {
      return true;
    }

    const email = (session.user.email || "").toLowerCase().trim();
    if (SUPER_ADMINS.includes(email)) {
      return true;
    }
  } catch (error) {
    console.error("Admin authorization check error:", error);
  }

  return false;
}

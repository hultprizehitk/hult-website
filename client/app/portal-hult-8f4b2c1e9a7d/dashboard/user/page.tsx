import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminCMSClient from "../../AdminCMSClient";
import AdminAccessDenied from "../../AdminAccessDenied";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

export default async function AdminUserManagementPage() {
  const session = await auth();

  // 1. If not logged in at all, redirect to the portal login gate
  if (!session?.user) {
    redirect("/portal-hult-8f4b2c1e9a7d");
  }

  // 2. Only Super Admins can access user management
  const userEmail = (session.user.email || "").toLowerCase().trim();
  const role = (session.user as { role?: string }).role;
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail) || role === "superadmin";

  if (!isSuperAdmin) {
    return <AdminAccessDenied userEmail={session.user.email || "Administrator"} />;
  }

  // 3. Render the unified CMS dashboard with the Manage Admins tab active
  return <AdminCMSClient userEmail={session.user.email || "Super Admin"} initialTab="admins" />;
}

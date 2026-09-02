import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminCMSClient from "../AdminCMSClient";
import AdminAccessDenied from "../AdminAccessDenied";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

export default async function AdminDashboardPage() {
  const session = await auth();

  // 1. If NOT logged in, redirect back to the portal login gate (cannot access /dashboard without login!)
  if (!session?.user) {
    redirect("/portal-hult-8f4b2c1e9a7d");
  }

  // 2. Check if the user is a Super Admin
  const userEmail = (session.user.email || "").toLowerCase().trim();
  const role = (session.user as { role?: string }).role;

  const isSuperAdmin =
    SUPER_ADMINS.includes(userEmail) || role === "superadmin" || role === "admin";

  // 3. If signed in with an unauthorized student account, show Access Denied
  if (!isSuperAdmin) {
    return <AdminAccessDenied userEmail={session.user.email || "Student Account"} />;
  }

  // 4. Authorized Super Admin: Render Full CMS Dashboard
  return <AdminCMSClient userEmail={session.user.email || "Super Admin"} />;
}

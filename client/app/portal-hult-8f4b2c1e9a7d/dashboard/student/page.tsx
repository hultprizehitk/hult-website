import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminCMSClient from "../../AdminCMSClient";
import AdminAccessDenied from "../../AdminAccessDenied";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

export default async function AdminStudentsPage() {
  const session = await auth();

  // 1. If not logged in, redirect to the portal login gate
  if (!session?.user) {
    redirect("/portal-hult-8f4b2c1e9a7d");
  }

  // 2. Check if user is an authorized Admin or Super Admin
  const userEmail = (session.user.email || "").toLowerCase().trim();
  const role = (session.user as { role?: string }).role;
  const isAuthorized =
    SUPER_ADMINS.includes(userEmail) || role === "superadmin" || role === "admin";

  if (!isAuthorized) {
    return <AdminAccessDenied userEmail={session.user.email || "Student Account"} />;
  }

  // 3. Render the unified CMS dashboard with the Registered Students tab active
  return <AdminCMSClient userEmail={session.user.email || "Admin"} initialTab="participants" />;
}

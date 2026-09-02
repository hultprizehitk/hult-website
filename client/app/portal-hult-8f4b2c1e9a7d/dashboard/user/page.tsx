import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../../AdminAccessDenied";
import AdminUserManager from "../components/AdminUserManager";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

export default async function AdminUserManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/portal-hult-8f4b2c1e9a7d");
  }

  const userEmail = (session.user.email || "").toLowerCase().trim();
  const role = (session.user as { role?: string }).role;
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail) || role === "superadmin";

  if (!isSuperAdmin) {
    return <AdminAccessDenied userEmail={session.user.email || "Administrator"} />;
  }

  return <AdminUserManager currentUserEmail={session.user.email || "Super Admin"} />;
}

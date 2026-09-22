import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../components/AdminAccessDenied";
import AdminUserManager from "../components/AdminUserManager";
import { isAuthorizedSuperAdmin } from "@/lib/admin-check";

export const metadata = {
  title: "Admin Clearance & Roles | Admin CMS",
  description: "Role assignments, privileges, and administrator credentials management.",
};

export default async function AdminManagementPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin");
  }

  const isSuperAdmin = await isAuthorizedSuperAdmin();
  if (!isSuperAdmin) {
    return <AdminAccessDenied userEmail={session.user.email} />;
  }

  return <AdminUserManager currentUserEmail={session.user.email} />;
}

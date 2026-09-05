import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../../AdminAccessDenied";
import AdminUserManager from "../components/AdminUserManager";
import { isAuthorizedSuperAdmin } from "@/lib/admin-check";

export const metadata = {
  title: "Admin | Admin CMS",
};

export default async function AdminManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/portal-hult-8f4b2c1e9a7d");
  }

  const isSuperAdmin = await isAuthorizedSuperAdmin();
  if (!isSuperAdmin) {
    return <AdminAccessDenied userEmail={session.user.email || "Administrator"} />;
  }

  return <AdminUserManager currentUserEmail={session.user.email || "Administrator"} />;
}

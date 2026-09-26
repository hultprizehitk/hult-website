import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../components/AdminAccessDenied";
import TeamsManagementConsole from "../components/TeamsManagementConsole";
import { isAuthorizedLeadOrMasterAdmin } from "@/lib/admin-check";

export const metadata: Metadata = {
  title: "Registered Teams | Admin CMS",
  description: "Official ventures, team formations, and student participant rosters.",
};

export default async function AdminTeamsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin");
  }

  const isAllowed = await isAuthorizedLeadOrMasterAdmin();
  if (!isAllowed) {
    return <AdminAccessDenied userEmail={session.user.email} />;
  }

  return <TeamsManagementConsole />;
}

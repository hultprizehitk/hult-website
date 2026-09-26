import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../components/AdminAccessDenied";
import StudentsDirectory from "../components/StudentsDirectory";
import { isAuthorizedLeadOrMasterAdmin } from "@/lib/admin-check";

export const metadata = {
  title: "Users Directory | Admin CMS",
  description: "Heritage Institute of Technology student directory and participant records.",
};

export default async function AdminStudentsDirectoryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin");
  }

  const isAllowed = await isAuthorizedLeadOrMasterAdmin();
  if (!isAllowed) {
    return <AdminAccessDenied userEmail={session.user.email} />;
  }

  return <StudentsDirectory />;
}

import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAuthorizedSuperAdmin, getAdminRole } from "@/lib/admin-check";
import EventsManager from "./components/EventsManager";

export const metadata = {
  title: "Events Manager | Admin CMS",
};

export default async function AdminEventsDashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin");
  }

  const role = await getAdminRole();
  if (role === "junior_admin") {
    redirect("/admin/scanner");
  }

  const isSuperAdmin = await isAuthorizedSuperAdmin();
  if (!isSuperAdmin) {
    redirect("/admin/teams");
  }

  return <EventsManager />;
}

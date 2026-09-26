import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../components/AdminAccessDenied";
import EventsManager from "../components/EventsManager";
import { isAuthorizedSuperAdmin } from "@/lib/admin-check";

export const metadata = {
  title: "Events Manager | Admin CMS",
  description: "Create, edit, schedule, and publish official Hult Prize events.",
};

export default async function AdminEventsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin");
  }

  const isSuperAdmin = await isAuthorizedSuperAdmin();
  if (!isSuperAdmin) {
    return <AdminAccessDenied userEmail={session.user.email} />;
  }

  return <EventsManager />;
}

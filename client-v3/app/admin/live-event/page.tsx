import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../components/AdminAccessDenied";
import LiveEventManager from "../components/LiveEventManager";
import { isAuthorizedLeadOrMasterAdmin } from "@/lib/admin-check";

export const metadata: Metadata = {
  title: "Live Event Management | Hult Prize HITK Admin",
  description: "Live stage control room, pitch timer, pitch queue tracker, and attendee check-in console.",
};

export default async function LiveEventDashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin");
  }

  const isAllowed = await isAuthorizedLeadOrMasterAdmin();
  if (!isAllowed) {
    return <AdminAccessDenied userEmail={session.user.email} />;
  }

  return <LiveEventManager />;
}

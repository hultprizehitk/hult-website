import React from "react";
import { Metadata } from "next";
import ScannerConsole from "./components/ScannerConsole";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAuthorizedSuperAdmin, isAuthorizedLeadOrMasterAdmin } from "@/lib/admin-check";

export const metadata: Metadata = {
  title: "Participant QR Scanner | Admin CMS | Hult Prize HITK",
  description: "Real-time attendee pass scanner, camera verification HUD, and fast check-in terminal.",
};

export default async function AdminScannerPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin");
  }

  const isMasterAdmin = await isAuthorizedSuperAdmin();
  const isLeadOrMaster = await isAuthorizedLeadOrMasterAdmin();
  return <ScannerConsole isMasterAdmin={isMasterAdmin} isLeadOrMaster={isLeadOrMaster} />;
}

import React from "react";
import { Metadata } from "next";
import ScannerConsole from "./components/ScannerConsole";

export const metadata: Metadata = {
  title: "Participant QR Scanner | Admin CMS | Hult Prize HITK",
  description: "Real-time attendee pass scanner, camera verification HUD, and fast check-in terminal.",
};

export default function AdminScannerPage() {
  return <ScannerConsole />;
}

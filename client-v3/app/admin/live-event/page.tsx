import React from "react";
import { Metadata } from "next";
import LiveEventManager from "../components/LiveEventManager";

export const metadata: Metadata = {
  title: "Live Event Management | Hult Prize HITK Admin",
  description: "Live stage control room, pitch timer, pitch queue tracker, and attendee check-in console.",
};

export default function LiveEventDashboardPage() {
  return <LiveEventManager />;
}

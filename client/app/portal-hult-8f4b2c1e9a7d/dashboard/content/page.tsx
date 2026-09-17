import React from "react";
import ContentManager from "../components/ContentManager";

export const metadata = {
  title: "Website Content CMS | Hult Prize HITK Admin",
  description: "Manage Organizing Committee, Flash Announcements, and Sponsors without redeploying.",
};

export default function AdminContentDashboardPage() {
  return <ContentManager />;
}

import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminAccessDenied from "../AdminAccessDenied";
import DashboardNav from "./components/DashboardNav";
import AnimatedGradient from "@/components/ui/animated-gradient";

const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
];

export const metadata = {
  title: "Admin CMS | Hult Prize HITK",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. If not logged in at all, redirect to the portal login gate
  if (!session?.user) {
    redirect("/portal-hult-8f4b2c1e9a7d");
  }

  // 2. Validate admin role clearance
  const userEmail = (session.user.email || "").toLowerCase().trim();
  const role = (session.user as { role?: string }).role;
  const isSuperAdmin = SUPER_ADMINS.includes(userEmail) || role === "superadmin";
  const isAuthorized = isSuperAdmin || role === "admin";

  if (!isAuthorized) {
    return <AdminAccessDenied userEmail={session.user.email || "Student Account"} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-[#f20089] selection:text-white overflow-x-clip">
      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <AnimatedGradient
          config={{ preset: "Aurora", speed: 14 }}
          noise={{ opacity: 0.08, scale: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90" />
      </div>

      {/* Persistent Navigation Header & Tabs */}
      <DashboardNav
        userEmail={session.user.email || "Administrator"}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

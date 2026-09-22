import React from "react";
import { auth } from "@/auth";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin } from "@/lib/admin-check";
import AdminSignInGate from "./components/AdminSignInGate";
import AdminAccessDenied from "./components/AdminAccessDenied";
import DashboardNav from "./components/DashboardNav";
import AnimatedGradient from "@/components/ui/animated-gradient";

export const metadata = {
  title: "Admin CMS | Hult Prize HITK",
  description: "Internal Administrative Operations and CMS for Hult Prize at Heritage Institute of Technology.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Unauthenticated gate
  if (!session?.user?.email) {
    return <AdminSignInGate />;
  }

  // 2. Authorization check
  const isAuthorized = await isAuthorizedAdmin();
  if (!isAuthorized) {
    return <AdminAccessDenied userEmail={session.user.email} />;
  }

  const isSuperAdmin = await isAuthorizedSuperAdmin();

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
        userEmail={session.user.email}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

import React from "react";
import { auth } from "@/auth";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin } from "@/lib/admin-check";
import AdminSignInGate from "./components/AdminSignInGate";
import AdminAccessDenied from "./components/AdminAccessDenied";
import DashboardNav from "./components/DashboardNav";
import { DotPattern } from "@/components/ui/dot-pattern";

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
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-white/25 selection:text-white overflow-x-clip">
      {/* Subtle Lightweight Dot Pattern Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <DotPattern
          width={32}
          height={32}
          cx={1}
          cy={1}
          cr={0.8}
          className="fill-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
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

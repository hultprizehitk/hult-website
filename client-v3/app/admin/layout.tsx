import React from "react";
import { auth } from "@/auth";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import AdminSignInGate from "./components/AdminSignInGate";
import AdminAccessDenied from "./components/AdminAccessDenied";
import AdminNav from "./components/AdminNav";

export const metadata = {
  title: "Admin Command Center | Hult Prize HITK",
  description: "Administrative command center and CMS for Hult Prize at Heritage Institute of Technology.",
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
    return (
      <AdminAccessDenied
        email={session.user.email}
        name={session.user.name || undefined}
      />
    );
  }

  // 3. Authorized Admin Command Center
  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-neutral-100 flex flex-col md:flex-row font-sans selection:bg-rose-500/30 selection:text-white">
      <AdminNav user={session.user} />
      <main className="flex-1 min-w-0 min-h-screen bg-[#0a0a0f] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

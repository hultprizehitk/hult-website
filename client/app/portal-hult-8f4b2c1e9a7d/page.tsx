import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSignInGate from "./AdminSignInGate";

export default async function PortalRootPage() {
  const session = await auth();

  // 1. If NOT logged in, show the Admin Sign-In Gate here (NO /dashboard in URL!)
  if (!session?.user) {
    return <AdminSignInGate />;
  }

  // 2. If logged in, send them straight to /dashboard
  redirect("/portal-hult-8f4b2c1e9a7d/dashboard");
}

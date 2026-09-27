import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { AdminSignIn } from "@/components/admin/AdminSignIn";

export const metadata = { title: "Quiz Admin | Hult Prize HITK" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return <AdminSignIn />;
  if (!(await isAdminEmail(email))) return <AdminDenied email={email} />;
  return <AdminFrame email={email}>{children}</AdminFrame>;
}

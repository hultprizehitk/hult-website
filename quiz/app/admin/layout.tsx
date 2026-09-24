import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { AdminDenied } from "@/components/admin/AdminDenied";
import { AdminFrame } from "@/components/admin/AdminFrame";

export const metadata = { title: "Quiz Admin | Hult Prize HITK" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) redirect("/signin?callbackUrl=/admin");
  await connectDB();
  if (!(await isAdminEmail(email))) return <AdminDenied email={email} />;
  return <AdminFrame email={email}>{children}</AdminFrame>;
}

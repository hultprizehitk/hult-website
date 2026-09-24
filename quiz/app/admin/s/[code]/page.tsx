import { AdminConsole } from "@/components/admin/AdminConsole";

export default async function AdminSessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <AdminConsole code={code} />;
}

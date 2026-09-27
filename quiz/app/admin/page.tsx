import { AdminConsole } from "@/components/admin/AdminConsole";
import { getHultAscendSession } from "@/lib/quiz/hult-ascend";

export default async function AdminHomePage() {
  const session = await getHultAscendSession();
  return <AdminConsole code={session.code} />;
}

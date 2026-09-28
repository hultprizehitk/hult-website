import { AdminConsole } from "@/components/admin/AdminConsole";
import { getHultAscendSession } from "@/lib/quiz/hult-ascend";

// Never prerender: the page reads (and on first visit creates) the event session in Firestore.
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await getHultAscendSession();
  return <AdminConsole code={session.code} />;
}

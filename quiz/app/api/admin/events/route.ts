import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { readEvents } from "@/lib/sync/mongo-read";

// Events come from the main site (MongoDB, read-only); only used when creating a session.
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return json({ events: await readEvents() });
  });
}

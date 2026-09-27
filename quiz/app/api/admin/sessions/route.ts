import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { adminSummary } from "@/lib/quiz/client-state";
import { QuizError } from "@/lib/quiz/errors";
import { createSession, listSessions } from "@/lib/quiz/sessions";
import { createSessionSchema } from "@/lib/quiz/validation";
import { readEvent } from "@/lib/sync/mongo-read";

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const sessions = await listSessions();
    return json({ sessions: sessions.map((s) => ({ ...adminSummary(s), eventTitle: s.eventTitle })) });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const input = createSessionSchema.parse(await req.json());
    const admin = await requireAdmin(req);
    // Event title is copied once so the live quiz never needs MongoDB.
    const event = await readEvent(input.eventId);
    if (!event) throw new QuizError("not_found", "Event not found");
    const session = await createSession({ ...input, eventTitle: event.title }, admin.email);
    return json({ session: adminSummary(session) }, 201);
  });
}

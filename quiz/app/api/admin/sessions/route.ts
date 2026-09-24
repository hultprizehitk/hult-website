import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { createSession, listSessions } from "@/lib/quiz/sessions";
import { summarizeSession } from "@/lib/quiz/state";
import { createSessionSchema } from "@/lib/quiz/validation";

export async function GET(req: Request) {
  return handle(async () => {
    await connectDB();
    await requireAdmin(req);
    const sessions = await listSessions();
    return json({ sessions: sessions.map(summarizeSession) });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const input = createSessionSchema.parse(await req.json());
    await connectDB();
    const admin = await requireAdmin(req);
    const session = await createSession(input, admin.email);
    return json({ session: summarizeSession(session) }, 201);
  });
}

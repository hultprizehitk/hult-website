import { requireAdmin } from "@/lib/actor";
import { clearAdminCache } from "@/lib/admin";
import { handle, json } from "@/lib/http";
import { getSession } from "@/lib/quiz/sessions";
import { codeSchema } from "@/lib/quiz/validation";
import { readAdminEmails, readEventTeams } from "@/lib/sync/mongo-read";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";

// Copies the event's registered teams (and site admins) from MongoDB into Firestore. Safe to re-run.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const admin = await requireAdmin(req);
    const session = await getSession(code);
    const [teams, admins] = await Promise.all([readEventTeams(session.eventId), readAdminEmails()]);
    const summary = await syncTeamsToFirestore(code, teams, admins);
    clearAdminCache();
    console.info(`[quiz sync] ${code} ${JSON.stringify(summary)} by ${admin.email}`);
    return json({ summary });
  });
}

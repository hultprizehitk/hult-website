import { requireAdmin } from "@/lib/actor";
import { clearAdminCache } from "@/lib/admin";
import { handle, json } from "@/lib/http";
import { getSession } from "@/lib/quiz/sessions";
import { codeSchema } from "@/lib/quiz/validation";
import { readAdminEmails, readEventTeams } from "@/lib/sync/mongo-read";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";

/** Auto-sync from an open console is skipped if any sync ran this recently (two admin tabs, fast reloads). */
const AUTO_MIN_GAP_MS = 60_000;

// Copies the event's registered teams (and site admins) from MongoDB into Firestore. Safe to re-run; refused after Start.
// Body {auto: true} = the console's periodic sync. Cost per run: 2 MongoDB queries, Firestore writes only for changes.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const body = (await req.json().catch(() => ({}))) as { auto?: boolean };
    const admin = await requireAdmin(req);
    const session = await getSession(code);
    if (body.auto && session.lastSyncAt && Date.now() - session.lastSyncAt.toMillis() < AUTO_MIN_GAP_MS) {
      return json({ summary: session.lastSync, skipped: true });
    }
    const [teams, admins] = await Promise.all([readEventTeams(session.eventId), readAdminEmails()]);
    const summary = await syncTeamsToFirestore(code, teams, admins);
    clearAdminCache();
    console.info(`[quiz sync] ${code} ${JSON.stringify(summary)} by ${admin.email}${body.auto ? " (auto)" : ""}`);
    return json({ summary });
  });
}

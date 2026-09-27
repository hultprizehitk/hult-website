import { adminDb } from "@/lib/firebase/admin";
import { paths, type SessionDoc } from "@/lib/quiz/fs-types";
import { readAdminEmails, readEventTeams } from "@/lib/sync/mongo-read";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";

async function main(): Promise<void> {
  const code = process.argv[2] ?? process.env.QUIZ_SESSION_CODE;
  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error("Pass a six-digit quiz session code: npm run sync-teams -- 123456");
  }

  const sessionSnap = await adminDb().doc(paths.session(code)).get();
  if (!sessionSnap.exists) throw new Error(`Quiz session #${code} was not found`);
  const session = sessionSnap.data() as SessionDoc;
  const [teams, admins] = await Promise.all([readEventTeams(session.eventId), readAdminEmails()]);
  const summary = await syncTeamsToFirestore(code, teams, admins);

  console.log(`Session #${code} · ${session.eventTitle}`);
  console.log(`Teams ${summary.total} · eligible ${summary.eligible} · new ${summary.added} · updated ${summary.updated} · ineligible ${summary.removed}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

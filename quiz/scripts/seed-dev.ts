import { adminDb, DEMO_PROJECT_ID } from "@/lib/firebase/admin";
import { addQuestion } from "@/lib/quiz/questions";
import { applyControl, createSession } from "@/lib/quiz/sessions";
import type { SourceTeam } from "@/lib/sync/sync-teams";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";
import { DEV_QUESTIONS } from "./dev-questions";

const SESSION_CODE = "424242";
const mail = (local: string) => `${local}@heritageit.edu.in`;
const pad = (n: number) => String(n).padStart(2, "0");

function requireDemoEmulator(): void {
  if (process.env.GCLOUD_PROJECT !== DEMO_PROJECT_ID || !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(`Refusing to seed outside the ${DEMO_PROJECT_ID} Firestore emulator`);
  }
}

function seedTeams(): SourceTeam[] {
  return Array.from({ length: 50 }, (_, i) => {
    const n = i + 1;
    const suffix = pad(n);
    return {
      id: `dev-team-${suffix}`,
      teamCode: `DEV${suffix}`,
      teamName: `Dev Team ${suffix}`,
      leadEmail: mail(`dev.t${suffix}.lead`),
      lead: { name: `Lead ${suffix}`, email: mail(`dev.t${suffix}.lead`) },
      members: [1, 2, 3].map((m) => ({ name: `Member ${suffix}-${m}`, email: mail(`dev.t${suffix}.m${m}`) })),
      status: n === 50 ? "disqualified" : "confirmed",
      submissionStatus: n === 48 || n === 49 ? "forming" : "submitted",
    };
  });
}

async function main(): Promise<void> {
  requireDemoEmulator();
  const db = adminDb();
  const sessionRef = db.doc(`quizSessions/${SESSION_CODE}`);
  await db.recursiveDelete(sessionRef);

  const session = await createSession(
    { title: "Hult Prize Quiz (Emulator)", eventId: "emulator-seed-event", eventTitle: "DEV Quiz Event", requireSubmitted: true },
    mail("dev.admin"),
    SESSION_CODE,
  );
  const summary = await syncTeamsToFirestore(session.code, seedTeams(), [mail("dev.admin")]);
  for (const question of DEV_QUESTIONS) await addQuestion(session.code, question);
  await applyControl(session.code, { type: "open_lobby" });

  console.log(`Project      ${DEMO_PROJECT_ID} (Firestore emulator)`);
  console.log(`Session      #${SESSION_CODE} (lobby, check-in open, ${DEV_QUESTIONS.length} questions)`);
  console.log(`Teams        ${summary.total} (${summary.eligible} eligible, 2 unsubmitted, 1 disqualified)`);
  console.log(`Admin        ${mail("dev.admin")}`);
  console.log(`Participants ${mail("dev.t01.lead")} .. ${mail("dev.t50.lead")}, members dev.tNN.m1..m3`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

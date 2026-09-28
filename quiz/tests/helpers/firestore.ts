import { adminDb } from "@/lib/firebase/admin";
import { paths, type CountsDoc, type CounterDoc, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import { addQuestion } from "@/lib/quiz/questions";
import { applyControl, createSession } from "@/lib/quiz/sessions";
import type { SourceTeam } from "@/lib/sync/sync-teams";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";

export const mail = (local: string) => `${local}@heritageit.edu.in`;
export const T0 = new Date("2026-10-01T10:00:00.000Z");
export const at = (ms: number) => new Date(T0.getTime() + ms);

/** Wipes the emulator database (tests run with FIRESTORE_EMULATOR_HOST from `firebase emulators:exec`). */
export async function clearFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
  const project = process.env.GCLOUD_PROJECT ?? "demo-hult-quiz";
  const res = await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: "DELETE" });
  if (!res.ok) throw new Error(`clearFirestore failed: ${res.status}`);
}

export function teamId(n: number): string {
  return `aaaaaaaaaaaaaaaaaaaa${String(n).padStart(4, "0")}`;
}

export function srcTeam(n: number, over: Partial<SourceTeam> = {}): SourceTeam {
  return {
    id: teamId(n),
    teamName: `Team ${n}`,
    teamCode: `T${n}`,
    leadEmail: mail(`lead${n}`),
    lead: { name: `Lead ${n}`, email: mail(`lead${n}`) },
    members: [
      { name: `Member ${n}a`, email: mail(`m${n}a`) },
      { name: `Member ${n}b`, email: mail(`m${n}b`) },
    ],
    status: "confirmed",
    submissionStatus: "submitted",
    ...over,
  };
}

export const qInput = (text: string, over: Partial<{ options: string[]; correctIndex: number; points: number; timeLimitSec: number }> = {}) => ({
  text,
  options: ["A", "B", "C", "D"],
  correctIndex: 1,
  points: 100,
  timeLimitSec: 20,
  ...over,
});

/** Session with synced teams and questions, moved to `lobby` (check-in open) unless status is "draft". */
export async function setup(opts: { teams?: SourceTeam[]; questions?: number; status?: "draft" | "lobby"; requireSubmitted?: boolean; admins?: string[] } = {}) {
  const s = await createSession(
    { title: "Quiz", eventId: "e".repeat(24), eventTitle: "Quiz Night", requireSubmitted: opts.requireSubmitted ?? true },
    mail("admin"),
  );
  await syncTeamsToFirestore(s.code, opts.teams ?? [srcTeam(1)], opts.admins ?? []);
  for (let i = 0; i < (opts.questions ?? 2); i++) await addQuestion(s.code, qInput(`Question ${i + 1}`));
  if ((opts.status ?? "lobby") === "lobby") await applyControl(s.code, { type: "open_lobby" }, T0);
  return s.code;
}

export async function readSession(code: string): Promise<SessionDoc> {
  return (await adminDb().doc(paths.session(code)).get()).data() as SessionDoc;
}
export async function readCounts(code: string): Promise<CountsDoc> {
  const [session, counters] = await Promise.all([
    readSession(code),
    adminDb().collection(paths.counts(code)).get(),
  ]);
  const shards = counters.docs.map((d) => d.data() as CounterDoc);
  const answeredFor = session.current?.id ?? null;
  return {
    checkedIn: shards.filter((c) => c.checkedIn).length,
    eligible: shards.filter((c) => c.eligible).length,
    answeredCurrent: shards.filter((c) => c.answered && c.answeredFor === answeredFor).length,
    answeredFor,
  };
}
export async function readTeam(code: string, n: number): Promise<TeamDoc> {
  return (await adminDb().doc(paths.team(code, teamId(n))).get()).data() as TeamDoc;
}
export async function countAnswers(code: string): Promise<number> {
  return (await adminDb().collection(paths.answers(code)).count().get()).data().count;
}

/** Start the quiz and open question 1 at T0 (it accepts answers from T0 + LEAD_IN_MS). */
export async function startAndOpenFirst(code: string): Promise<void> {
  await applyControl(code, { type: "start" }, T0);
  await applyControl(code, { type: "next" }, T0);
}

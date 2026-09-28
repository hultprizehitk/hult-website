import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { isTeamEligible, rosterMembers } from "@/lib/quiz/eligibility";
import { QuizError } from "@/lib/quiz/errors";
import { ADMINS, emptyTeamState, paths, type CounterDoc, type SessionDoc, type SyncSummary, type TeamDoc } from "@/lib/quiz/fs-types";

/** A team as registered on the main site (shape produced by mongo-read.ts). */
export interface SourceTeam {
  id: string;
  teamName: string;
  teamCode: string;
  leadEmail: string;
  lead: { name?: string; email?: string } | undefined;
  members: { name?: string; email?: string }[];
  status?: string;
  submissionStatus?: string;
  checkedIn?: boolean;
  checkedInAt?: Date;
}

const BATCH_LIMIT = 400;

/** Roster fields owned by the main site; anything else on the team doc is quiz state and never touched by sync. */
function rosterKey(r: { teamName: string; teamCode: string; leadEmail: string; members: { name: string; email: string }[]; eligible: boolean; deskScanned?: boolean }): string {
  return JSON.stringify([r.teamName, r.teamCode, r.leadEmail, r.members, r.eligible, !!r.deskScanned]);
}

/**
 * Upserts the event's teams into quizSessions/{code}/teams. Writes only what changed, so a periodic sync
 * costs almost nothing when registrations are stable. Only roster fields are written: check-in, seat and
 * scores are quiz state. A desk scan is recorded as `deskScanned` but does not check the team into the quiz.
 * Teams gone from the site become ineligible (never deleted). Refused once the quiz has started.
 * Also mirrors the site's admin emails into quizAdmins.
 */
export async function syncTeamsToFirestore(code: string, source: SourceTeam[], adminEmails: string[], now: Date = new Date()): Promise<SyncSummary> {
  const db = adminDb();
  const sRef = db.doc(paths.session(code));
  const sSnap = await sRef.get();
  if (!sSnap.exists) throw new QuizError("not_found", "Session not found");
  const s = sSnap.data() as SessionDoc;
  if (s.status === "live" || s.status === "ended") throw new QuizError("invalid_state", "Sync is closed once the quiz starts");

  const existingSnap = await db.collection(paths.teams(code)).get();
  const existing = new Map(existingSnap.docs.map((d) => [d.id, d.data() as TeamDoc]));
  const syncedAt = Timestamp.fromDate(now);

  const writes: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
  let added = 0;
  let updated = 0;
  let removed = 0;
  let eligible = 0;
  const seen = new Set<string>();

  for (const src of source) {
    seen.add(src.id);
    const members = rosterMembers(src.lead, src.members);
    const isEligible = isTeamEligible(src, s.requireSubmitted);
    if (isEligible) eligible += 1;
    const roster = {
      teamId: src.id,
      teamName: src.teamName,
      teamCode: src.teamCode,
      leadEmail: src.leadEmail.toLowerCase(),
      members,
      memberEmails: members.map((m) => m.email),
      eligible: isEligible,
      deskScanned: Boolean(src.checkedIn),
    };
    const ref = db.doc(paths.team(code, src.id));
    const counterRef = db.doc(paths.counter(code, src.id));
    const prev = existing.get(src.id);
    if (!prev) {
      added += 1;
      const doc: TeamDoc<Timestamp> = { ...roster, ...emptyTeamState<Timestamp>(), takerEmail: null, syncedAt };
      const counter: CounterDoc = {
        teamId: src.id,
        teamName: src.teamName,
        teamCode: src.teamCode,
        playerName: null,
        playerEmail: null,
        eligible: isEligible,
        checkedIn: false,
        answeredFor: null,
        answered: false,
      };
      writes.push((b) => b.set(ref, doc));
      writes.push((b) => b.set(counterRef, counter));
      continue;
    }
    if (rosterKey(roster) === rosterKey(prev)) continue;
    updated += 1;
    const patch: Record<string, unknown> = { ...roster, syncedAt };
    // The player left the team on the site: free the seat.
    if (prev.takerEmail && !roster.memberEmails.includes(prev.takerEmail)) {
      patch.takerEmail = null;
      patch.deviceId = null;
    }
    writes.push((b) => b.set(ref, patch, { merge: true }));
    writes.push(
      (b) =>
        b.set(
          counterRef,
          { teamId: src.id, teamName: src.teamName, teamCode: src.teamCode, eligible: isEligible },
          { merge: true },
        ),
    );
  }
  for (const [id, t] of existing) {
    if (seen.has(id) || !t.eligible) continue;
    removed += 1;
    writes.push((b) => b.update(db.doc(paths.team(code, id)), { eligible: false, syncedAt }));
    writes.push((b) => b.set(db.doc(paths.counter(code, id)), { teamId: id, eligible: false }, { merge: true }));
  }

  const summary: SyncSummary = { total: source.length, eligible, added, updated, removed };
  writes.push((b) => b.update(sRef, { lastSyncAt: syncedAt, lastSync: summary }));

  const admins = new Set(adminEmails.map((e) => e.toLowerCase().trim()).filter(Boolean));
  const adminSnap = await db.collection(ADMINS).get();
  const known = new Set(adminSnap.docs.map((d) => d.id));
  // Only remove admins managed by this sync. Manually added quizAdmins entries survive future syncs.
  for (const d of adminSnap.docs) {
    if (d.data().source === "site" && !admins.has(d.id)) writes.push((b) => b.delete(d.ref));
  }
  for (const email of admins) if (!known.has(email)) writes.push((b) => b.set(db.doc(paths.admin(email)), { email, source: "site", syncedAt }));

  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    writes.slice(i, i + BATCH_LIMIT).forEach((w) => w(batch));
    await batch.commit();
  }
  return summary;
}

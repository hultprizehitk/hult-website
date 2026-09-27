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
}

const BATCH_LIMIT = 400;

/**
 * Upserts the event's teams into quizSessions/{code}/teams. Only roster fields are overwritten:
 * check-in, taker, device and scores survive a re-sync. Teams gone from the site become ineligible (never deleted).
 * Also mirrors the site's admin emails into quizAdmins.
 */
export async function syncTeamsToFirestore(code: string, source: SourceTeam[], adminEmails: string[], now: Date = new Date()): Promise<SyncSummary> {
  const db = adminDb();
  const sRef = db.doc(paths.session(code));
  const sSnap = await sRef.get();
  if (!sSnap.exists) throw new QuizError("not_found", "Session not found");
  const s = sSnap.data() as SessionDoc;

  const existingSnap = await db.collection(paths.teams(code)).get();
  const existing = new Map(existingSnap.docs.map((d) => [d.id, d.data() as TeamDoc]));
  const countersSnap = await db.collection(paths.counts(code)).get();
  const counters = new Map(countersSnap.docs.map((d) => [d.id, d.data() as CounterDoc]));
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
    const leadEmail = src.leadEmail.toLowerCase();
    const isEligible = isTeamEligible(src, s.requireSubmitted);
    if (isEligible) eligible += 1;
    const roster = {
      teamId: src.id,
      teamName: src.teamName,
      teamCode: src.teamCode,
      leadEmail,
      members,
      memberEmails: members.map((m) => m.email),
      eligible: isEligible,
      syncedAt,
    };
    const ref = db.doc(paths.team(code, src.id));
    const prev = existing.get(src.id);
    const prevCounter = counters.get(src.id);
    const counter: CounterDoc = {
      teamId: src.id,
      eligible: isEligible,
      checkedIn: prevCounter?.checkedIn ?? !!prev?.checkedInAt,
      answeredFor: prevCounter?.answeredFor ?? prev?.currentAnswer?.qid ?? null,
      answered: prevCounter?.answered ?? !!prev?.currentAnswer,
    };
    writes.push((b) => b.set(db.doc(paths.counter(code, src.id)), counter));
    if (prev) {
      updated += 1;
      const patch: Record<string, unknown> = { ...roster };
      // The chosen taker left the team on the site: fall back to the lead.
      if (prev.takerEmail && !roster.memberEmails.includes(prev.takerEmail)) {
        patch.takerEmail = leadEmail;
        patch.deviceId = null;
      }
      writes.push((b) => b.set(ref, patch, { merge: true }));
    } else {
      added += 1;
      const doc: TeamDoc<Timestamp> = { ...roster, ...emptyTeamState<Timestamp>(), takerEmail: leadEmail };
      writes.push((b) => b.set(ref, doc));
    }
  }
  for (const [id, t] of existing) {
    if (seen.has(id)) continue;
    removed += 1;
    if (t.eligible) writes.push((b) => b.update(db.doc(paths.team(code, id)), { eligible: false, syncedAt }));
    const counter = counters.get(id);
    if (counter?.eligible) writes.push((b) => b.update(db.doc(paths.counter(code, id)), { eligible: false }));
  }

  const summary: SyncSummary = { total: source.length, eligible, added, updated, removed };
  writes.push((b) => b.update(sRef, { lastSyncAt: syncedAt, lastSync: summary }));

  const admins = new Set(adminEmails.map((e) => e.toLowerCase().trim()).filter(Boolean));
  const adminSnap = await db.collection(ADMINS).get();
  // Only remove admins managed by this sync. Manually added quizAdmins entries survive future syncs.
  for (const d of adminSnap.docs) {
    if (d.data().source === "site" && !admins.has(d.id)) writes.push((b) => b.delete(d.ref));
  }
  for (const email of admins) writes.push((b) => b.set(db.doc(paths.admin(email)), { email, source: "site", syncedAt }));

  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    writes.slice(i, i + BATCH_LIMIT).forEach((w) => w(batch));
    await batch.commit();
  }
  return summary;
}

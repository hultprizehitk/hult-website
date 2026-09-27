import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { QuizError } from "./errors";
import { paths, SESSIONS, type SessionDoc, type TeamDoc } from "./fs-types";
import { latePenaltyMs } from "./grading";

export interface JoinResult {
  teamId: string;
  role: "taker" | "teammate";
  deviceOk: boolean;
}

async function readSession(tx: Transaction, code: string): Promise<SessionDoc> {
  const snap = await tx.get(adminDb().doc(paths.session(code)));
  if (!snap.exists) throw new QuizError("not_found", "Session not found");
  return snap.data() as SessionDoc;
}

/** The team (in this session) that has `email` as lead or member. One array-contains query = 1 read. */
async function teamForEmail(code: string, email: string) {
  const q = adminDb().collection(paths.teams(code)).where("memberEmails", "array-contains", email).limit(1);
  const snap = await q.get();
  return snap.empty ? null : { ref: snap.docs[0].ref, team: snap.docs[0].data() as TeamDoc };
}

function checkInPatch(s: SessionDoc, t: TeamDoc, by: string, now: Date): Record<string, unknown> {
  return {
    checkedInAt: Timestamp.fromDate(now),
    checkedInBy: by,
    // Joined after some questions were graded: charge their full time so late arrival can't win a tie-break.
    totalTimeMs: t.totalTimeMs + latePenaltyMs(s.plan, s.gradedThrough),
    takerEmail: t.takerEmail ?? t.leadEmail,
  };
}

/** Check the team in (if needed) and bind the taker's device. Idempotent; safe to call on every page load. */
export async function joinSession(code: string, email: string, deviceId: string, now: Date = new Date()): Promise<JoinResult> {
  const db = adminDb();
  // Resolve the email query before starting a transaction. Doing this query in every
  // concurrent check-in transaction makes Firestore's emulator lock the whole teams
  // query range and serializes otherwise independent teams.
  const found = await teamForEmail(code, email);
  if (!found) throw new QuizError("not_registered", "No registered team for this account");
  return db.runTransaction(async (tx) => {
    const s = await readSession(tx, code);
    const teamSnap = await tx.get(found.ref);
    if (!teamSnap.exists) throw new QuizError("not_registered", "No registered team for this account");
    const ref = teamSnap.ref;
    const team = teamSnap.data() as TeamDoc;
    if (!team.memberEmails.includes(email)) throw new QuizError("not_registered", "No registered team for this account");
    if (!team.eligible) throw new QuizError("ineligible", "Team is not eligible");

    const patch: Record<string, unknown> = {};
    let t = team;
    if (!team.checkedInAt) {
      if (s.status === "draft" || s.status === "ended") throw new QuizError("invalid_state", "Session is not open");
      if (!s.checkinOpen) throw new QuizError("checkin_closed", "Check-in is closed");
      Object.assign(patch, checkInPatch(s, team, email, now));
      tx.update(db.doc(paths.counter(code, team.teamId)), { checkedIn: true });
      t = { ...team, takerEmail: patch.takerEmail as string };
    }

    // Single-device / Single-player team enforcement:
    // If a device is already bound to another teammate, reject this member until the teammate signs out
    if (team.deviceId && team.takerEmail && team.takerEmail !== email) {
      throw new QuizError(
        "team_already_active",
        `A teammate (${team.takerEmail}) is currently active for ${team.teamName}. Only 1 device can play. They must sign out to hand over the device.`
      );
    }

    // Bind this member as the active player & device
    if (!team.deviceId || team.takerEmail === email) {
      patch.takerEmail = email;
      patch.deviceId = deviceId;
      t = { ...t, takerEmail: email, deviceId };
    }

    const role = "taker";
    const deviceBound = patch.deviceId ?? team.deviceId;
    if (Object.keys(patch).length > 0) tx.update(ref, patch);
    return { teamId: team.teamId, role, deviceOk: deviceBound === deviceId };
  });
}

/** Release team device binding when a player signs out so another teammate can take over. */
export async function releaseTeamDevice(email: string, code?: string): Promise<void> {
  const db = adminDb();
  if (code) {
    const found = await teamForEmail(code, email);
    if (found && found.team.takerEmail === email) {
      await found.ref.update({ deviceId: null, takerEmail: null });
    }
  } else {
    const sessionsSnap = await db.collection(SESSIONS).where("status", "in", ["lobby", "live", "draft"]).get();
    for (const sDoc of sessionsSnap.docs) {
      const found = await teamForEmail(sDoc.id, email);
      if (found && found.team.takerEmail === email) {
        await found.ref.update({ deviceId: null, takerEmail: null });
      }
    }
  }
}

export async function setTaker(code: string, actorEmail: string, takerEmail: string): Promise<TeamDoc> {
  const found = await teamForEmail(code, actorEmail);
  if (!found) throw new QuizError("not_registered", "Check in first");
  return adminDb().runTransaction(async (tx) => {
    const s = await readSession(tx, code);
    if (s.status !== "lobby") throw new QuizError("invalid_state", "Taker is locked");
    const snap = await tx.get(found.ref);
    if (!snap.exists) throw new QuizError("not_registered", "Check in first");
    const ref = snap.ref;
    const team = snap.data() as TeamDoc;
    if (!team.memberEmails.includes(actorEmail) || !team.checkedInAt) throw new QuizError("not_registered", "Check in first");
    if (team.leadEmail !== actorEmail) throw new QuizError("not_lead", "Only the team lead can choose");
    if (!team.memberEmails.includes(takerEmail)) throw new QuizError("invalid_input", "Not a team member");
    if (team.takerEmail === takerEmail) return team;
    tx.update(ref, { takerEmail, deviceId: null });
    return { ...team, takerEmail, deviceId: null };
  });
}

async function requireTeam(tx: Transaction, code: string, teamId: string) {
  const snap = await tx.get(adminDb().doc(paths.team(code, teamId)));
  if (!snap.exists) throw new QuizError("not_found", "Team not found");
  return { ref: snap.ref, team: snap.data() as TeamDoc };
}

/** Organizer override: checks a team in even if check-in is closed or the team is not eligible. */
export async function adminCheckin(code: string, teamId: string, adminEmail: string, now: Date = new Date()): Promise<void> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const s = await readSession(tx, code);
    if (s.status === "ended") throw new QuizError("invalid_state", "Session ended");
    const { ref, team } = await requireTeam(tx, code, teamId);
    if (team.checkedInAt) return;
    tx.update(ref, checkInPatch(s, team, adminEmail, now));
    tx.update(db.doc(paths.counter(code, teamId)), { checkedIn: true });
  });
}

export async function adminReassignTaker(code: string, teamId: string, email: string): Promise<void> {
  await adminDb().runTransaction(async (tx) => {
    const { ref, team } = await requireTeam(tx, code, teamId);
    if (!team.checkedInAt) throw new QuizError("not_found", "Team is not checked in");
    if (!team.memberEmails.includes(email)) throw new QuizError("invalid_input", "Not a team member");
    tx.update(ref, { takerEmail: email, deviceId: null });
  });
}

export async function adminResetDevice(code: string, teamId: string): Promise<void> {
  await adminDb().runTransaction(async (tx) => {
    const { ref, team } = await requireTeam(tx, code, teamId);
    if (!team.checkedInAt) throw new QuizError("not_found", "Team is not checked in");
    tx.update(ref, { deviceId: null });
  });
}

import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { QuizError } from "./errors";
import { paths, SESSIONS, type SessionDoc, type TeamDoc } from "./fs-types";

export interface JoinResult {
  teamId: string;
  role: "taker" | "teammate";
  deviceOk: boolean;
}

/** Venue desk scan lookup (main site). "unknown" = lookup failed; sign-in already enforced the gate, so allow. */
export type VenueCheck = (email: string) => Promise<"ok" | "not_checked_in" | "unknown">;

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

/**
 * Quiz check-in + the team's single seat (one phone per team, spec 2026-09-28 U2-U4).
 * - First eligible member to open the quiz while check-in is open checks the team in and takes the seat.
 * - Check-in closes at Start: teams not in by then are refused (no late teams).
 * - The seat is `takerEmail` + `deviceId`. A seat reserved for you (admin "Switch player") binds automatically.
 *   A free seat, or your own seat on another device, needs `claim` (an explicit "Play here" tap).
 * Idempotent; safe to call on every page load.
 */
export async function joinSession(
  code: string,
  email: string,
  deviceId: string,
  now: Date = new Date(),
  opts: { claim?: boolean; venueCheck?: VenueCheck } = {},
): Promise<JoinResult> {
  const db = adminDb();
  // Resolve the email query before starting a transaction. Doing this query in every
  // concurrent check-in transaction makes Firestore's emulator lock the whole teams
  // query range and serializes otherwise independent teams.
  const found = await teamForEmail(code, email);
  if (!found) throw new QuizError("not_registered", "No registered team for this account");
  // Desk scan is checked once, before the team's first check-in. MongoDB is never read after Start.
  if (!found.team.checkedInAt && found.team.eligible && opts.venueCheck) {
    if ((await opts.venueCheck(email)) === "not_checked_in") throw new QuizError("not_checked_in", "Scan your pass at the desk first");
  }
  return db.runTransaction(async (tx) => {
    const s = await readSession(tx, code);
    const teamSnap = await tx.get(found.ref);
    if (!teamSnap.exists) throw new QuizError("not_registered", "No registered team for this account");
    const team = teamSnap.data() as TeamDoc;
    if (!team.memberEmails.includes(email)) throw new QuizError("not_registered", "No registered team for this account");
    if (!team.eligible) throw new QuizError("ineligible", "Team is not eligible");

    const patch: Record<string, unknown> = {};
    const firstCheckIn = !team.checkedInAt;
    if (firstCheckIn) {
      if (s.status === "draft") throw new QuizError("invalid_state", "Check-in opens soon");
      if (s.status !== "lobby") throw new QuizError("checkin_closed", "Check-in is closed");
      if (!s.checkinOpen) throw new QuizError("checkin_closed", "Check-in is paused");
      patch.checkedInAt = Timestamp.fromDate(now);
      patch.checkedInBy = email;
      tx.update(db.doc(paths.counter(code, team.teamId)), { checkedIn: true });
    }

    const mine = team.takerEmail === email;
    const seatFree = !team.deviceId && !team.takerEmail;
    const reservedForMe = !team.deviceId && mine;
    const movingMine = mine && !!team.deviceId && team.deviceId !== deviceId && !!opts.claim;
    // The first check-in always takes the seat (any older default taker is ignored).
    const takesSeat = reservedForMe || movingMine || (!team.deviceId && firstCheckIn) || (seatFree && !!opts.claim);
    if (takesSeat) {
      patch.takerEmail = email;
      patch.deviceId = deviceId;
    }
    if (Object.keys(patch).length > 0) tx.update(found.ref, patch);

    const takerEmail = takesSeat ? email : team.takerEmail;
    const boundDevice = takesSeat ? deviceId : team.deviceId;
    return { teamId: team.teamId, role: takerEmail === email ? "taker" : "teammate", deviceOk: takerEmail === email && boundDevice === deviceId };
  });
}

/** Sign-out frees the seat so a teammate can take over ("Play on this phone"). */
export async function releaseTeamDevice(email: string, code?: string): Promise<void> {
  const db = adminDb();
  const codes = code
    ? [code]
    : (await db.collection(SESSIONS).where("status", "in", ["lobby", "live", "draft"]).get()).docs.map((d) => d.id);
  for (const c of codes) {
    const found = await teamForEmail(c, email);
    if (found && found.team.takerEmail === email) await found.ref.update({ deviceId: null, takerEmail: null });
  }
}

async function requireTeam(tx: Transaction, code: string, teamId: string) {
  const snap = await tx.get(adminDb().doc(paths.team(code, teamId)));
  if (!snap.exists) throw new QuizError("not_found", "Team not found");
  return { ref: snap.ref, team: snap.data() as TeamDoc };
}

/** Admin "Switch player": reserves the seat for `email`; their phone binds on its own. Answers already given stay. */
export async function adminReassignTaker(code: string, teamId: string, email: string): Promise<void> {
  await adminDb().runTransaction(async (tx) => {
    const { ref, team } = await requireTeam(tx, code, teamId);
    if (!team.checkedInAt) throw new QuizError("invalid_state", "Team is not checked in");
    if (!team.memberEmails.includes(email)) throw new QuizError("invalid_input", "Not a team member");
    tx.update(ref, { takerEmail: email, deviceId: null });
  });
}

/** Admin "Free seat": any member can tap "Play on this phone". */
export async function adminFreeSeat(code: string, teamId: string): Promise<void> {
  await adminDb().runTransaction(async (tx) => {
    const { ref, team } = await requireTeam(tx, code, teamId);
    if (!team.checkedInAt) throw new QuizError("invalid_state", "Team is not checked in");
    tx.update(ref, { takerEmail: null, deviceId: null });
  });
}

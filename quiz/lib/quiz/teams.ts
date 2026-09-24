import { Types } from "mongoose";
import { Team, type MirrorTeam } from "@/models/mirror";
import { QuizAnswer, QuizTeam, type QuizSessionDoc, type QuizTeamDoc } from "@/models/quiz";
import { QuizError } from "./errors";
import { invalidateSnapshot } from "./cache";
import type { TeamBoardRow } from "./types";

type SessionLike = Pick<QuizSessionDoc, "_id" | "code" | "eventId" | "status" | "checkinOpen" | "requireSubmitted">;

export interface JoinResult {
  quizTeam: QuizTeamDoc;
  role: "taker" | "teammate";
  deviceOk: boolean;
}

export function isTeamEligible(team: Pick<MirrorTeam, "status" | "submissionStatus">, requireSubmitted: boolean): boolean {
  return team.status === "confirmed" && (!requireSubmitted || team.submissionStatus === "submitted");
}

export function eligibleFilter(session: Pick<SessionLike, "eventId" | "requireSubmitted">): Record<string, unknown> {
  const filter: Record<string, unknown> = { eventId: session.eventId, status: "confirmed" };
  if (session.requireSubmitted) filter.submissionStatus = "submitted";
  return filter;
}

export async function countEligibleTeams(session: Pick<SessionLike, "eventId" | "requireSubmitted">): Promise<number> {
  return Team.countDocuments(eligibleFilter(session));
}

export async function findTeamForEmail(eventId: Types.ObjectId, email: string): Promise<MirrorTeam | null> {
  return Team.findOne({ eventId, $or: [{ leadEmail: email }, { "members.email": email }] }).lean<MirrorTeam>();
}

export async function findQuizTeamForEmail(sessionId: Types.ObjectId, email: string): Promise<QuizTeamDoc | null> {
  return QuizTeam.findOne({ sessionId, memberEmails: email }).lean<QuizTeamDoc>();
}

function snapshotMembers(team: MirrorTeam): { name: string; email: string }[] {
  const seen = new Set<string>();
  const out: { name: string; email: string }[] = [];
  for (const p of [team.lead, ...(team.members ?? [])]) {
    const email = (p?.email ?? "").toLowerCase().trim();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({ name: p.name ?? email.split("@")[0], email });
  }
  return out;
}

async function ensureQuizTeam(session: SessionLike, team: MirrorTeam, checkedInBy: string, now: Date): Promise<QuizTeamDoc> {
  const members = snapshotMembers(team);
  try {
    await QuizTeam.updateOne(
      { sessionId: session._id, teamId: team._id },
      {
        $setOnInsert: {
          teamName: team.teamName,
          teamCode: team.teamCode,
          leadEmail: team.leadEmail.toLowerCase(),
          members,
          memberEmails: members.map((m) => m.email),
          checkedInAt: now,
          checkedInBy,
          takerEmail: team.leadEmail.toLowerCase(),
          deviceId: null,
          deviceBoundAt: null,
        },
      },
      { upsert: true },
    );
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  invalidateSnapshot(session.code);
  return (await QuizTeam.findOne({ sessionId: session._id, teamId: team._id }).lean<QuizTeamDoc>())!;
}

export async function joinSession(session: SessionLike, email: string, deviceId: string, now: Date = new Date()): Promise<JoinResult> {
  let qt = await findQuizTeamForEmail(session._id, email);
  if (!qt) {
    if (session.status === "draft" || session.status === "ended") throw new QuizError("invalid_state", "Session is not open");
    const team = await findTeamForEmail(session.eventId, email);
    if (!team) throw new QuizError("not_registered", "No registered team for this account");
    if (!isTeamEligible(team, session.requireSubmitted)) throw new QuizError("ineligible", "Team is not eligible");
    if (!session.checkinOpen) throw new QuizError("checkin_closed", "Check-in is closed");
    qt = await ensureQuizTeam(session, team, email, now);
  }
  if (qt.takerEmail !== email) return { quizTeam: qt, role: "teammate", deviceOk: false };
  if (!qt.deviceId) {
    const bound = await QuizTeam.findOneAndUpdate(
      { _id: qt._id, takerEmail: email, deviceId: null },
      { $set: { deviceId, deviceBoundAt: now } },
      { new: true },
    ).lean<QuizTeamDoc>();
    qt = bound ?? (await QuizTeam.findById(qt._id).lean<QuizTeamDoc>())!;
    invalidateSnapshot(session.code);
  }
  return { quizTeam: qt, role: "taker", deviceOk: qt.deviceId === deviceId };
}

export async function setTaker(session: SessionLike, actorEmail: string, takerEmail: string): Promise<QuizTeamDoc> {
  if (session.status !== "lobby") throw new QuizError("invalid_state", "Taker is locked");
  const qt = await findQuizTeamForEmail(session._id, actorEmail);
  if (!qt) throw new QuizError("not_registered", "Check in first");
  if (qt.leadEmail !== actorEmail) throw new QuizError("not_lead", "Only the team lead can choose");
  if (!qt.memberEmails.includes(takerEmail)) throw new QuizError("invalid_input", "Not a team member");
  if (qt.takerEmail === takerEmail) return qt;
  const updated = await QuizTeam.findOneAndUpdate(
    { _id: qt._id },
    { $set: { takerEmail, deviceId: null, deviceBoundAt: null } },
    { new: true },
  ).lean<QuizTeamDoc>();
  invalidateSnapshot(session.code);
  return updated!;
}

async function requireQuizTeam(session: SessionLike, teamId: string): Promise<QuizTeamDoc> {
  const qt = await QuizTeam.findOne({ sessionId: session._id, teamId: new Types.ObjectId(teamId) }).lean<QuizTeamDoc>();
  if (!qt) throw new QuizError("not_found", "Team is not checked in");
  return qt;
}

export async function adminCheckin(session: SessionLike, teamId: string, adminEmail: string, now: Date = new Date()): Promise<QuizTeamDoc> {
  if (session.status === "ended") throw new QuizError("invalid_state", "Session ended");
  const team = await Team.findOne({ _id: teamId, eventId: session.eventId }).lean<MirrorTeam>();
  if (!team) throw new QuizError("not_found", "Team not found for this event");
  return ensureQuizTeam(session, team, adminEmail, now);
}

export async function adminReassignTaker(session: SessionLike, teamId: string, email: string): Promise<QuizTeamDoc> {
  const qt = await requireQuizTeam(session, teamId);
  if (!qt.memberEmails.includes(email)) throw new QuizError("invalid_input", "Not a team member");
  const updated = await QuizTeam.findOneAndUpdate(
    { _id: qt._id },
    { $set: { takerEmail: email, deviceId: null, deviceBoundAt: null } },
    { new: true },
  ).lean<QuizTeamDoc>();
  invalidateSnapshot(session.code);
  return updated!;
}

export async function adminResetDevice(session: SessionLike, teamId: string): Promise<QuizTeamDoc> {
  const qt = await requireQuizTeam(session, teamId);
  const updated = await QuizTeam.findOneAndUpdate(
    { _id: qt._id },
    { $set: { deviceId: null, deviceBoundAt: null } },
    { new: true },
  ).lean<QuizTeamDoc>();
  invalidateSnapshot(session.code);
  return updated!;
}

export async function teamBoard(session: SessionLike, currentQuestionId: string | null): Promise<TeamBoardRow[]> {
  const [teams, quizTeams, answered] = await Promise.all([
    Team.find({ eventId: session.eventId }).lean<MirrorTeam[]>(),
    QuizTeam.find({ sessionId: session._id }).lean<QuizTeamDoc[]>(),
    currentQuestionId
      ? QuizAnswer.find({ sessionId: session._id, questionId: new Types.ObjectId(currentQuestionId) }).select("teamId").lean()
      : Promise.resolve([] as { teamId: Types.ObjectId }[]),
  ]);
  const qtByTeam = new Map(quizTeams.map((q) => [String(q.teamId), q]));
  const answeredSet = new Set(answered.map((a) => String(a.teamId)));
  const rows: TeamBoardRow[] = teams.map((t) => {
    const qt = qtByTeam.get(String(t._id));
    return {
      teamId: String(t._id),
      teamName: t.teamName,
      teamCode: t.teamCode,
      leadEmail: t.leadEmail,
      eligible: isTeamEligible(t, session.requireSubmitted),
      checkedIn: !!qt,
      checkedInAt: qt ? new Date(qt.checkedInAt).getTime() : null,
      takerEmail: qt?.takerEmail ?? null,
      deviceBound: !!qt?.deviceId,
      answeredCurrent: answeredSet.has(String(t._id)),
      members: qt?.members ?? snapshotMembers(t),
    };
  });
  return rows.sort((a, b) => Number(b.checkedIn) - Number(a.checkedIn) || a.teamName.localeCompare(b.teamName));
}

// READ-ONLY access to the main site's MongoDB. This is the only quiz module that talks to Mongo.
// The connection string may have write rights (lead's decision), so this file must only use read calls:
// tests/unit/sync-guard.test.ts fails the build if a write method appears here.
import { connectDB } from "@/lib/db";
import { Event, Team, User, type MirrorEvent, type MirrorTeam, type MirrorUser } from "@/models/mirror";
import type { SourceTeam } from "./sync-teams";

const ADMIN_ROLES: MirrorUser["role"][] = ["junior_admin", "lead_admin", "master_admin"];

export async function readEvents(): Promise<{ id: string; title: string; date: string }[]> {
  await connectDB();
  const events = await Event.find().select("title date").sort({ createdAt: -1 }).lean<MirrorEvent[]>();
  return events.map((e) => ({ id: String(e._id), title: e.title, date: e.date }));
}

export async function readEvent(id: string): Promise<{ id: string; title: string } | null> {
  await connectDB();
  const e = await Event.findById(id).select("title").lean<MirrorEvent>();
  return e ? { id: String(e._id), title: e.title } : null;
}

export async function readEventTeams(eventId: string): Promise<SourceTeam[]> {
  await connectDB();
  const teams = await Team.find({
    eventId,
    status: "confirmed",
    $or: [{ submissionStatus: "submitted" }, { submittedAt: { $exists: true, $ne: null } }],
  }).lean<MirrorTeam[]>();
  return teams.map((t) => ({
    id: String(t._id),
    teamName: t.teamName,
    teamCode: t.teamCode,
    leadEmail: (t.leadEmail ?? "").toLowerCase(),
    lead: t.lead,
    members: t.members ?? [],
    status: t.status,
    submissionStatus: t.submissionStatus ?? (t.submittedAt ? "submitted" : undefined),
    checkedIn: Boolean(t.checkedIn || t.lead?.checkedIn || t.members?.some((m) => m.checkedIn)),
    checkedInAt: t.checkedInAt ?? (t.checkedIn ? new Date() : undefined),
  }));
}

export const HULT_ASCEND_EVENT_ID = "6ab408ecabbcbb77e95c6d98";

export async function readAdminEmails(): Promise<string[]> {
  await connectDB();
  const users = await User.find({ role: { $in: ADMIN_ROLES } }).select("email").lean<MirrorUser[]>();
  return users.map((u) => u.email.toLowerCase());
}

export interface UserRegistrationCheck {
  allowed: boolean;
  reason?: "not_registered" | "not_eligible" | "not_checked_in";
  user?: { name?: string; email?: string; role?: string };
  team?: { teamName: string; status: string; submissionStatus?: string; checkedIn?: boolean };
}

/**
 * Desk-scan re-check at the team's first quiz check-in (catches sessions signed in before the scan).
 * "unknown" when MongoDB is unavailable: sign-in already enforced the gate, so the quiz allows it.
 */
export async function venueCheckStatus(email: string): Promise<"ok" | "not_checked_in" | "unknown"> {
  if (!process.env.MONGODB_URI) return "unknown";
  try {
    const r = await registrationCheck(email);
    return r.allowed ? "ok" : r.reason === "not_checked_in" ? "not_checked_in" : "unknown";
  } catch (err) {
    console.warn("[quiz] venue check unavailable:", err);
    return "unknown";
  }
}

/** Check if user is registered and venue checked-in for Hult Ascend. */
export async function checkUserRegistration(email: string): Promise<UserRegistrationCheck> {
  try {
    return await registrationCheck(email);
  } catch (err) {
    console.error("[quiz auth] Failed to check user registration in MongoDB:", err);
    // No MongoDB configured (local emulator dev): the gate is off.
    if (!process.env.MONGODB_URI) return { allowed: true };
    return { allowed: false, reason: "not_registered" };
  }
}

async function registrationCheck(email: string): Promise<UserRegistrationCheck> {
  const clean = email.toLowerCase().trim();
  if (!clean) return { allowed: false, reason: "not_registered" };
  await connectDB();

  // 1. Admins in MongoDB users collection are always authorized
  const adminUser = await User.findOne({
    email: clean,
    role: { $in: ADMIN_ROLES },
  }).select("name email role").lean<MirrorUser>();
  if (adminUser) {
    return { allowed: true, user: adminUser };
  }

  // 2. Check if user exists in MongoDB users collection
  const user = await User.findOne({ email: clean }).select("name email role").lean<MirrorUser>();

  // 3. Check if user is part of a confirmed, fully registered team for HULT ASCEND : The Rise Begins
  const team = await Team.findOne({
    eventId: HULT_ASCEND_EVENT_ID,
    $or: [{ leadEmail: clean }, { "members.email": clean }],
  }).select("teamName status submissionStatus submittedAt leadEmail lead members checkedIn").lean<MirrorTeam>();

  if (!team) {
    // User is either not registered on the site or not on a team for HULT ASCEND
    return { allowed: false, reason: "not_registered", user: user ?? undefined };
  }

  // 4. Check Venue Check-In (must be scanned at the SV Auditorium desk)
  const isTeamCheckedIn = Boolean((team as unknown as { checkedIn?: boolean }).checkedIn);
  const isLead = team.leadEmail === clean;
  const isLeadCheckedIn = Boolean(team.lead && (team.lead as unknown as { checkedIn?: boolean }).checkedIn);
  const memberObj = team.members?.find((m) => (m.email ?? "").toLowerCase().trim() === clean);
  const isMemberCheckedIn = Boolean(memberObj && (memberObj as unknown as { checkedIn?: boolean }).checkedIn);
  const isCheckedIn = isTeamCheckedIn || (isLead ? isLeadCheckedIn : isMemberCheckedIn);

  // Must be confirmed AND fully registered (submitted)
  const isConfirmed = team.status === "confirmed";
  const isSubmitted = team.submissionStatus === "submitted" || Boolean(team.submittedAt);
  const isEligible = isConfirmed && isSubmitted;

  if (!isEligible) {
    return {
      allowed: false,
      reason: "not_eligible",
      user: user ?? undefined,
      team: {
        teamName: team.teamName,
        status: team.status,
        submissionStatus: team.submissionStatus,
      },
    };
  }

  if (!isCheckedIn) {
    return {
      allowed: false,
      reason: "not_checked_in",
      user: user ?? undefined,
      team: {
        teamName: team.teamName,
        status: team.status,
        submissionStatus: team.submissionStatus,
        checkedIn: false,
      },
    };
  }

  return {
    allowed: true,
    user: user ?? undefined,
    team: {
      teamName: team.teamName,
      status: team.status,
      submissionStatus: team.submissionStatus,
      checkedIn: true,
    },
  };
}



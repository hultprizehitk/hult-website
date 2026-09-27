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
  const teams = await Team.find({ eventId }).lean<MirrorTeam[]>();
  return teams.map((t) => ({
    id: String(t._id),
    teamName: t.teamName,
    teamCode: t.teamCode,
    leadEmail: (t.leadEmail ?? "").toLowerCase(),
    lead: t.lead,
    members: t.members ?? [],
    status: t.status,
    submissionStatus: t.submissionStatus,
  }));
}

export async function readAdminEmails(): Promise<string[]> {
  await connectDB();
  const users = await User.find({ role: { $in: ADMIN_ROLES } }).select("email").lean<MirrorUser[]>();
  return users.map((u) => u.email.toLowerCase());
}

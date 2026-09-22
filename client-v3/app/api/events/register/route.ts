import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SEED_EVENTS } from "@/lib/seed-data";

/**
 * TEMPORARY frontend-only stub for team registration.
 * In-memory registry keyed by the student's email (from the localStorage cookie
 * mirrored by client/lib.auth-client.ts). Lost on server restart — fine for a
 * stateless frontend demo, replaced by MongoDB + auth later.
 *
 * SWAP POINT: restore `client/app/api/events/register/route.ts` when backend lands.
 */

interface TeamMember {
  name: string;
  email: string;
  phone: string;
  roll: string;
  department: string;
}

interface Team {
  _id: string;
  eventId: string;
  teamName: string;
  ventureName: string;
  teamCode: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadRoll: string;
  department: string;
  members: TeamMember[];
  membersCount: number;
  status: "pending" | "confirmed";
}

const registry = new Map<string, Team>(); // teamCode -> team
const ownedBy = new Map<string, string>(); // `${email}|${eventId}` -> teamCode

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function readSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("hult_v3_session")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw) || null;
  } catch {
    return null;
  }
}

function getTeamForStudent(email: string, eventId: string): Team | null {
  const teamCode = ownedBy.get(`${email}|${eventId}`);
  if (!teamCode) return null;
  const team = registry.get(teamCode);
  return team || null;
}

export async function GET(req: NextRequest) {
  const email = await readSessionEmail();
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!email) {
    return NextResponse.json(
      eventId ? { team: null } : { registrations: [] }
    );
  }

  if (eventId) {
    return NextResponse.json({ team: getTeamForStudent(email, eventId) });
  }

  const registrations = [];
  for (const team of registry.values()) {
    if (team.leadEmail === email) {
      const event = SEED_EVENTS.find((e) => e._id === team.eventId);
      registrations.push({
        eventId: team.eventId,
        eventTitle: event?.title || "Event",
        eventTag: event?.tag || "Workshop",
        team,
      });
    }
  }

  return NextResponse.json({ registrations });
}

type RegisterBody = {
  action?: string;
  eventId?: string;
  teamName?: string;
  ventureName?: string;
  leadName?: string;
  leadPhone?: string;
  leadRoll?: string;
  department?: string;
  membersCount?: number;
  teamCode?: string;
  phone?: string;
  roll?: string;
  name?: string;
};

export async function POST(req: NextRequest) {
  const email = await readSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: RegisterBody = {};
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const event = SEED_EVENTS.find((e) => e._id === body.eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const maxMembers = event.maxTeamMembers || 5;

  if (body.action === "join") {
    const teamCode = String(body.teamCode || "").toUpperCase().trim();
    const team = registry.get(teamCode);
    if (!team) {
      return NextResponse.json(
        { error: "Invalid team code. Please verify the invite code." },
        { status: 404 }
      );
    }
    if (team.members.some((m) => m.email === email)) {
      return NextResponse.json({ team });
    }
    if (1 + team.members.length >= (team.membersCount || maxMembers)) {
      return NextResponse.json({ error: "Team roster is full." }, { status: 400 });
    }
    team.members.push({
      name: body.name || email.split("@")[0],
      email,
      phone: String(body.phone || ""),
      roll: String(body.roll || ""),
      department: String(body.department || ""),
    });
    if (1 + team.members.length >= (team.membersCount || maxMembers)) {
      team.status = "confirmed";
    }
    ownedBy.set(`${email}|${team.eventId}`, teamCode);
    return NextResponse.json({ team });
  }

  // default: create
  if (getTeamForStudent(email, event._id)) {
    return NextResponse.json({ error: "You already registered a team for this event." }, { status: 409 });
  }

  const teamName = String(body.teamName || "").trim();
  if (!teamName) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  const team: Team = {
    _id: `team-${Date.now()}`,
    eventId: event._id,
    teamName,
    ventureName: String(body.ventureName || "").trim(),
    teamCode: makeCode(),
    leadName: String(body.leadName || "Student Leader"),
    leadEmail: email,
    leadPhone: String(body.leadPhone || ""),
    leadRoll: String(body.leadRoll || ""),
    department: String(body.department || ""),
    members: [],
    membersCount: Number(body.membersCount) || maxMembers,
    status: "pending",
  };
  registry.set(team.teamCode, team);
  ownedBy.set(`${email}|${event._id}`, team.teamCode);

  return NextResponse.json({ team }, { status: 201 });
}
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * TEMPORARY frontend-only stub for event attendance RSVP.
 * In-memory per student per event; lost on server restart.
 * SWAP POINT: restore `client/app/api/events/rsvp/route.ts` when backend lands.
 */

const rsvpStore = new Map<string, { rsvpd: boolean; checkedInMembers: string[] }>(); // `${email}|${eventId}` -> state

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

export async function GET(req: NextRequest) {
  const email = await readSessionEmail();
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!email || !eventId) {
    return NextResponse.json({ rsvpd: false });
  }

  const state = rsvpStore.get(`${email}|${eventId}`);
  if (!state || !state.rsvpd) {
    return NextResponse.json({ rsvpd: false });
  }

  const registered = state.checkedInMembers.includes("TEAM_LEAD");
  return NextResponse.json({
    rsvpd: true,
    status: "registered",
    myCheckIn: registered,
    rsvp: { checkedInMembers: state.checkedInMembers },
  });
}

export async function POST(req: NextRequest) {
  const email = await readSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { eventId?: string } = {};
  try {
    body = (await req.json()) as { eventId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const eventId = String(body.eventId || "");
  if (!eventId) {
    return NextResponse.json({ error: "Event is required." }, { status: 400 });
  }

  const key = `${email}|${eventId}`;
  const current = rsvpStore.get(key) || { rsvpd: false, checkedInMembers: [] };
  current.rsvpd = true;
  rsvpStore.set(key, current);

  return NextResponse.json({ rsvpd: true });
}
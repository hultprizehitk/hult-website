import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LiveEventState from "@/models/LiveEventState";
import { isAuthorizedAdmin } from "@/lib/admin-check";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// GET: Fetch live event state
export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId") || "flagship_live";

    await connectDB();
    let state = await LiveEventState.findOne({ eventId }).lean();

    if (!state) {
      // Initialize with default state if not found
      state = await LiveEventState.create({
        eventId,
        timerSeconds: 360,
        timerRunning: false,
        activePreset: "pitch",
        phases: [],
        teams: [],
        attendees: [],
      });
    }

    return NextResponse.json({ liveState: state }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/live error:", error);
    return NextResponse.json({ error: "Failed to fetch live event state" }, { status: 500 });
  }
}

// POST: Update live event state (phases, teams, timer, attendees)
export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const eventId = body.eventId || "flagship_live";

    await connectDB();

    const updateFields: Record<string, any> = {};

    if (body.timerSeconds !== undefined) updateFields.timerSeconds = body.timerSeconds;
    if (body.timerRunning !== undefined) updateFields.timerRunning = body.timerRunning;
    if (body.activePreset !== undefined) updateFields.activePreset = body.activePreset;
    if (Array.isArray(body.phases)) updateFields.phases = body.phases;
    if (Array.isArray(body.teams)) updateFields.teams = body.teams;
    if (Array.isArray(body.attendees)) updateFields.attendees = body.attendees;

    const updated = await LiveEventState.findOneAndUpdate(
      { eventId },
      { $set: updateFields },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, liveState: updated }, { status: 200 });
  } catch (error: unknown) {
    console.error("POST /api/admin/live error:", error);
    return NextResponse.json({ error: "Failed to update live event state" }, { status: 500 });
  }
}

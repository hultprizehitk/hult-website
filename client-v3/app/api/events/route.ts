import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";

import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: "Invalid event ID" }, { status: 400 });
      }
      const event = await Event.findOne({ _id: id, isPublished: true })
        .select("-registeredTeams")
        .lean();
      if (!event) {
        return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
      }
      const teamCount = await Team.countDocuments({ eventId: event._id });
      return NextResponse.json({ success: true, event: { ...event, registeredTeamsCount: teamCount } }, { status: 200 });
    }

    const events = await Event.find({ isPublished: true })
      .select("-registeredTeams")
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const eventCounts = await Team.aggregate([
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(eventCounts.map((ec: { _id: unknown; count: number }) => [String(ec._id), ec.count]));

    const enrichedEvents = events.map((ev) => ({
      ...ev,
      registeredTeamsCount: countMap.get(String(ev._id)) ?? (ev.registeredTeamsCount || 0),
    }));

    return NextResponse.json({ success: true, events: enrichedEvents }, { status: 200 });
  } catch (error: unknown) {
    console.error("Public GET /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events from database" },
      { status: 500 }
    );
  }
}

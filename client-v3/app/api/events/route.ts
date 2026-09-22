import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find({ isPublished: true })
      .select("-registeredTeams")
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, events }, { status: 200 });
  } catch (error: unknown) {
    console.error("Public GET /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events from database" },
      { status: 500 }
    );
  }
}

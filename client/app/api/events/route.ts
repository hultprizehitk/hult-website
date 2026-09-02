import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";

// Public endpoint to fetch published events for the website
export async function GET() {
  try {
    await connectDB();
    const events = await Event.find({ isPublished: true }).sort({ order: 1, createdAt: 1 });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error: unknown) {
    console.error("Failed to fetch published events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

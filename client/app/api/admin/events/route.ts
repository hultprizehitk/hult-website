import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { isAuthorizedAdmin } from "@/lib/admin-check";

// Stealth protection: if not admin, return 404
function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// GET: Fetch all events
export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    await connectDB();
    const events = await Event.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error: unknown) {
    console.error("Admin GET events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST: Create a new event
export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { title, tag, date, venue, description, link, isPublished, order } = body;

    if (!title || !date || !venue || !description) {
      return NextResponse.json(
        { error: "Title, date, venue, and description are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const newEvent = await Event.create({
      title: title.trim(),
      tag: tag?.trim() || "Workshop",
      date: date.trim(),
      venue: venue.trim(),
      description: description.trim(),
      link: link?.trim() || "",
      isPublished: isPublished !== false,
      order: Number(order) || 0,
    });

    return NextResponse.json(
      { success: true, message: "Event created successfully.", event: newEvent },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Admin POST event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PUT: Update an event
export async function PUT(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
    }

    await connectDB();
    const updated = await Event.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Event updated successfully.", event: updated },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Admin PUT event error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE: Remove an event
export async function DELETE(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
    }

    await connectDB();
    await Event.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Event deleted successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("Admin DELETE event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

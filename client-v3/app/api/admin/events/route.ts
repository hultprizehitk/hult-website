import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import Event from "@/models/Event";

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();

    const events = await Event.find().sort({ order: 1, createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Admin events GET API error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const session = await auth();
    const body = await req.json();

    const {
      title,
      tag,
      date,
      startDate,
      endDate,
      venue,
      description,
      link,
      isPublished,
      registrationStatus,
      registrationDeadline,
      maxTeams,
      minTeamMembers,
      maxTeamMembers,
    } = body;

    if (!title || !date || !venue || !description) {
      return NextResponse.json(
        { error: "Missing required fields (title, date, venue, description)" },
        { status: 400 }
      );
    }

    await connectDB();

    const newEvent = await Event.create({
      title: title.trim(),
      tag: tag?.trim() || "Flagship",
      date: date.trim(),
      startDate: startDate?.trim() || "",
      endDate: endDate?.trim() || "",
      venue: venue.trim(),
      description: description.trim(),
      link: link?.trim() || "",
      isPublished: isPublished ?? true,
      registrationStatus: registrationStatus || "open",
      registrationDeadline: registrationDeadline?.trim() || "",
      maxTeams: Number(maxTeams) || 40,
      minTeamMembers: Number(minTeamMembers) || 3,
      maxTeamMembers: Number(maxTeamMembers) || 5,
      registeredTeamsCount: 0,
      registeredTeams: [],
    });

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Created event: "${newEvent.title}"`,
      targetType: "event",
      targetId: newEvent._id.toString(),
      details: { title: newEvent.title, date: newEvent.date, venue: newEvent.venue },
      req,
    });

    return NextResponse.json({
      success: true,
      event: newEvent,
    });
  } catch (error) {
    console.error("Admin events POST API error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

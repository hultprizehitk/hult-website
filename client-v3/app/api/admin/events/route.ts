import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
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
      order,
      registrationStatus,
      registrationDeadline,
      maxTeams,
      minTeamMembers,
      maxTeamMembers,
      registeredTeams,
    } = body;

    if (!title || (!date && !startDate) || !venue || !description) {
      return NextResponse.json(
        { error: "Title, date/time, venue, and description are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const teamsList = Array.isArray(registeredTeams) ? registeredTeams : [];
    const newEvent = await Event.create({
      title: title.trim(),
      tag: tag?.trim() || "Workshop",
      date: (date || startDate || "").trim(),
      startDate: startDate ? String(startDate).trim() : "",
      endDate: endDate ? String(endDate).trim() : "",
      venue: venue.trim(),
      description: description.trim(),
      link: link?.trim() || "",
      isPublished: isPublished !== false,
      order: Number(order) || 0,
      registrationStatus: registrationStatus || "open",
      registrationDeadline: registrationDeadline || "",
      maxTeams: Number(maxTeams) || 40,
      minTeamMembers: Number(minTeamMembers) || 3,
      maxTeamMembers: Number(maxTeamMembers) || 5,
      registeredTeamsCount: teamsList.length,
      registeredTeams: teamsList,
    });

    await logAdminAction({
      adminEmail: "admin",
      action: "event_create",
      targetType: "event",
      targetId: newEvent._id.toString(),
      details: { title: newEvent.title, tag: newEvent.tag, date: newEvent.date },
      req,
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

// PUT: Update an event / control registration / extend deadline / manage teams
export async function PUT(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const {
      id,
      title,
      tag,
      date,
      startDate,
      endDate,
      venue,
      description,
      link,
      isPublished,
      order,
      registrationStatus,
      registrationDeadline,
      maxTeams,
      minTeamMembers,
      maxTeamMembers,
      action,
      team,
      teamId,
      teamStatus,
      extensionHours,
    } = body;

    if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid Event ID is required." }, { status: 400 });
    }

    await connectDB();
    const existing = await Event.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // 1. Action: Toggle registration status (open / closed)
    if (action === "toggle_registration") {
      const nextStatus =
        existing.registrationStatus === "open" || existing.registrationStatus === "extended"
          ? "closed"
          : "open";
      existing.registrationStatus = nextStatus;
      await existing.save();
      return NextResponse.json(
        {
          success: true,
          message: `Registration is now ${nextStatus.toUpperCase()}.`,
          event: existing,
        },
        { status: 200 }
      );
    }

    // 2. Action: Extend deadline by N hours
    if (action === "extend_deadline") {
      const hours = Number(extensionHours) || 24;
      const currentBase = existing.registrationDeadline
        ? new Date(existing.registrationDeadline).getTime()
        : Date.now();
      const validBase = isNaN(currentBase) || currentBase < Date.now() ? Date.now() : currentBase;
      const newDeadline = new Date(validBase + hours * 60 * 60 * 1000).toISOString();

      existing.registrationDeadline = newDeadline;
      existing.registrationStatus = "extended";
      await existing.save();
      return NextResponse.json(
        {
          success: true,
          message: `Registration deadline extended by ${hours >= 24 ? hours / 24 + " day(s)" : hours + " hour(s)"}!`,
          event: existing,
        },
        { status: 200 }
      );
    }

    // 3. Action: Add registered team
    if (action === "add_team" && team) {
      const min = existing.minTeamMembers || 3;
      const max = existing.maxTeamMembers || 5;
      const members = Number(team.membersCount) || min;

      if (members < min || members > max) {
        return NextResponse.json(
          { error: `Team must have between ${min} and ${max} members.` },
          { status: 400 }
        );
      }

      const newTeamObj = {
        id: "team_" + Date.now(),
        teamCode: team.teamCode || "",
        teamName: team.teamName?.trim() || "New Venture",
        ventureName: team.ventureName?.trim() || "",
        leadName: team.leadName?.trim() || "Lead",
        leadEmail: team.leadEmail?.trim() || "",
        membersCount: members,
        department: team.department?.trim() || "General",
        registeredAt: new Date(),
        submissionStatus: "submitted" as const,
        submittedAt: new Date(),
        status: (team.status === "disqualified" ? "disqualified" : "confirmed") as "confirmed" | "disqualified",
        checkedIn: false,
      };

      existing.registeredTeams.push(newTeamObj);
      existing.registeredTeamsCount = existing.registeredTeams.length;
      await existing.save();
      return NextResponse.json(
        {
          success: true,
          message: `Team "${newTeamObj.teamName}" registered successfully!`,
          event: existing,
        },
        { status: 200 }
      );
    }

    // 4. Action: Remove registered team
    if (action === "remove_team" && teamId) {
      existing.registeredTeams = existing.registeredTeams.filter(
        (t: { id: string }) => t.id !== teamId
      );
      existing.registeredTeamsCount = existing.registeredTeams.length;
      await existing.save();
      return NextResponse.json(
        {
          success: true,
          message: "Team removed from registration list.",
          event: existing,
        },
        { status: 200 }
      );
    }

    // 5. Action: Update team status
    if (action === "update_team_status" && teamId && teamStatus) {
      const target = existing.registeredTeams.find((t: { id: string }) => t.id === teamId);
      if (target) {
        target.status = teamStatus;
        await existing.save();
      }
      return NextResponse.json(
        {
          success: true,
          message: "Team status updated.",
          event: existing,
        },
        { status: 200 }
      );
    }

    // Standard field updates
    if (title !== undefined) existing.title = String(title).trim();
    if (tag !== undefined) existing.tag = String(tag).trim();
    if (date !== undefined) existing.date = String(date).trim();
    if (startDate !== undefined) existing.startDate = String(startDate).trim();
    if (endDate !== undefined) existing.endDate = String(endDate).trim();
    if (venue !== undefined) existing.venue = String(venue).trim();
    if (description !== undefined) existing.description = String(description).trim();
    if (link !== undefined) existing.link = String(link).trim();
    if (isPublished !== undefined) existing.isPublished = Boolean(isPublished);
    if (order !== undefined) existing.order = Number(order);
    if (registrationStatus !== undefined) existing.registrationStatus = registrationStatus;
    if (registrationDeadline !== undefined) existing.registrationDeadline = registrationDeadline;
    if (maxTeams !== undefined) existing.maxTeams = Number(maxTeams);
    if (minTeamMembers !== undefined) existing.minTeamMembers = Number(minTeamMembers);
    if (maxTeamMembers !== undefined) existing.maxTeamMembers = Number(maxTeamMembers);

    await existing.save();

    await logAdminAction({
      adminEmail: "admin",
      action: action ? `event_${action}` : "event_update",
      targetType: "event",
      targetId: id,
      details: { title: existing.title, action: action || "general_update" },
      req,
    });

    return NextResponse.json(
      { success: true, message: "Event updated successfully.", event: existing },
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

    if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid Event ID is required." }, { status: 400 });
    }

    await connectDB();
    const deleted = await Event.findByIdAndDelete(id);

    await logAdminAction({
      adminEmail: "admin",
      action: "event_delete",
      targetType: "event",
      targetId: id,
      details: { title: deleted?.title || "" },
      req,
    });

    return NextResponse.json(
      { success: true, message: "Event deleted successfully." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Admin DELETE event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

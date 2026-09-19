import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import EventRsvp from "@/models/EventRsvp";
import { auth } from "@/auth";

// GET: Fetch RSVP and check-in status for user's team or all teams (admin)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const url = new URL(req.url);
    const rawEventId = url.searchParams.get("eventId");
    const eventId = rawEventId ? String(rawEventId).trim() : "";
    const isAdmin = url.searchParams.get("admin") === "true";

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required" }, { status: 400 });
    }

    await connectDB();

    // Admin view: return all RSVPs for this event
    if (isAdmin) {
      const rsvps = await EventRsvp.find({ eventId }).sort({ createdAt: -1 }).lean();
      const stats = {
        totalRsvps: rsvps.length,
        fullyCheckedIn: rsvps.filter((r) => r.checkInStatus === "fully_checked_in").length,
        graceApproved: rsvps.filter((r) => r.checkInStatus === "grace_approved").length,
        partial: rsvps.filter((r) => r.checkInStatus === "partial").length,
        rsvpdOnly: rsvps.filter((r) => r.checkInStatus === "rsvpd").length,
      };
      return NextResponse.json({ stats, rsvps }, { status: 200 });
    }

    // Student view: find user's registered team first
    const team = await Team.findOne({
      eventId,
      $or: [{ leadEmail: userEmail }, { "members.email": userEmail }],
    }).lean();

    if (!team) {
      return NextResponse.json(
        { rsvpd: false, message: "No registered team found for this event", rsvp: null },
        { status: 200 }
      );
    }

    const rsvp = await EventRsvp.findOne({
      eventId,
      teamCode: team.teamCode.toUpperCase(),
    }).lean();

    if (!rsvp) {
      return NextResponse.json(
        {
          rsvpd: false,
          teamCode: team.teamCode,
          teamName: team.teamName,
          rsvp: null,
        },
        { status: 200 }
      );
    }

    const myCheckIn = rsvp.checkedInMembers?.some(
      (m) => m.email.toLowerCase() === userEmail
    );

    return NextResponse.json(
      {
        rsvpd: true,
        teamCode: team.teamCode,
        teamName: team.teamName,
        status: rsvp.checkInStatus,
        myCheckIn: Boolean(myCheckIn),
        rsvp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/events/rsvp error:", error);
    return NextResponse.json({ error: "Failed to fetch RSVP status" }, { status: 500 });
  }
}

// POST: Student RSVPs their team for an event
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in with your college email." },
        { status: 401 }
      );
    }

    const sessionEmail = session.user.email.toLowerCase().trim();
    const body = await req.json();
    const rawEventId = body.eventId;
    const eventId = rawEventId ? String(rawEventId).trim() : "";

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required." }, { status: 400 });
    }

    await connectDB();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Find student's team in normalized Team collection
    let team = await Team.findOne({
      eventId: event._id,
      $or: [{ leadEmail: sessionEmail }, { "members.email": sessionEmail }],
    });

    // Fallback: check legacy registeredTeams on event doc
    if (!team) {
      const legacyTeam = event.registeredTeams?.find(
        (t: any) =>
          t.leadEmail?.toLowerCase() === sessionEmail ||
          t.members?.some((m: any) => m.email?.toLowerCase() === sessionEmail)
      );

      if (legacyTeam) {
        // Create normalized Team record
        team = await Team.create({
          eventId: event._id,
          teamCode: (legacyTeam.teamCode || "HULT-ASCEND").toUpperCase(),
          teamName: legacyTeam.teamName,
          ventureName: legacyTeam.ventureName || "",
          lead: {
            name: legacyTeam.leadName,
            email: legacyTeam.leadEmail.toLowerCase(),
            phone: legacyTeam.leadPhone || "",
            department: legacyTeam.department || "General",
          },
          leadEmail: legacyTeam.leadEmail.toLowerCase(),
          membersCount: legacyTeam.membersCount || 4,
          department: legacyTeam.department || "General",
          members: legacyTeam.members || [],
          status: legacyTeam.status || "confirmed",
          checkedIn: false,
          registeredAt: legacyTeam.registeredAt || new Date(),
        });
      }
    }

    if (!team) {
      return NextResponse.json(
        { error: "You must register a team for this event before RSVPing." },
        { status: 400 }
      );
    }

    // Check existing RSVP
    let existingRsvp = await EventRsvp.findOne({
      eventId: event._id,
      teamCode: team.teamCode.toUpperCase(),
    });

    if (existingRsvp) {
      return NextResponse.json(
        {
          success: true,
          message: `Your team "${team.teamName}" has already RSVP'd for ${event.title}!`,
          rsvp: existingRsvp,
        },
        { status: 200 }
      );
    }

    // Create new RSVP doc
    const rsvpDoc = await EventRsvp.create({
      eventId: event._id,
      teamId: team._id,
      teamCode: team.teamCode.toUpperCase(),
      teamName: team.teamName,
      leadEmail: team.leadEmail.toLowerCase(),
      rsvpAt: new Date(),
      rsvpByEmail: sessionEmail,
      checkedInMembers: [],
      checkInStatus: "rsvpd",
    });

    return NextResponse.json(
      {
        success: true,
        message: `RSVP confirmed for team "${team.teamName}"!`,
        rsvp: rsvpDoc,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/events/rsvp error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing RSVP." },
      { status: 500 }
    );
  }
}

// PATCH: Individual team member checks in via QR scan
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to check in." },
        { status: 401 }
      );
    }

    const sessionEmail = session.user.email.toLowerCase().trim();
    const sessionName = session.user.name || sessionEmail.split("@")[0];
    const body = await req.json();
    const action = String(body.action || "").trim();
    const rawEventId = body.eventId;
    const eventId = rawEventId ? String(rawEventId).trim() : "";

    if (action !== "checkin") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required" }, { status: 400 });
    }

    await connectDB();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Find student's team
    const team = await Team.findOne({
      eventId: event._id,
      $or: [{ leadEmail: sessionEmail }, { "members.email": sessionEmail }],
    });

    if (!team) {
      return NextResponse.json(
        {
          error: `No registered team found for account ${sessionEmail} in event "${event.title}". Please register first.`,
        },
        { status: 404 }
      );
    }

    // Find RSVP record
    let rsvp = await EventRsvp.findOne({
      eventId: event._id,
      teamCode: team.teamCode.toUpperCase(),
    });

    if (!rsvp) {
      // Auto-create RSVP if student scans QR directly on event day
      rsvp = await EventRsvp.create({
        eventId: event._id,
        teamId: team._id,
        teamCode: team.teamCode.toUpperCase(),
        teamName: team.teamName,
        leadEmail: team.leadEmail.toLowerCase(),
        rsvpAt: new Date(),
        rsvpByEmail: sessionEmail,
        checkedInMembers: [],
        checkInStatus: "rsvpd",
      });
    }

    // Check deadline if present
    if (rsvp.checkInDeadline && new Date() > new Date(rsvp.checkInDeadline)) {
      return NextResponse.json(
        {
          error: "The check-in window for this event has closed. Please see an event organizer for assistance.",
        },
        { status: 400 }
      );
    }

    // Check if user is already checked in
    const alreadyScanned = rsvp.checkedInMembers.some(
      (m) => m.email.toLowerCase() === sessionEmail
    );

    if (alreadyScanned) {
      return NextResponse.json(
        {
          success: true,
          alreadyCheckedIn: true,
          message: `Welcome back, ${sessionName}! You are already checked in for ${team.teamName}.`,
          rsvp,
          team,
        },
        { status: 200 }
      );
    }

    // Add user to checkedInMembers array
    rsvp.checkedInMembers.push({
      email: sessionEmail,
      name: sessionName,
      scannedAt: new Date(),
    });

    // Determine expected roster count: 1 (lead) + members count
    const totalRosterCount = 1 + (team.members?.length || 0);
    const scannedCount = rsvp.checkedInMembers.length;

    if (scannedCount >= totalRosterCount) {
      rsvp.checkInStatus = "fully_checked_in";
    } else if (rsvp.checkInStatus !== "grace_approved") {
      rsvp.checkInStatus = "partial";
    }

    await rsvp.save();

    // Mark Team checkedIn as true if at least one member scanned
    if (!team.checkedIn) {
      team.checkedIn = true;
      team.checkedInAt = new Date();
      await team.save();
    }

    return NextResponse.json(
      {
        success: true,
        alreadyCheckedIn: false,
        message: `Check-in successful! Welcome, ${sessionName}. (${scannedCount}/${totalRosterCount} team members present)`,
        rsvp,
        team,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PATCH /api/events/rsvp error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during check-in." },
      { status: 500 }
    );
  }
}

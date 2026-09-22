import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import { auth } from "@/auth";
import { parseHeritageEmail } from "@/lib/heritage-parser";

function generateTeamCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HULT-${suffix}`;
}

/**
 * GET /api/teams?eventId=<id>
 * Fetches the team that the currently authenticated student belongs to
 * (either as Team Leader or as a Member).
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");

    await connectDB();

    // Query teams where user is lead or a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      $or: [{ leadEmail: email }, { "members.email": email }],
    };

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
      }
      query.eventId = new mongoose.Types.ObjectId(eventId);
    }

    const teams = await Team.find(query)
      .populate("eventId", "title tag date venue registrationStatus registrationDeadline minTeamMembers maxTeamMembers")
      .sort({ createdAt: -1 })
      .lean();

    if (eventId) {
      const myTeam = teams[0] || null;
      return NextResponse.json({
        success: true,
        hasTeam: Boolean(myTeam),
        team: myTeam,
        role: myTeam ? (myTeam.leadEmail === email ? "lead" : "member") : null,
      });
    }

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error: unknown) {
    console.error("GET /api/teams error:", error);
    return NextResponse.json({ error: "Failed to fetch student team: " + (error as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/teams (Create Team)
 * Authenticated student creates a new team for an event and becomes the Team Leader.
 * Generates unique Team Code and syncs to both Team model and Event.registeredTeams.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required. Please sign in." }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const userName = session.user.name || "Student Leader";

    // Strictly enforce @heritageit.edu.in
    if (!userEmail.endsWith("@heritageit.edu.in")) {
      return NextResponse.json(
        { error: "Access Restricted: Only @heritageit.edu.in college accounts can register." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { eventId, teamName, ventureName, phone, roll, department } = body;

    if (!eventId || !teamName?.trim()) {
      return NextResponse.json(
        { error: "Event ID and Team Name are required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch Event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // 2. Validate Event Registration Status
    if (event.registrationStatus === "closed") {
      return NextResponse.json(
        { error: "Registrations for this event are currently closed." },
        { status: 400 }
      );
    }

    // 3. Validate Event Deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (!isNaN(deadline.getTime()) && new Date() > deadline) {
        return NextResponse.json(
          { error: "The registration deadline for this event has passed." },
          { status: 400 }
        );
      }
    }

    // 4. Validate Event Capacity
    if (event.maxTeams && event.registeredTeamsCount >= event.maxTeams) {
      return NextResponse.json(
        { error: "Event registration is at full capacity." },
        { status: 400 }
      );
    }

    // 5. Duplicate Check: Ensure user is not already in a team for this event
    const existingTeam = await Team.findOne({
      eventId: event._id,
      $or: [{ leadEmail: userEmail }, { "members.email": userEmail }],
    });

    if (existingTeam) {
      return NextResponse.json(
        {
          error: `You are already registered in team "${existingTeam.teamName}" (Code: ${existingTeam.teamCode}) for this event.`,
          existingTeam,
        },
        { status: 400 }
      );
    }

    // Parse fallback student info from email
    const parsed = parseHeritageEmail(userEmail, userName);
    const userDept = department?.trim() || (session.user as { department?: string })?.department || parsed.branchName || "General";

    // 6. Generate unique Team Code
    let code = generateTeamCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await Team.findOne({ teamCode: code });
      if (!exists) break;
      code = generateTeamCode();
      attempts++;
    }

    const cleanTeamName = teamName.trim();
    const cleanVenture = ventureName?.trim() || "";
    const cleanPhone = phone?.trim() || "";
    const cleanRoll = roll?.trim() || "";
    const minMembers = event.minTeamMembers || 3;
    const maxMembers = event.maxTeamMembers || 5;
    const initialSubmissionStatus = 1 >= minMembers ? "ready" : "forming";

    // 7. Create Team Document
    const newTeam = await Team.create({
      eventId: event._id,
      teamCode: code,
      teamName: cleanTeamName,
      ventureName: cleanVenture,
      lead: {
        name: userName,
        email: userEmail,
        phone: cleanPhone,
        department: userDept,
        roll: cleanRoll,
      },
      leadEmail: userEmail,
      membersCount: maxMembers,
      department: userDept,
      members: [],
      status: "confirmed",
      submissionStatus: initialSubmissionStatus,
      checkedIn: false,
      registeredAt: new Date(),
    });

    // 8. Synchronize to Event.registeredTeams
    if (!Array.isArray(event.registeredTeams)) {
      event.registeredTeams = [];
    }

    event.registeredTeams.push({
      id: newTeam._id.toString(),
      teamCode: code,
      teamName: cleanTeamName,
      ventureName: cleanVenture,
      leadName: userName,
      leadEmail: userEmail,
      leadPhone: cleanPhone,
      membersCount: maxMembers,
      department: userDept,
      members: [],
      registeredAt: new Date(),
      status: "confirmed",
      submissionStatus: initialSubmissionStatus,
      checkedIn: false,
    });
    event.registeredTeamsCount = event.registeredTeams.length;
    await event.save();

    return NextResponse.json(
      {
        success: true,
        message: `Team "${cleanTeamName}" created successfully! You are the Team Leader.`,
        teamCode: code,
        team: newTeam,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/teams error:", error);
    return NextResponse.json({ error: "Failed to create team: " + (error as Error).message }, { status: 500 });
  }
}

/**
 * PATCH /api/teams (Finalize / Submit Team Info by Team Leader)
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const body = await req.json();
    const { teamId, teamCode, ventureName, ventureDescription, pitchDeckUrl } = body;

    if (!teamId && !teamCode) {
      return NextResponse.json(
        { error: "Team ID or Team Code is required to update team details." },
        { status: 400 }
      );
    }

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
      filter._id = new mongoose.Types.ObjectId(teamId);
    } else if (teamCode) {
      filter.teamCode = String(teamCode).trim().toUpperCase();
    } else {
      return NextResponse.json({ error: "Invalid team identifier provided." }, { status: 400 });
    }

    const team = await Team.findOne(filter);
    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // Verify caller is the Team Leader
    const isLead =
      team.leadEmail?.toLowerCase() === email ||
      team.lead?.email?.toLowerCase() === email;

    if (!isLead) {
      return NextResponse.json(
        { error: "Unauthorized. Only the Team Leader is authorized to submit or update team info." },
        { status: 403 }
      );
    }

    // Fetch associated event to verify criteria
    const event = await Event.findById(team.eventId);
    if (!event) {
      return NextResponse.json({ error: "Associated event not found." }, { status: 404 });
    }

    const minMembers = event.minTeamMembers || 3;
    const maxMembers = event.maxTeamMembers || 5;
    const currentTotalMembers = 1 + (Array.isArray(team.members) ? team.members.length : 0);

    // Enforce minimum members criteria
    if (currentTotalMembers < minMembers) {
      return NextResponse.json(
        {
          error: `Team criteria not met. Your team currently has ${currentTotalMembers} member(s). A minimum of ${minMembers} members is required before final submission.`,
        },
        { status: 400 }
      );
    }

    // Enforce maximum members criteria
    if (currentTotalMembers > maxMembers) {
      return NextResponse.json(
        {
          error: `Team size exceeds maximum limit of ${maxMembers} members.`,
        },
        { status: 400 }
      );
    }

    // Update details
    if (ventureName && typeof ventureName === "string") {
      team.ventureName = ventureName.trim();
    }
    if (ventureDescription !== undefined && typeof ventureDescription === "string") {
      team.ventureDescription = ventureDescription.trim();
    }
    if (pitchDeckUrl !== undefined && typeof pitchDeckUrl === "string") {
      team.pitchDeckUrl = pitchDeckUrl.trim();
    }

    team.submissionStatus = "submitted";
    team.submittedAt = new Date();
    team.status = "confirmed";
    await team.save();

    // Synchronize to Event.registeredTeams
    if (Array.isArray(event.registeredTeams)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventTeam = event.registeredTeams.find(
        (t: any) =>
          t.id === team._id.toString() ||
          t.teamCode?.toUpperCase() === team.teamCode.toUpperCase()
      );

      if (eventTeam) {
        if (team.ventureName) eventTeam.ventureName = team.ventureName;
        if (team.ventureDescription !== undefined) eventTeam.ventureDescription = team.ventureDescription;
        if (team.pitchDeckUrl !== undefined) eventTeam.pitchDeckUrl = team.pitchDeckUrl;
        eventTeam.submissionStatus = "submitted";
        eventTeam.submittedAt = team.submittedAt;
        eventTeam.status = "confirmed";
        await event.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Team information and venture details submitted successfully!",
      team,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/teams error:", error);
    return NextResponse.json(
      { error: "Failed to update team details: " + (error as Error).message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import User from "@/models/User";
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
      if (myTeam) {
        // Enforce criteria consistency: If team members are below required minimum, it cannot be submitted/confirmed
        const ev = myTeam.eventId as { minTeamMembers?: number } | null;
        const minRequired = ev?.minTeamMembers || 3;
        const totalMembers = 1 + (Array.isArray(myTeam.members) ? myTeam.members.length : 0);
        if (totalMembers < minRequired && (myTeam.submissionStatus === "submitted" || myTeam.status === "confirmed")) {
          await Team.findByIdAndUpdate(myTeam._id, {
            submissionStatus: "forming",
            status: "pending",
            submittedAt: null,
          });
          myTeam.submissionStatus = "forming";
          myTeam.status = "pending";
          myTeam.submittedAt = undefined;
        }
      }

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

    await connectDB();

    const userInDb = await User.findOne({ email: userEmail });
    const effectivePhone = phone?.trim() || userInDb?.phone?.trim() || "";
    const effectiveRoll = roll?.trim() || userInDb?.roll?.trim() || "";

    if (!eventId || !teamName?.trim() || !effectivePhone || !effectiveRoll) {
      return NextResponse.json(
        { error: "Event ID, Team Name, Contact Phone, and College Roll No. are required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

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
      const isLead = existingTeam.leadEmail?.toLowerCase() === userEmail;
      return NextResponse.json(
        {
          error: isLead
            ? `You are already the Team Leader of team "${existingTeam.teamName}" for this event. Disband/delete this team first if you want to join or create another team.`
            : `You are already a member of team "${existingTeam.teamName}" for this event. Leave this team first before creating a new team.`,
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
    const cleanPhone = effectivePhone;
    const cleanRoll = effectiveRoll;
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

    // 9. Synchronize phone and roll to User profile
    if (userInDb && (userInDb.phone !== cleanPhone || userInDb.roll !== cleanRoll)) {
      await User.updateOne(
        { email: userEmail },
        { $set: { phone: cleanPhone, roll: cleanRoll } }
      );
    }

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
/**
 * PATCH /api/teams
 * Handles:
 * - Leader edits team name / venture track (action: "edit_team")
 * - Leader removes a member (action: "remove_member")
 * - Member leaves the team (action: "leave_team")
 * - Leader final proposal submission (default / action: "submit_final")
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
    const { action, teamId, teamCode, teamName, ventureName, ventureDescription, pitchDeckUrl, memberEmail } = body;

    if (!teamId && !teamCode) {
      return NextResponse.json(
        { error: "Team ID or Team Code is required." },
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

    const isLead =
      team.leadEmail?.toLowerCase() === email ||
      team.lead?.email?.toLowerCase() === email;

    const event = await Event.findById(team.eventId);
    const minMembers = event?.minTeamMembers || 3;
    const maxMembers = event?.maxTeamMembers || 5;

    // ── ACTION 1: LEADER REMOVES A MEMBER ──────────────────────────────────
    if (action === "remove_member") {
      if (!isLead) {
        return NextResponse.json(
          { error: "Unauthorized. Only the Team Leader can remove members." },
          { status: 403 }
        );
      }

      if (!memberEmail) {
        return NextResponse.json({ error: "Member email is required." }, { status: 400 });
      }

      const targetEmail = String(memberEmail).toLowerCase().trim();
      const memberExists = (team.members || []).some(
        (m: { email?: string }) => m.email?.toLowerCase() === targetEmail
      );

      if (!memberExists) {
        return NextResponse.json({ error: "Member not found in team." }, { status: 404 });
      }

      team.members = team.members.filter(
        (m: { email?: string }) => m.email?.toLowerCase() !== targetEmail
      );

      const newTotal = 1 + team.members.length;
      if (team.submissionStatus !== "submitted") {
        team.submissionStatus = newTotal >= minMembers ? "ready" : "forming";
      }

      await team.save();

      // Synchronize to Event.registeredTeams
      if (event && Array.isArray(event.registeredTeams)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventTeam = event.registeredTeams.find(
          (t: any) =>
            t.id === team._id.toString() ||
            t.teamCode?.toUpperCase() === team.teamCode.toUpperCase()
        );
        if (eventTeam) {
          eventTeam.members = team.members;
          eventTeam.submissionStatus = team.submissionStatus;
          await event.save();
        }
      }

      return NextResponse.json({
        success: true,
        message: "Member removed from team.",
        team,
      });
    }

    // ── ACTION 2: MEMBER LEAVES THE TEAM ───────────────────────────────────
    if (action === "leave_team") {
      if (isLead) {
        return NextResponse.json(
          {
            error:
              "Team Leaders cannot leave the team. You can delete/disband the team if you wish to join another team.",
          },
          { status: 400 }
        );
      }

      const isMember = (team.members || []).some(
        (m: { email?: string }) => m.email?.toLowerCase() === email
      );
      if (!isMember) {
        return NextResponse.json({ error: "You are not a member of this team." }, { status: 400 });
      }

      team.members = team.members.filter(
        (m: { email?: string }) => m.email?.toLowerCase() !== email
      );

      const newTotal = 1 + team.members.length;
      if (team.submissionStatus !== "submitted") {
        team.submissionStatus = newTotal >= minMembers ? "ready" : "forming";
      }

      await team.save();

      // Synchronize to Event.registeredTeams
      if (event && Array.isArray(event.registeredTeams)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventTeam = event.registeredTeams.find(
          (t: any) =>
            t.id === team._id.toString() ||
            t.teamCode?.toUpperCase() === team.teamCode.toUpperCase()
        );
        if (eventTeam) {
          eventTeam.members = team.members;
          eventTeam.submissionStatus = team.submissionStatus;
          await event.save();
        }
      }

      return NextResponse.json({
        success: true,
        message: `You have successfully left team "${team.teamName}". You can now join or create another team.`,
      });
    }

    // ── ACTION 3: LEADER EDITS TEAM INFO / DRAFT ────────────────────────────
    if (action === "edit_team" || action === "update_info" || action === "save_draft") {
      if (!isLead) {
        return NextResponse.json(
          { error: "Unauthorized. Only the Team Leader can edit team details." },
          { status: 403 }
        );
      }

      if (teamName && typeof teamName === "string" && teamName.trim()) {
        team.teamName = teamName.trim();
      }
      if (ventureName !== undefined && typeof ventureName === "string") {
        team.ventureName = ventureName.trim();
      }
      if (ventureDescription !== undefined && typeof ventureDescription === "string") {
        team.ventureDescription = ventureDescription.trim();
      }
      if (pitchDeckUrl !== undefined && typeof pitchDeckUrl === "string") {
        team.pitchDeckUrl = pitchDeckUrl.trim();
      }

      await team.save();

      if (event && Array.isArray(event.registeredTeams)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventTeam = event.registeredTeams.find(
          (t: any) =>
            t.id === team._id.toString() ||
            t.teamCode?.toUpperCase() === team.teamCode.toUpperCase()
        );
        if (eventTeam) {
          eventTeam.teamName = team.teamName;
          eventTeam.ventureName = team.ventureName;
          if (team.ventureDescription !== undefined) eventTeam.ventureDescription = team.ventureDescription;
          if (team.pitchDeckUrl !== undefined) eventTeam.pitchDeckUrl = team.pitchDeckUrl;
          await event.save();
        }
      }

      return NextResponse.json({
        success: true,
        message: action === "save_draft" ? "Draft saved successfully." : "Team information updated successfully.",
        team,
      });
    }

    // ── ACTION 4: FINAL VENTURE SUBMISSION (DEFAULT) ────────────────────────
    if (!isLead) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Only the Team Leader is authorized to submit official venture details.",
        },
        { status: 403 }
      );
    }

    const currentTotalMembers = 1 + (Array.isArray(team.members) ? team.members.length : 0);

    // Enforce minimum members criteria
    if (currentTotalMembers < minMembers) {
      return NextResponse.json(
        {
          error: `Minimum ${minMembers} members required to submit registration. Your team currently has ${currentTotalMembers} member(s). Share invite code ${team.teamCode} to invite more members.`,
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
    if (event && Array.isArray(event.registeredTeams)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventTeam = event.registeredTeams.find(
        (t: any) =>
          t.id === team._id.toString() ||
          t.teamCode?.toUpperCase() === team.teamCode.toUpperCase()
      );

      if (eventTeam) {
        if (team.ventureName) eventTeam.ventureName = team.ventureName;
        if (team.ventureDescription !== undefined)
          eventTeam.ventureDescription = team.ventureDescription;
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

/**
 * DELETE /api/teams
 * Team Leader deletes/disbands their team, freeing leader and members to join or create other teams.
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const url = new URL(req.url);
    let teamId = url.searchParams.get("teamId");

    if (!teamId) {
      try {
        const body = await req.json();
        teamId = body.teamId;
      } catch {
        // ignore body parse failure
      }
    }

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Valid team ID is required." }, { status: 400 });
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    // Verify caller is Leader
    const isLead =
      team.leadEmail?.toLowerCase() === email ||
      team.lead?.email?.toLowerCase() === email;

    if (!isLead) {
      return NextResponse.json(
        { error: "Unauthorized. Only the Team Leader can disband and delete the team." },
        { status: 403 }
      );
    }

    // 1. Remove from Event.registeredTeams
    const event = await Event.findById(team.eventId);
    if (event && Array.isArray(event.registeredTeams)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event.registeredTeams = event.registeredTeams.filter(
        (t: any) =>
          t.id !== team._id.toString() &&
          t.teamCode?.toUpperCase() !== team.teamCode.toUpperCase()
      );
      event.registeredTeamsCount = Math.max(0, event.registeredTeams.length);
      await event.save();
    }

    // 2. Delete Team document
    await Team.findByIdAndDelete(team._id);

    return NextResponse.json({
      success: true,
      message: `Team "${team.teamName}" has been disbanded and deleted. You can now create or join another team for this event.`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/teams error:", error);
    return NextResponse.json(
      { error: "Failed to delete team: " + (error as Error).message },
      { status: 500 }
    );
  }
}

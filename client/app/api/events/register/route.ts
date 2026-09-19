import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { auth } from "@/auth";
import { sendRegistrationConfirmationEmail } from "@/lib/email-templates";
import { logEmailDispatch } from "@/lib/mail-logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Helper to generate a distinctive, memorable Team Code (e.g. HULT-7X9K)
function generateTeamCode(existingTeams: { teamCode?: string }[] = []): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const existing = new Set(
    existingTeams.map((t) => (t.teamCode || "").toUpperCase())
  );
  let code = "";
  let attempts = 0;
  do {
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `HULT-${suffix}`;
    attempts++;
  } while (existing.has(code) && attempts < 100);
  return code;
}

// GET: Check registration status of the logged-in user
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ registered: false, team: null }, { status: 200 });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");

    await connectDB();

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: "Invalid event ID format." }, { status: 400 });
      }
      const event = await Event.findById(eventId);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Check normalized Team collection first
      const normalizedTeam = await Team.findOne({
        eventId: event._id,
        $or: [{ leadEmail: userEmail }, { "members.email": userEmail }],
      }).lean();

      // Fallback to legacy embedded array if not yet migrated
      const legacyTeam = event.registeredTeams?.find(
        (t: any) =>
          t.leadEmail?.toLowerCase() === userEmail ||
          t.members?.some((m: any) => m.email?.toLowerCase() === userEmail)
      );

      const userTeam = normalizedTeam
        ? {
            id: normalizedTeam._id.toString(),
            teamCode: normalizedTeam.teamCode,
            teamName: normalizedTeam.teamName,
            ventureName: normalizedTeam.ventureName,
            leadName: normalizedTeam.lead.name,
            leadEmail: normalizedTeam.lead.email,
            leadPhone: normalizedTeam.lead.phone,
            department: normalizedTeam.department,
            membersCount: normalizedTeam.membersCount,
            members: normalizedTeam.members,
            registeredAt: normalizedTeam.registeredAt,
            status: normalizedTeam.status,
          }
        : legacyTeam;

      const isLead = (userTeam?.leadEmail || (userTeam as any)?.lead?.email)?.toLowerCase() === userEmail;

      return NextResponse.json(
        {
          registered: Boolean(userTeam),
          isLead,
          team: userTeam || null,
          event: {
            id: event._id,
            title: event.title,
            tag: event.tag,
            date: event.date,
            venue: event.venue,
            registrationStatus: event.registrationStatus,
          },
        },
        { status: 200 }
      );
    }

    // Fetch all events user has registered for (as lead or member)
    const eventsWithUser = await Event.find({
      $or: [
        { "registeredTeams.leadEmail": userEmail },
        { "registeredTeams.members.email": userEmail },
      ],
    }).sort({ createdAt: -1 });

    const registrations = eventsWithUser.map((ev) => {
      const team = ev.registeredTeams?.find(
        (t: any) =>
          t.leadEmail?.toLowerCase() === userEmail ||
          t.members?.some((m: any) => m.email?.toLowerCase() === userEmail)
      );
      const isLead = team?.leadEmail?.toLowerCase() === userEmail;

      return {
        eventId: ev._id.toString(),
        eventTitle: ev.title,
        eventTag: ev.tag,
        eventDate: ev.date,
        eventVenue: ev.venue,
        isLead,
        team,
      };
    });

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/events/register error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

// POST: Create Team (generates Team Code) OR Join Team (using Team Code)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error:
            "Authentication required. Please sign in with your Heritage Institute college email (@heritageit.edu.in).",
        },
        { status: 401 }
      );
    }

    const sessionEmail = session.user.email.toLowerCase().trim();
    const domain = sessionEmail.split("@")[1];
    if (domain !== "heritageit.edu.in") {
      return NextResponse.json(
        {
          error:
            "Access restricted. Only verified Heritage Institute students (@heritageit.edu.in) can participate.",
        },
        { status: 403 }
      );
    }

    // Rate limiting: max 15 registration actions per minute per student/IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`reg_${sessionEmail}_${clientIp}`, {
      limit: 15,
      windowMs: 60000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please wait a moment before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const action = body.action || (body.teamCode && !body.teamName ? "join" : "create");
    const eventId = body.eventId;

    if (!eventId || typeof eventId !== "string" || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Valid Event ID is required." }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findOne({ email: sessionEmail }).lean();
    const parsedEmailInfo = parseHeritageEmail(sessionEmail);
    const officialStudentName = (dbUser?.name || parsedEmailInfo.fullName || "Heritage Student").trim();

    const event = await Event.findById(eventId);

    if (!event || event.isPublished === false) {
      return NextResponse.json(
        { error: "This event is not available or has not been published yet." },
        { status: 404 }
      );
    }

    if (event.registrationStatus === "closed") {
      return NextResponse.json(
        { error: "Registrations for this event are currently closed by the organizers." },
        { status: 400 }
      );
    }

    if (event.registrationDeadline) {
      const deadlineDate = new Date(event.registrationDeadline);
      if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < Date.now()) {
        return NextResponse.json(
          { error: "The registration deadline for this event has passed." },
          { status: 400 }
        );
      }
    }

    const existingTeams = event.registeredTeams || [];

    // Check if user is already registered in ANY team for this event (as lead or member)
    const alreadyRegisteredTeam = existingTeams.find(
      (t: any) =>
        t.leadEmail?.toLowerCase() === sessionEmail ||
        t.members?.some((m: any) => m.email?.toLowerCase() === sessionEmail)
    );

    // =========================================================================
    // ACTION 1: JOIN TEAM WITH CODE
    // =========================================================================
    if (action === "join") {
      const rawCode = body.teamCode;
      if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
        return NextResponse.json(
          { error: "Please provide a valid Team Invite Code to join." },
          { status: 400 }
        );
      }

      const normalizedCode = rawCode.trim().toUpperCase();

      // Find team with this code in this event
      const targetTeam = existingTeams.find(
        (t: any) => (t.teamCode || "").toUpperCase() === normalizedCode
      );

      if (!targetTeam) {
        return NextResponse.json(
          {
            error: `No team found with Invite Code "${normalizedCode}" for "${event.title}". Please verify the code with your Team Leader.`,
          },
          { status: 404 }
        );
      }

      // Check if user is already the lead of this team
      if (targetTeam.leadEmail.toLowerCase() === sessionEmail) {
        return NextResponse.json(
          {
            error: `You are the Team Leader of "${targetTeam.teamName}". Share this code (${targetTeam.teamCode}) with your teammates to invite them.`,
          },
          { status: 400 }
        );
      }

      // Check if user is already a member of this team
      if (targetTeam.members?.some((m: any) => m.email?.toLowerCase() === sessionEmail)) {
        return NextResponse.json(
          { error: `You have already joined team "${targetTeam.teamName}".` },
          { status: 400 }
        );
      }

      // Check if user is already in another team for this event
      if (alreadyRegisteredTeam) {
        return NextResponse.json(
          {
            error: `You are already registered in team "${alreadyRegisteredTeam.teamName}" for this event. A student can only be in one team per event.`,
          },
          { status: 409 }
        );
      }

      // Check team capacity
      const currentCount = 1 + (targetTeam.members?.length || 0);
      const targetCapacity = targetTeam.membersCount || event.maxTeamMembers || 5;

      if (currentCount >= targetCapacity) {
        return NextResponse.json(
          {
            error: `Team "${targetTeam.teamName}" has reached its maximum capacity of ${targetCapacity} members.`,
          },
          { status: 400 }
        );
      }

      // Add new member
      if (!targetTeam.members) {
        targetTeam.members = [];
      }

      const newMember = {
        name: officialStudentName,
        email: sessionEmail,
        phone: (body.phone || body.leadPhone || "").trim(),
        department: (body.department || parsedEmailInfo.branchName || "General").trim(),
        roll: (body.roll || "").trim(),
        joinedAt: new Date(),
      };

      targetTeam.members.push(newMember);
      const minMembers = event.minTeamMembers || 3;
      const totalJoined = 1 + targetTeam.members.length;
      targetTeam.status = totalJoined >= minMembers ? "confirmed" : "pending";

      await event.save();

      // Synchronize join with normalized Team model
      if (targetTeam.teamCode) {
        try {
          await Team.findOneAndUpdate(
            { teamCode: targetTeam.teamCode.toUpperCase() },
            {
              $push: { members: newMember },
              $set: { status: totalJoined >= minMembers ? "confirmed" : "pending" },
            }
          );
        } catch (teamSyncErr) {
          console.warn("Normalized team sync notice:", teamSyncErr);
        }
      }

      // Dispatch Google Workspace email notification asynchronously
      try {
        const mailRes = await sendRegistrationConfirmationEmail({
          name: newMember.name,
          email: sessionEmail,
          eventName: `${event.title} - Joined Team "${targetTeam.teamName}"`,
        });
        await logEmailDispatch({
          recipientEmail: sessionEmail,
          recipientName: newMember.name,
          category: "registration",
          eventId: event._id,
          subject: `Registration Confirmed: ${event.title} - Joined Team "${targetTeam.teamName}"`,
          status: mailRes.success ? "sent" : "failed",
          messageId: mailRes.messageId,
          error: mailRes.error,
          metadata: {
            action: "join_team",
            teamCode: targetTeam.teamCode,
            teamName: targetTeam.teamName,
          },
        });
      } catch (mailErr) {
        console.warn("Notice: Member confirmation email dispatch failed:", mailErr);
      }

      return NextResponse.json(
        {
          success: true,
          message: `Congratulations! You have successfully joined team "${targetTeam.teamName}".`,
          team: targetTeam,
          event: {
            id: event._id,
            title: event.title,
            tag: event.tag,
            date: event.date,
            venue: event.venue,
          },
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // ACTION 2: CREATE TEAM & GENERATE TEAM CODE
    // =========================================================================
    const { teamName, ventureName, leadPhone, department, membersCount } = body;

    if (!teamName || !teamName.trim()) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    if (alreadyRegisteredTeam) {
      return NextResponse.json(
        {
          error: `You are already registered in team "${alreadyRegisteredTeam.teamName}" for this event.`,
        },
        { status: 409 }
      );
    }

    // Check duplicate team name in this event
    const teamNameConflict = existingTeams.some(
      (t: { teamName: string }) =>
        t.teamName.trim().toLowerCase() === teamName.trim().toLowerCase()
    );

    if (teamNameConflict) {
      return NextResponse.json(
        {
          error: `The team name "${teamName.trim()}" is already registered for this event. Please choose a unique name.`,
        },
        { status: 409 }
      );
    }

    // Validate target team size bounds
    const minMembers = event.minTeamMembers || 3;
    const maxMembers = event.maxTeamMembers || 5;
    const teamSize = Number(membersCount) || maxMembers;

    if (teamSize < minMembers || teamSize > maxMembers) {
      return NextResponse.json(
        {
          error: `Team size violation: This event requires between ${minMembers} and ${maxMembers} members per team.`,
        },
        { status: 400 }
      );
    }

    // Generate unique Team Code
    const teamCode = generateTeamCode(existingTeams);

    const verifiedLeadName = officialStudentName;

    const newTeam = {
      id: "team_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      teamCode,
      teamName: teamName.trim(),
      ventureName: ventureName ? String(ventureName).trim() : "",
      leadName: verifiedLeadName,
      leadEmail: sessionEmail,
      leadPhone: leadPhone ? String(leadPhone).trim() : "",
      membersCount: teamSize,
      department: department ? String(department).trim() : "General",
      members: [],
      registeredAt: new Date(),
      status: (1 >= minMembers ? "confirmed" : "pending") as "confirmed" | "pending",
    };

    event.registeredTeams.push(newTeam);
    event.registeredTeamsCount = event.registeredTeams.length;
    await event.save();

    // Persist to normalized Team collection
    try {
      await Team.create({
        eventId: event._id,
        teamCode: teamCode.toUpperCase(),
        teamName: newTeam.teamName,
        ventureName: newTeam.ventureName,
        lead: {
          name: verifiedLeadName,
          email: sessionEmail,
          phone: newTeam.leadPhone,
          department: newTeam.department,
          roll: (body.roll || body.leadRoll || "").trim(),
        },
        leadEmail: sessionEmail,
        membersCount: newTeam.membersCount,
        department: newTeam.department,
        members: [],
        status: newTeam.status,
        checkedIn: false,
        registeredAt: new Date(),
      });
    } catch (teamCreateErr) {
      console.warn("Normalized Team creation warning:", teamCreateErr);
    }

    // Dispatch confirmation email to leader with their team code
    try {
      const mailRes = await sendRegistrationConfirmationEmail({
        name: verifiedLeadName,
        email: sessionEmail,
        eventName: `${event.title} (Team: ${newTeam.teamName}, Code: ${teamCode})`,
      });
      await logEmailDispatch({
        recipientEmail: sessionEmail,
        recipientName: verifiedLeadName,
        category: "registration",
        eventId: event._id,
        subject: `Registration Confirmed: ${event.title} (Team: ${newTeam.teamName}, Code: ${teamCode})`,
        status: mailRes.success ? "sent" : "failed",
        messageId: mailRes.messageId,
        error: mailRes.error,
        metadata: {
          action: "create_team",
          teamCode: newTeam.teamCode,
          teamName: newTeam.teamName,
        },
      });
    } catch (mailErr) {
      console.warn("Notice: Lead confirmation email dispatch failed:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Team "${newTeam.teamName}" created! Share code ${teamCode} with your teammates.`,
        team: newTeam,
        event: {
          id: event._id,
          title: event.title,
          tag: event.tag,
          date: event.date,
          venue: event.venue,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/events/register error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your registration." },
      { status: 500 }
    );
  }
}

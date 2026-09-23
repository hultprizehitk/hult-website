import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import User from "@/models/User";
import { auth } from "@/auth";
import { parseHeritageEmail } from "@/lib/heritage-parser";

/**
 * POST /api/teams/join
 * Authenticated student joins an existing team using its unique Team Code.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required. Please sign in." }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase().trim();
    const userName = session.user.name || "Student Member";

    if (!userEmail.endsWith("@heritageit.edu.in")) {
      return NextResponse.json(
        { error: "Access Restricted: Only @heritageit.edu.in college accounts can join teams." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { teamCode, phone, roll, department } = body;

    await connectDB();

    const userInDb = await User.findOne({ email: userEmail });
    const effectivePhone = phone?.trim() || userInDb?.phone?.trim() || "";
    const effectiveRoll = roll?.trim() || userInDb?.roll?.trim() || "";

    if (!teamCode?.trim() || !effectivePhone || !effectiveRoll) {
      return NextResponse.json(
        { error: "Team Code, Contact Phone, and College Roll No. are required." },
        { status: 400 }
      );
    }

    const cleanCode = teamCode.trim().toUpperCase();

    // 1. Find Team by code
    const team = await Team.findOne({ teamCode: cleanCode });
    if (!team) {
      return NextResponse.json(
        { error: `No active team found with code "${cleanCode}". Please verify the code with your team leader.` },
        { status: 404 }
      );
    }

    // 2. Fetch associated Event
    const event = await Event.findById(team.eventId);
    if (!event) {
      return NextResponse.json({ error: "Associated event not found." }, { status: 404 });
    }

    // 3. Validate Event Registration Status
    if (event.registrationStatus === "closed") {
      return NextResponse.json(
        { error: `Registrations for ${event.title} are closed.` },
        { status: 400 }
      );
    }

    // 4. Validate Event Deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (!isNaN(deadline.getTime()) && new Date() > deadline) {
        return NextResponse.json(
          { error: `The registration deadline for ${event.title} has passed.` },
          { status: 400 }
        );
      }
    }

    // 5. Team Capacity Limit Check
    const maxMembers = event.maxTeamMembers || 5;
    const currentMemberCount = 1 + (team.members?.length || 0); // 1 leader + members

    if (currentMemberCount >= maxMembers) {
      return NextResponse.json(
        {
          error: `Team "${team.teamName}" is already full (${maxMembers}/${maxMembers} members). No more teammates can be added.`,
        },
        { status: 400 }
      );
    }

    // 6. Duplicate check across the Event
    // 6a. Is user already the leader of this team?
    if (team.leadEmail === userEmail) {
      return NextResponse.json(
        { error: "You are already the Team Leader of this team!" },
        { status: 400 }
      );
    }

    // 6b. Is user already a member of this team?
    const alreadyInTeam = (team.members || []).some(
      (m) => m.email.toLowerCase() === userEmail
    );
    if (alreadyInTeam) {
      return NextResponse.json(
        { error: "You are already an active member of this team!" },
        { status: 400 }
      );
    }

    // 6c. Is user in another team for this event?
    const otherTeam = await Team.findOne({
      eventId: event._id,
      _id: { $ne: team._id },
      $or: [{ leadEmail: userEmail }, { "members.email": userEmail }],
    });

    if (otherTeam) {
      const isLead = otherTeam.leadEmail?.toLowerCase() === userEmail;
      return NextResponse.json(
        {
          error: isLead
            ? `You are already the Team Leader of another team ("${otherTeam.teamName}") for this event. You must disband/delete that team first before joining another.`
            : `You are already a member of another team ("${otherTeam.teamName}") for this event. A student can only participate in one team per event. Please leave your current team first.`,
        },
        { status: 400 }
      );
    }

    // Parse fallback student info
    const parsed = parseHeritageEmail(userEmail, userName);
    const userDept =
      department?.trim() ||
      (session.user as { department?: string })?.department ||
      parsed.branchName ||
      "General";
    const cleanPhone = effectivePhone;
    const cleanRoll = effectiveRoll;

    const newMember = {
      name: userName,
      email: userEmail,
      phone: cleanPhone,
      department: userDept,
      roll: cleanRoll,
      joinedAt: new Date(),
    };

    // 7. Push to Team.members
    team.members.push(newMember);

    const minMembers = event.minTeamMembers || 3;
    const currentTotal = 1 + team.members.length;
    if (team.submissionStatus !== "submitted") {
      team.submissionStatus = currentTotal >= minMembers ? "ready" : "forming";
    }

    await team.save();

    // 8. Synchronize to Event.registeredTeams
    if (Array.isArray(event.registeredTeams)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventTeam = event.registeredTeams.find(
        (t: any) =>
          t.id === team._id.toString() ||
          t.teamCode?.toUpperCase() === cleanCode
      );

      if (eventTeam) {
        if (!Array.isArray(eventTeam.members)) {
          eventTeam.members = [];
        }
        eventTeam.members.push(newMember);
        eventTeam.submissionStatus = team.submissionStatus;
        await event.save();
      }
    }

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
        message: `Successfully joined "${team.teamName}"!`,
        team,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("POST /api/teams/join error:", error);
    return NextResponse.json(
      { error: "Failed to join team: " + (error as Error).message },
      { status: 500 }
    );
  }
}

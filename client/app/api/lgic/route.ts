import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import EventRsvp from "@/models/EventRsvp";
import Team from "@/models/Team";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const session = await auth();
    const adminEmail = session?.user?.email?.toLowerCase().trim() || "admin@heritageit.edu.in";
    const body = await req.json();
    const { eventId, teamCode, action = "approve", note = "" } = body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required." }, { status: 400 });
    }

    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "Valid teamCode is required." }, { status: 400 });
    }

    const cleanCode = teamCode.trim().toUpperCase();
    await connectDB();

    let rsvp = await EventRsvp.findOne({
      eventId,
      teamCode: cleanCode,
    });

    const team = await Team.findOne({
      eventId,
      teamCode: cleanCode,
    });

    if (!rsvp && !team) {
      return NextResponse.json(
        { error: `No team or RSVP found with code "${cleanCode}" for this event.` },
        { status: 404 }
      );
    }

    // Auto-create RSVP if team exists but hadn't RSVP'd yet
    if (!rsvp && team) {
      rsvp = await EventRsvp.create({
        eventId: new mongoose.Types.ObjectId(eventId),
        teamId: team._id,
        teamCode: cleanCode,
        teamName: team.teamName,
        leadEmail: team.leadEmail.toLowerCase(),
        rsvpAt: new Date(),
        rsvpByEmail: adminEmail,
        checkedInMembers: [],
        checkInStatus: "rsvpd",
      });
    }

    if (!rsvp) {
      return NextResponse.json({ error: "Failed to initialize RSVP record." }, { status: 500 });
    }

    if (action === "approve") {
      rsvp.checkInStatus = "grace_approved";
      rsvp.graceApprovedAt = new Date();
      rsvp.graceApprovedBy = adminEmail;
      rsvp.graceNote = note.trim() || "Admin Grace Clearance";

      await rsvp.save();

      if (team) {
        team.checkedIn = true;
        team.checkedInAt = new Date();
        await team.save();
      }

      return NextResponse.json(
        {
          success: true,
          message: `Grace clearance approved for team "${rsvp.teamName}" (${cleanCode}).`,
          rsvp,
        },
        { status: 200 }
      );
    } else if (action === "revoke") {
      const scannedCount = rsvp.checkedInMembers?.length || 0;
      const totalCount = 1 + (team?.members?.length || 0);

      if (scannedCount === 0) {
        rsvp.checkInStatus = "rsvpd";
      } else if (scannedCount >= totalCount) {
        rsvp.checkInStatus = "fully_checked_in";
      } else {
        rsvp.checkInStatus = "partial";
      }

      rsvp.graceApprovedAt = undefined;
      rsvp.graceApprovedBy = undefined;
      rsvp.graceNote = undefined;

      await rsvp.save();

      return NextResponse.json(
        {
          success: true,
          message: `Grace clearance revoked for team "${rsvp.teamName}". Status reverted to "${rsvp.checkInStatus}".`,
          rsvp,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'revoke'." }, { status: 400 });
  } catch (error: unknown) {
    console.error("POST /api/lgic error:", error);
    return NextResponse.json({ error: "Internal server error in grace endpoint." }, { status: 500 });
  }
}

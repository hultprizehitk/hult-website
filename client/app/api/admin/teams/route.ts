import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import { isAuthorizedAdmin } from "@/lib/admin-check";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// Generate distinct team code (e.g. HULT-7X9K)
function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HULT-${suffix}`;
}

// GET: Fetch all registered teams for a specific event (or across events)
export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");

    await connectDB();

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return NextResponse.json({ error: "Invalid event ID format." }, { status: 400 });
      }

      const event = await Event.findById(eventId).lean();
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // 1. Fetch normalized teams
      const normalizedTeams = await Team.find({ eventId: event._id })
        .sort({ registeredAt: -1, createdAt: -1 })
        .lean();

      // 2. Fetch legacy teams from event.registeredTeams
      const legacyTeams = Array.isArray(event.registeredTeams) ? event.registeredTeams : [];

      // Unified map by teamCode or id
      const teamMap = new Map<string, any>();

      for (const t of normalizedTeams) {
        const key = (t.teamCode || t._id.toString()).toUpperCase();
        teamMap.set(key, {
          id: t._id.toString(),
          teamCode: t.teamCode,
          teamName: t.teamName,
          ventureName: t.ventureName || "",
          lead: {
            name: t.lead?.name || "Team Leader",
            email: t.lead?.email || t.leadEmail || "",
            phone: t.lead?.phone || "",
            department: t.lead?.department || t.department || "General",
            roll: t.lead?.roll || "",
          },
          membersCount: t.membersCount || 4,
          department: t.department || t.lead?.department || "General",
          members: Array.isArray(t.members) ? t.members : [],
          status: t.status || "confirmed",
          checkedIn: Boolean(t.checkedIn),
          checkedInAt: t.checkedInAt || null,
          registeredAt: t.registeredAt || t.createdAt || new Date(),
        });
      }

      for (const lt of legacyTeams) {
        const key = (lt.teamCode || lt.id || "").toUpperCase();
        if (key && !teamMap.has(key)) {
          teamMap.set(key, {
            id: lt.id || `legacy_${Date.now()}`,
            teamCode: lt.teamCode || "HULT-AUTO",
            teamName: lt.teamName,
            ventureName: lt.ventureName || "",
            lead: {
              name: lt.leadName || "Team Leader",
              email: lt.leadEmail || "",
              phone: lt.leadPhone || "",
              department: lt.department || "General",
              roll: "",
            },
            membersCount: lt.membersCount || 4,
            department: lt.department || "General",
            members: Array.isArray(lt.members) ? lt.members : [],
            status: lt.status || "confirmed",
            checkedIn: Boolean(lt.checkedIn),
            checkedInAt: lt.checkedInAt || null,
            registeredAt: lt.registeredAt || new Date(),
          });
        }
      }

      const allTeams = Array.from(teamMap.values());

      return NextResponse.json(
        {
          success: true,
          event: {
            id: event._id.toString(),
            title: event.title,
            tag: event.tag,
            date: event.date,
            venue: event.venue,
            registrationStatus: event.registrationStatus,
            maxTeams: event.maxTeams,
            registeredTeamsCount: allTeams.length,
          },
          teams: allTeams,
        },
        { status: 200 }
      );
    }

    // If no eventId specified, return all teams across all events
    const allNormalized = await Team.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, teams: allNormalized }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/teams error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

// POST: Register a new team into an event from admin console
export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const {
      eventId,
      teamName,
      ventureName,
      leadName,
      leadEmail,
      leadPhone,
      department,
      roll,
      membersCount,
      members,
      status,
    } = body;

    if (!eventId || !teamName || !leadName || !leadEmail) {
      return NextResponse.json(
        { error: "Event ID, Team Name, Leader Name, and Leader Email are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate unique team code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await Team.findOne({ teamCode: code });
      if (!exists) break;
      code = generateCode();
      attempts++;
    }

    const membersList = Array.isArray(members)
      ? members.map((m: any) => ({
          name: String(m.name || "").trim(),
          email: String(m.email || "").trim().toLowerCase(),
          phone: String(m.phone || "").trim(),
          department: String(m.department || department || "General").trim(),
          roll: String(m.roll || "").trim(),
          joinedAt: new Date(),
        }))
      : [];

    const newTeam = await Team.create({
      eventId: event._id,
      teamCode: code,
      teamName: teamName.trim(),
      ventureName: ventureName?.trim() || "",
      lead: {
        name: leadName.trim(),
        email: leadEmail.trim().toLowerCase(),
        phone: leadPhone?.trim() || "",
        department: department?.trim() || "General",
        roll: roll?.trim() || "",
      },
      leadEmail: leadEmail.trim().toLowerCase(),
      membersCount: Number(membersCount) || 4,
      department: department?.trim() || "General",
      members: membersList,
      status: status || "confirmed",
      checkedIn: false,
      registeredAt: new Date(),
    });

    // Also mirror to event.registeredTeams
    event.registeredTeams.push({
      id: newTeam._id.toString(),
      teamCode: code,
      teamName: newTeam.teamName,
      ventureName: newTeam.ventureName,
      leadName: newTeam.lead.name,
      leadEmail: newTeam.lead.email,
      leadPhone: newTeam.lead.phone,
      membersCount: newTeam.membersCount,
      department: newTeam.department,
      members: membersList,
      registeredAt: new Date(),
      status: newTeam.status as any,
      checkedIn: false,
    });
    event.registeredTeamsCount = event.registeredTeams.length;
    await event.save();

    return NextResponse.json(
      {
        success: true,
        message: `Team "${newTeam.teamName}" registered with code ${code}!`,
        team: newTeam,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/teams error:", error);
    return NextResponse.json({ error: "Failed to register team: " + (error as Error).message }, { status: 500 });
  }
}

// PUT: Manage team details, check-in attendance, or status
export async function PUT(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { teamId, eventId, action } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
    }

    await connectDB();

    // 1. ACTION: Toggle / Set Check-in Status
    if (action === "toggle_check_in") {
      const checkedIn = Boolean(body.checkedIn);
      const checkedInAt = checkedIn ? new Date() : undefined;

      // Update in normalized collection
      let updatedTeam: any = null;
      if (mongoose.Types.ObjectId.isValid(teamId)) {
        updatedTeam = await Team.findByIdAndUpdate(
          teamId,
          { checkedIn, ...(checkedIn ? { checkedInAt } : { $unset: { checkedInAt: 1 } }) },
          { new: true }
        );
      }

      // Also update in embedded Event array if eventId or event found
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        const ev = await Event.findById(eventId);
        if (ev && Array.isArray(ev.registeredTeams)) {
          const match = ev.registeredTeams.find((t: any) => t.id === teamId || t.teamCode === body.teamCode);
          if (match) {
            match.checkedIn = checkedIn;
            match.checkedInAt = checkedInAt;
            await ev.save();
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: checkedIn ? "Team marked as Checked In!" : "Check-in removed.",
          checkedIn,
          checkedInAt,
          team: updatedTeam,
        },
        { status: 200 }
      );
    }

    // 2. ACTION: Update Status (confirmed, pending, waitlist, disqualified)
    if (action === "update_status") {
      const newStatus = body.status;
      if (!["confirmed", "pending", "waitlist", "disqualified"].includes(newStatus)) {
        return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
      }

      let updatedTeam: any = null;
      if (mongoose.Types.ObjectId.isValid(teamId)) {
        updatedTeam = await Team.findByIdAndUpdate(teamId, { status: newStatus }, { new: true });
      }

      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        const ev = await Event.findById(eventId);
        if (ev && Array.isArray(ev.registeredTeams)) {
          const match = ev.registeredTeams.find((t: any) => t.id === teamId || t.teamCode === body.teamCode);
          if (match) {
            match.status = newStatus;
            await ev.save();
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `Team status changed to ${newStatus.toUpperCase()}.`,
          status: newStatus,
          team: updatedTeam,
        },
        { status: 200 }
      );
    }

    // 3. ACTION: Edit Team Details
    if (action === "update_details") {
      const { teamName, ventureName, lead, department } = body;

      const updateData: any = {};
      if (teamName) updateData.teamName = teamName.trim();
      if (ventureName !== undefined) updateData.ventureName = ventureName.trim();
      if (department) updateData.department = department.trim();
      if (lead) {
        updateData.lead = lead;
        if (lead.email) updateData.leadEmail = lead.email.toLowerCase().trim();
      }

      let updatedTeam: any = null;
      if (mongoose.Types.ObjectId.isValid(teamId)) {
        updatedTeam = await Team.findByIdAndUpdate(teamId, updateData, { new: true });
      }

      return NextResponse.json(
        { success: true, message: "Team details updated successfully.", team: updatedTeam },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: unknown) {
    console.error("PUT /api/admin/teams error:", error);
    return NextResponse.json({ error: "Failed to update team: " + (error as Error).message }, { status: 500 });
  }
}

// DELETE: Remove team registration
export async function DELETE(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    const eventId = url.searchParams.get("eventId");
    const teamCode = url.searchParams.get("teamCode");

    if (!teamId && !teamCode) {
      return NextResponse.json({ error: "Team ID or Code is required." }, { status: 400 });
    }

    await connectDB();

    // 1. Delete from Team collection
    if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
      await Team.findByIdAndDelete(teamId);
    } else if (teamCode) {
      await Team.findOneAndDelete({ teamCode: teamCode.toUpperCase() });
    }

    // 2. Remove from Event.registeredTeams
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      const ev = await Event.findById(eventId);
      if (ev && Array.isArray(ev.registeredTeams)) {
        ev.registeredTeams = ev.registeredTeams.filter(
          (t: any) => t.id !== teamId && t.teamCode !== teamCode
        );
        ev.registeredTeamsCount = ev.registeredTeams.length;
        await ev.save();
      }
    }

    return NextResponse.json({ success: true, message: "Team registration removed successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/teams error:", error);
    return NextResponse.json({ error: "Failed to delete team: " + (error as Error).message }, { status: 500 });
  }
}

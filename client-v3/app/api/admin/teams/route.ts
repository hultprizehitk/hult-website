import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HULT-${suffix}`;
}

export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const status = url.searchParams.get("status");

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = { eventId: event._id };
      if (status && status !== "all") filter.status = status;

      const normalizedTeams = await Team.find(filter)
        .sort({ registeredAt: -1, createdAt: -1 })
        .lean();

      // 2. Fetch legacy teams from event.registeredTeams
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacyTeams = Array.isArray(event.registeredTeams) ? (event.registeredTeams as any[]) : [];

      // Unified map by teamCode or id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamMap = new Map<string, any>();

      for (const t of normalizedTeams) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyT = t as any;
        const key = (anyT.teamCode || anyT._id.toString()).toUpperCase();
        teamMap.set(key, {
          id: anyT._id.toString(),
          teamCode: anyT.teamCode,
          teamName: anyT.teamName,
          ventureName: anyT.ventureName || "",
          lead: {
            name: anyT.lead?.name || "Team Leader",
            email: anyT.lead?.email || anyT.leadEmail || "",
            phone: anyT.lead?.phone || "",
            department: anyT.lead?.department || anyT.department || "General",
            roll: anyT.lead?.roll || "",
          },
          membersCount: anyT.membersCount || 4,
          department: anyT.department || anyT.lead?.department || "General",
          members: Array.isArray(anyT.members) ? anyT.members : [],
          status: anyT.status || "confirmed",
          checkedIn: Boolean(anyT.checkedIn),
          checkedInAt: anyT.checkedInAt || null,
          registeredAt: anyT.registeredAt || anyT.createdAt || new Date(),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status && status !== "all") filter.status = status;

    const allNormalized = await Team.find(filter)
      .populate("eventId", "title date tag")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, teams: allNormalized }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/teams error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const session = await auth();
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

    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await Team.findOne({ teamCode: code });
      if (!exists) break;
      code = generateCode();
      attempts++;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membersList = Array.isArray(members)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: newTeam.status as any,
      checkedIn: false,
    });
    event.registeredTeamsCount = event.registeredTeams.length;
    await event.save();

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Created team registration "${newTeam.teamName}"`,
      targetType: "team",
      targetId: newTeam._id.toString(),
      details: { teamCode: code, eventId },
      req,
    });

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

export async function PUT(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const session = await auth();
    const body = await req.json();
    const { teamId, eventId, action } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
    }

    await connectDB();

    if (action === "toggle_check_in") {
      const checkedIn = Boolean(body.checkedIn);
      const checkedInAt = checkedIn ? new Date() : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updatedTeam: any = null;
      if (mongoose.Types.ObjectId.isValid(teamId)) {
        updatedTeam = await Team.findByIdAndUpdate(
          teamId,
          { checkedIn, ...(checkedIn ? { checkedInAt } : { $unset: { checkedInAt: 1 } }) },
          { new: true }
        );
      }

      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        const ev = await Event.findById(eventId);
        if (ev && Array.isArray(ev.registeredTeams)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const match = ev.registeredTeams.find((t: any) => t.id === teamId || t.teamCode === body.teamCode);
          if (match) {
            match.checkedIn = checkedIn;
            match.checkedInAt = checkedInAt;
            await ev.save();
          }
        }
      }

      await logAdminAction({
        adminEmail: session?.user?.email || "admin",
        adminName: session?.user?.name || "Admin",
        adminRole: (session?.user as { role?: string })?.role || "admin",
        action: checkedIn ? "team_checkin" : "team_uncheckin",
        targetType: "team",
        targetId: teamId,
        details: { checkedIn, eventId, teamCode: body.teamCode },
        req,
      });

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

    if (action === "update_status") {
      const newStatus = body.status;
      if (!["confirmed", "pending", "waitlist", "disqualified"].includes(newStatus)) {
        return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updatedTeam: any = null;
      if (mongoose.Types.ObjectId.isValid(teamId)) {
        updatedTeam = await Team.findByIdAndUpdate(teamId, { status: newStatus }, { new: true });
      }

      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        const ev = await Event.findById(eventId);
        if (ev && Array.isArray(ev.registeredTeams)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const match = ev.registeredTeams.find((t: any) => t.id === teamId || t.teamCode === body.teamCode);
          if (match) {
            match.status = newStatus;
            await ev.save();
          }
        }
      }

      await logAdminAction({
        adminEmail: session?.user?.email || "admin",
        adminName: session?.user?.name || "Admin",
        adminRole: (session?.user as { role?: string })?.role || "admin",
        action: "team_status_change",
        targetType: "team",
        targetId: teamId,
        details: { newStatus, eventId, teamCode: body.teamCode },
        req,
      });

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

    if (action === "update_details") {
      const { teamName, ventureName, lead, department } = body;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (teamName) updateData.teamName = teamName.trim();
      if (ventureName !== undefined) updateData.ventureName = ventureName.trim();
      if (department) updateData.department = department.trim();
      if (lead) {
        updateData.lead = lead;
        if (lead.email) updateData.leadEmail = lead.email.toLowerCase().trim();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updatedTeam: any = null;
      if (mongoose.Types.ObjectId.isValid(teamId)) {
        updatedTeam = await Team.findByIdAndUpdate(teamId, updateData, { new: true });
      }

      await logAdminAction({
        adminEmail: session?.user?.email || "admin",
        adminName: session?.user?.name || "Admin",
        adminRole: (session?.user as { role?: string })?.role || "admin",
        action: "team_update_details",
        targetType: "team",
        targetId: teamId,
        details: { teamName, ventureName, department, leadEmail: lead?.email },
        req,
      });

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

export async function PATCH(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const session = await auth();
    const body = await req.json();
    const { teamId, status, checkedIn } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    await connectDB();
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (status && ["confirmed", "pending", "waitlist", "disqualified"].includes(status)) {
      team.status = status;
      updates.status = status;
    }

    if (typeof checkedIn === "boolean") {
      team.checkedIn = checkedIn;
      team.checkedInAt = checkedIn ? new Date() : undefined;
      updates.checkedIn = checkedIn;
    }

    await team.save();

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Updated team status for "${team.teamName}"`,
      targetType: "team",
      targetId: teamId,
      details: updates,
      req,
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Admin teams PATCH error:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const session = await auth();
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    const eventId = url.searchParams.get("eventId");
    const teamCode = url.searchParams.get("teamCode");

    if (!teamId && !teamCode) {
      return NextResponse.json({ error: "Team ID or Code is required." }, { status: 400 });
    }

    await connectDB();

    if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
      await Team.findByIdAndDelete(teamId);
    } else if (teamCode) {
      await Team.findOneAndDelete({ teamCode: teamCode.toUpperCase() });
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      const ev = await Event.findById(eventId);
      if (ev && Array.isArray(ev.registeredTeams)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ev.registeredTeams = ev.registeredTeams.filter((t: any) => t.id !== teamId && t.teamCode !== teamCode);
        ev.registeredTeamsCount = ev.registeredTeams.length;
        await ev.save();
      }
    }

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: "team_delete",
      targetType: "team",
      targetId: teamId || teamCode || "",
      details: { teamId, eventId, teamCode },
      req,
    });

    return NextResponse.json({ success: true, message: "Team registration removed successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/teams error:", error);
    return NextResponse.json({ error: "Failed to delete team: " + (error as Error).message }, { status: 500 });
  }
}

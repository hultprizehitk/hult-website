import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Event, { IRegisteredTeam } from "@/models/Event";
import Team from "@/models/Team";
import User from "@/models/User";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import { generateTeamCode } from "@/lib/teams/team-utils";

export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const status = url.searchParams.get("status");
    const submissionStatus = url.searchParams.get("submissionStatus");

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
      if (submissionStatus && submissionStatus !== "all") filter.submissionStatus = submissionStatus;

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
          ventureDescription: anyT.ventureDescription || "",
          pitchDeckUrl: anyT.pitchDeckUrl || "",
          submissionStatus: anyT.submissionStatus || "forming",
          submittedAt: anyT.submittedAt || null,
          lead: {
            name: anyT.lead?.name || "Team Leader",
            email: anyT.lead?.email || anyT.leadEmail || "",
            phone: anyT.lead?.phone || "",
            department: anyT.lead?.department || anyT.department || "General",
            roll: anyT.lead?.roll || "",
            checkedIn: Boolean(anyT.lead?.checkedIn || anyT.checkedIn),
            checkedInAt: anyT.lead?.checkedInAt || (anyT.checkedIn ? anyT.checkedInAt : null),
          },
          membersCount: anyT.membersCount || 4,
          department: anyT.department || anyT.lead?.department || "General",
          members: Array.isArray(anyT.members)
            ? anyT.members.map((m: any) => ({
                name: m.name || "",
                email: m.email || "",
                phone: m.phone || "",
                department: m.department || anyT.department || "General",
                roll: m.roll || "",
                checkedIn: Boolean(m.checkedIn !== undefined ? m.checkedIn : anyT.checkedIn),
                checkedInAt: m.checkedInAt || (anyT.checkedIn ? anyT.checkedInAt : null),
              }))
            : [],
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
              checkedIn: Boolean(lt.leadCheckedIn !== undefined ? lt.leadCheckedIn : lt.checkedIn),
              checkedInAt: lt.leadCheckedInAt || (lt.checkedIn ? lt.checkedInAt : null),
            },
            membersCount: lt.membersCount || 4,
            department: lt.department || "General",
            members: Array.isArray(lt.members)
              ? lt.members.map((m: any) => ({
                  name: m.name || "",
                  email: m.email || "",
                  phone: m.phone || "",
                  department: m.department || lt.department || "General",
                  roll: m.roll || "",
                  checkedIn: Boolean(m.checkedIn !== undefined ? m.checkedIn : lt.checkedIn),
                  checkedInAt: m.checkedInAt || (lt.checkedIn ? lt.checkedInAt : null),
                }))
              : [],
            status: lt.status || "confirmed",
            submissionStatus: lt.submissionStatus || "submitted",
            submittedAt: lt.submittedAt || null,
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
    if (submissionStatus && submissionStatus !== "all") filter.submissionStatus = submissionStatus;

    const allNormalized = await Team.find(filter)
      .populate("eventId", "title date tag")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich missing lead phone/roll/department/year from User records
    const leadEmails = (allNormalized as Array<{ leadEmail?: string; lead?: { email?: string } }>)
      .map((t) => (t.leadEmail || t.lead?.email || "").toLowerCase().trim())
      .filter(Boolean);

    if (leadEmails.length > 0) {
      const users = await User.find({ email: { $in: leadEmails } })
        .select("email phone roll department year")
        .lean();
      const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u]));

      for (const t of allNormalized as Array<{
        leadEmail?: string;
        lead?: { phone?: string; roll?: string; department?: string; year?: string; email?: string };
      }>) {
        const u = userMap.get((t.leadEmail || t.lead?.email || "").toLowerCase());
        if (u) {
          if (!t.lead) t.lead = {};
          if (!t.lead.phone && u.phone) t.lead.phone = u.phone;
          if (!t.lead.roll && u.roll) t.lead.roll = u.roll;
          if (!t.lead.department && u.department) t.lead.department = u.department;
          if (u.year) t.lead.year = u.year;
        }
      }
    }

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

    let code = generateTeamCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await Team.findOne({ teamCode: code });
      if (!exists) break;
      code = generateTeamCode();
      attempts++;
    }

    const membersList = Array.isArray(members)
      ? members.map((m: { name?: unknown; email?: unknown; phone?: unknown; department?: unknown; roll?: unknown }) => ({
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
      submissionStatus: "submitted",
      submittedAt: new Date(),
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
      submissionStatus: "submitted",
      submittedAt: new Date(),
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
    const { teamId, eventId, action, teamCode } = body;

    if (!teamId && !teamCode && !body.payload && !body.rawCode && !body.participantEmail) {
      return NextResponse.json({ error: "Team ID, Team Code, or Scan Payload is required." }, { status: 400 });
    }

    await connectDB();

    // -------------------------------------------------------------
    // Helper: Sync Team to Event.registeredTeams
    // -------------------------------------------------------------
    const syncTeamToEvent = async (tDoc: any, targetEventId?: string) => {
      const effEventId = targetEventId || tDoc?.eventId?.toString();
      if (!effEventId || !mongoose.Types.ObjectId.isValid(effEventId)) return;
      try {
        const ev = await Event.findById(effEventId);
        if (ev && Array.isArray(ev.registeredTeams)) {
          const match = ev.registeredTeams.find(
            (r: IRegisteredTeam) =>
              (tDoc._id && (r.id === tDoc._id.toString() || r.teamCode?.toUpperCase() === tDoc.teamCode?.toUpperCase())) ||
              (tDoc.teamCode && r.teamCode?.toUpperCase() === tDoc.teamCode?.toUpperCase())
          );
          if (match) {
            match.checkedIn = tDoc.checkedIn;
            match.checkedInAt = tDoc.checkedInAt;
            match.leadCheckedIn = Boolean(tDoc.lead?.checkedIn);
            match.leadCheckedInAt = tDoc.lead?.checkedInAt;
            if (Array.isArray(tDoc.members) && Array.isArray(match.members)) {
              match.members.forEach((m: any) => {
                const docMem = tDoc.members.find((tm: any) => tm.email?.toLowerCase() === m.email?.toLowerCase());
                if (docMem) {
                  m.checkedIn = Boolean(docMem.checkedIn);
                  m.checkedInAt = docMem.checkedInAt;
                }
              });
            }
            await ev.save();
          }
        }
      } catch (err) {
        console.error("Failed syncing team to event:", err);
      }
    };

    // -------------------------------------------------------------
    // Action: SCAN CHECK-IN (Handles participant QR, email, roll, team)
    // -------------------------------------------------------------
    if (action === "scan_check_in") {
      const rawInput = String(body.payload || body.rawCode || teamCode || "").trim();
      let extractedEmail: string | null = null;
      let extractedTeamCode: string | null = null;
      let extractedRoll: string | null = null;

      // 1. JSON Payload: {"email": "...", "teamCode": "..."}
      if (rawInput.startsWith("{") && rawInput.endsWith("}")) {
        try {
          const parsed = JSON.parse(rawInput);
          if (parsed.email) extractedEmail = String(parsed.email).trim().toLowerCase();
          if (parsed.participantEmail) extractedEmail = String(parsed.participantEmail).trim().toLowerCase();
          if (parsed.teamCode) extractedTeamCode = String(parsed.teamCode).trim().toUpperCase();
          if (parsed.roll) extractedRoll = String(parsed.roll).trim();
        } catch {}
      }

      // 2. URL Payload: ?email=...&teamCode=...
      if (!extractedEmail && !extractedTeamCode && (rawInput.startsWith("http://") || rawInput.startsWith("https://"))) {
        try {
          const urlObj = new URL(rawInput);
          extractedEmail = urlObj.searchParams.get("email") || urlObj.searchParams.get("participantEmail");
          extractedTeamCode = urlObj.searchParams.get("teamCode") || urlObj.searchParams.get("code");
          extractedRoll = urlObj.searchParams.get("roll");
          if (extractedEmail) extractedEmail = extractedEmail.trim().toLowerCase();
          if (extractedTeamCode) extractedTeamCode = extractedTeamCode.trim().toUpperCase();
        } catch {}
      }

      // 3. Delimited string: HULT-XXXX:student@heritageit.edu.in
      if (!extractedEmail && rawInput.includes(":")) {
        const parts = rawInput.split(":");
        parts.forEach((p) => {
          const tp = p.trim();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tp)) extractedEmail = tp.toLowerCase();
          else if (/^[A-Za-z0-9_-]{4,32}$/.test(tp)) extractedTeamCode = tp.toUpperCase();
        });
      }

      // 4. Direct Email
      if (!extractedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput)) {
        extractedEmail = rawInput.toLowerCase();
      }

      // 5. Query string format: teamCode=XYZ or email=XYZ
      if (!extractedEmail && rawInput.includes("email=")) {
        const m = rawInput.match(/email=([^&]+)/i);
        if (m && m[1]) extractedEmail = decodeURIComponent(m[1]).trim().toLowerCase();
      }
      if (!extractedTeamCode && rawInput.includes("teamCode=")) {
        const m = rawInput.match(/teamCode=([a-zA-Z0-9_-]+)/i);
        if (m && m[1]) extractedTeamCode = m[1].trim().toUpperCase();
      }

      // 6. Direct Team Code format
      if (!extractedEmail && !extractedTeamCode && /^[A-Za-z0-9_-]{4,32}$/.test(rawInput)) {
        extractedTeamCode = rawInput.toUpperCase();
      }

      // Find the team in MongoDB
      let targetTeam: any = null;

      if (extractedEmail) {
        targetTeam = await Team.findOne({
          $or: [{ leadEmail: extractedEmail }, { "members.email": extractedEmail }],
        });
      }

      if (!targetTeam && extractedRoll) {
        targetTeam = await Team.findOne({
          $or: [{ "lead.roll": extractedRoll }, { "members.roll": extractedRoll }],
        });
      }

      if (!targetTeam && (extractedTeamCode || teamCode)) {
        const c = (extractedTeamCode || teamCode).toUpperCase();
        targetTeam = await Team.findOne({ teamCode: c });
      }

      if (!targetTeam && teamId && mongoose.Types.ObjectId.isValid(teamId)) {
        targetTeam = await Team.findById(teamId);
      }

      if (!targetTeam) {
        return NextResponse.json(
          { error: `No registered participant or team found for "${rawInput}".` },
          { status: 404 }
        );
      }

      // Edge Case 1: Check forming team
      const isSubmitted = targetTeam.submissionStatus === "submitted" || Boolean(targetTeam.submittedAt);
      if (!isSubmitted) {
        return NextResponse.json(
          { error: `Check-in blocked: Team "${targetTeam.teamName}" is still Forming and has not submitted registration.` },
          { status: 400 }
        );
      }

      // Edge Case 2: Check disqualified
      if (targetTeam.status === "disqualified") {
        return NextResponse.json(
          { error: `Check-in blocked: Team "${targetTeam.teamName}" is disqualified from event participation.` },
          { status: 400 }
        );
      }

      // Edge Case 3: Check Event ID mismatch
      if (eventId && targetTeam.eventId && targetTeam.eventId.toString() !== eventId) {
        const registeredEv = await Event.findById(targetTeam.eventId).lean();
        const evTitle = registeredEv ? registeredEv.title : "another event";
        return NextResponse.json(
          { error: `Event Mismatch: Team is registered for "${evTitle}", not this event.` },
          { status: 400 }
        );
      }

      // Identify Participant (Leader vs Member)
      let scannedParticipant: { name: string; role: string; email: string } | null = null;
      let isDuplicate = false;
      let priorCheckInTime: Date | null = null;

      if (extractedEmail && targetTeam.leadEmail.toLowerCase() === extractedEmail) {
        // Scanned Team Leader
        scannedParticipant = {
          name: targetTeam.lead.name || "Team Leader",
          role: "Team Leader",
          email: targetTeam.lead.email,
        };
        if (targetTeam.lead.checkedIn) {
          isDuplicate = true;
          priorCheckInTime = targetTeam.lead.checkedInAt || null;
        } else {
          targetTeam.lead.checkedIn = true;
          targetTeam.lead.checkedInAt = new Date();
        }
      } else if (extractedEmail) {
        // Scanned Member
        const memIdx = targetTeam.members.findIndex((m: any) => m.email?.toLowerCase() === extractedEmail);
        if (memIdx !== -1) {
          const m = targetTeam.members[memIdx];
          scannedParticipant = {
            name: m.name,
            role: "Member",
            email: m.email,
          };
          if (m.checkedIn) {
            isDuplicate = true;
            priorCheckInTime = m.checkedInAt || null;
          } else {
            m.checkedIn = true;
            m.checkedInAt = new Date();
          }
        }
      } else if (extractedRoll && targetTeam.lead.roll === extractedRoll) {
        scannedParticipant = {
          name: targetTeam.lead.name || "Team Leader",
          role: "Team Leader",
          email: targetTeam.lead.email,
        };
        if (targetTeam.lead.checkedIn) {
          isDuplicate = true;
          priorCheckInTime = targetTeam.lead.checkedInAt || null;
        } else {
          targetTeam.lead.checkedIn = true;
          targetTeam.lead.checkedInAt = new Date();
        }
      } else if (extractedRoll) {
        const memIdx = targetTeam.members.findIndex((m: any) => m.roll === extractedRoll);
        if (memIdx !== -1) {
          const m = targetTeam.members[memIdx];
          scannedParticipant = {
            name: m.name,
            role: "Member",
            email: m.email,
          };
          if (m.checkedIn) {
            isDuplicate = true;
            priorCheckInTime = m.checkedInAt || null;
          } else {
            m.checkedIn = true;
            m.checkedInAt = new Date();
          }
        }
      } else {
        // Scanned Team Code directly -> Check in entire team roster
        scannedParticipant = {
          name: `${targetTeam.lead.name} (Full Team)`,
          role: "Entire Roster",
          email: targetTeam.lead.email,
        };
        if (targetTeam.checkedIn) {
          isDuplicate = true;
          priorCheckInTime = targetTeam.checkedInAt || null;
        } else {
          targetTeam.lead.checkedIn = true;
          targetTeam.lead.checkedInAt = targetTeam.lead.checkedInAt || new Date();
          targetTeam.members.forEach((m: any) => {
            m.checkedIn = true;
            m.checkedInAt = m.checkedInAt || new Date();
          });
        }
      }

      // Compute total checked in roster
      const totalRoster = 1 + (Array.isArray(targetTeam.members) ? targetTeam.members.length : 0);
      const leadChecked = targetTeam.lead.checkedIn ? 1 : 0;
      const membersChecked = Array.isArray(targetTeam.members)
        ? targetTeam.members.filter((m: any) => m.checkedIn).length
        : 0;
      const checkedInCount = leadChecked + membersChecked;
      const allMembersCheckedIn = checkedInCount >= totalRoster;

      // Auto Team Check-In Trigger
      if (allMembersCheckedIn) {
        targetTeam.checkedIn = true;
        targetTeam.checkedInAt = targetTeam.checkedInAt || new Date();
      } else {
        targetTeam.checkedIn = false;
        targetTeam.checkedInAt = null;
      }

      await targetTeam.save();
      await syncTeamToEvent(targetTeam, eventId);

      // Audit Log
      await logAdminAction({
        adminEmail: session?.user?.email || "admin",
        adminName: session?.user?.name || "Admin",
        adminRole: (session?.user as { role?: string })?.role || "admin",
        action: "participant_checkin",
        targetType: "team",
        targetId: targetTeam._id.toString(),
        details: {
          teamCode: targetTeam.teamCode,
          teamName: targetTeam.teamName,
          participant: scannedParticipant,
          allMembersCheckedIn,
          checkedInCount,
          totalRoster,
          duplicate: isDuplicate,
        },
        req,
      });

      if (isDuplicate) {
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
            message: `${scannedParticipant?.name || "Participant"} is already checked in${priorCheckInTime ? ` (at ${new Date(priorCheckInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}.`,
            team: targetTeam,
            participant: scannedParticipant,
            allCheckedIn: targetTeam.checkedIn,
            checkedInCount,
            totalMembers: totalRoster,
          },
          { status: 200 }
        );
      }

      const successMsg = allMembersCheckedIn
        ? `All ${totalRoster} members verified! Team "${targetTeam.teamName}" is now fully Checked In!`
        : `${scannedParticipant?.name} checked in! (${checkedInCount} of ${totalRoster} members verified)`;

      return NextResponse.json(
        {
          success: true,
          duplicate: false,
          allCheckedIn: targetTeam.checkedIn,
          checkedInCount,
          totalMembers: totalRoster,
          participant: scannedParticipant,
          team: targetTeam,
          message: successMsg,
        },
        { status: 200 }
      );
    }

    // -------------------------------------------------------------
    // Action: TOGGLE PARTICIPANT CHECK-IN (From LiveEventManager table)
    // -------------------------------------------------------------
    if (action === "toggle_participant_check_in") {
      const { participantEmail, checkedIn } = body;
      const targetCheckedIn = Boolean(checkedIn);
      const cleanEmail = String(participantEmail || "").trim().toLowerCase();

      let targetTeam: any = null;
      if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
        targetTeam = await Team.findById(teamId);
      } else if (teamCode) {
        targetTeam = await Team.findOne({ teamCode: String(teamCode).trim().toUpperCase() });
      }

      if (!targetTeam) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }

      const isSubmitted = targetTeam.submissionStatus === "submitted" || Boolean(targetTeam.submittedAt);
      if (!isSubmitted) {
        return NextResponse.json(
          { error: "Cannot check in members of an unsubmitted forming team." },
          { status: 400 }
        );
      }

      let updatedPersonName = "Participant";
      if (targetTeam.leadEmail.toLowerCase() === cleanEmail) {
        targetTeam.lead.checkedIn = targetCheckedIn;
        targetTeam.lead.checkedInAt = targetCheckedIn ? new Date() : undefined;
        updatedPersonName = targetTeam.lead.name;
      } else {
        const memIdx = targetTeam.members.findIndex((m: any) => m.email?.toLowerCase() === cleanEmail);
        if (memIdx !== -1) {
          targetTeam.members[memIdx].checkedIn = targetCheckedIn;
          targetTeam.members[memIdx].checkedInAt = targetCheckedIn ? new Date() : undefined;
          updatedPersonName = targetTeam.members[memIdx].name;
        }
      }

      // Recalculate auto team check-in
      const totalRoster = 1 + (Array.isArray(targetTeam.members) ? targetTeam.members.length : 0);
      const leadChecked = targetTeam.lead.checkedIn ? 1 : 0;
      const membersChecked = Array.isArray(targetTeam.members)
        ? targetTeam.members.filter((m: any) => m.checkedIn).length
        : 0;
      const checkedInCount = leadChecked + membersChecked;
      const allMembersCheckedIn = checkedInCount >= totalRoster;

      targetTeam.checkedIn = allMembersCheckedIn;
      targetTeam.checkedInAt = allMembersCheckedIn ? (targetTeam.checkedInAt || new Date()) : null;

      await targetTeam.save();
      await syncTeamToEvent(targetTeam, eventId);

      return NextResponse.json(
        {
          success: true,
          message: targetCheckedIn
            ? allMembersCheckedIn
              ? `All ${totalRoster} members verified! Team marked Checked In!`
              : `${updatedPersonName} marked Checked In (${checkedInCount}/${totalRoster})`
            : `Check-in reverted for ${updatedPersonName}.`,
          allCheckedIn: targetTeam.checkedIn,
          checkedInCount,
          totalMembers: totalRoster,
          team: targetTeam,
        },
        { status: 200 }
      );
    }

    // -------------------------------------------------------------
    // Action: TOGGLE TEAM CHECK-IN (Entire Team)
    // -------------------------------------------------------------
    if (action === "toggle_check_in") {
      const checkedIn = Boolean(body.checkedIn);
      const checkedInAt = checkedIn ? new Date() : null;
      const cleanCode = teamCode ? String(teamCode).trim().toUpperCase() : undefined;

      let targetTeam: any = null;
      if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
        targetTeam = await Team.findById(teamId);
      } else if (cleanCode) {
        targetTeam = await Team.findOne({ teamCode: cleanCode });
      }

      if (!targetTeam) {
        return NextResponse.json(
          { error: `Team with code "${cleanCode || teamId}" was not found.` },
          { status: 404 }
        );
      }

      const isSubmitted = targetTeam.submissionStatus === "submitted" || Boolean(targetTeam.submittedAt);
      if (checkedIn && !isSubmitted) {
        return NextResponse.json(
          { error: "Check-in blocked: Team is still Forming and has not submitted registration." },
          { status: 400 }
        );
      }

      // Cascade check-in to lead and members
      targetTeam.checkedIn = checkedIn;
      targetTeam.checkedInAt = checkedInAt;
      targetTeam.lead.checkedIn = checkedIn;
      targetTeam.lead.checkedInAt = checkedInAt;
      if (Array.isArray(targetTeam.members)) {
        targetTeam.members.forEach((m: any) => {
          m.checkedIn = checkedIn;
          m.checkedInAt = checkedInAt;
        });
      }

      await targetTeam.save();
      await syncTeamToEvent(targetTeam, eventId);

      const effectiveTargetId = targetTeam._id.toString();

      await logAdminAction({
        adminEmail: session?.user?.email || "admin",
        adminName: session?.user?.name || "Admin",
        adminRole: (session?.user as { role?: string })?.role || "admin",
        action: checkedIn ? "team_checkin" : "team_uncheckin",
        targetType: "team",
        targetId: effectiveTargetId,
        details: { checkedIn, eventId, teamCode: targetTeam.teamCode },
        req,
      });

      return NextResponse.json(
        {
          success: true,
          message: checkedIn ? "All team members marked as Checked In!" : "Check-in removed for all team members.",
          checkedIn,
          checkedInAt,
          team: targetTeam,
        },
        { status: 200 }
      );
    }

    if (action === "update_status") {
      const newStatus = body.status;
      if (!["confirmed", "disqualified"].includes(newStatus)) {
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
    if (status && ["confirmed", "disqualified"].includes(status)) {
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

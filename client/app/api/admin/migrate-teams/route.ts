import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Team from "@/models/Team";
import { isAuthorizedAdmin } from "@/lib/admin-check";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// POST: Migrate existing embedded Event.registeredTeams into dedicated Team collection
export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    await connectDB();
    const events = await Event.find({ "registeredTeams.0": { $exists: true } });

    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const event of events) {
      if (!Array.isArray(event.registeredTeams)) continue;

      for (const legacyTeam of event.registeredTeams) {
        if (!legacyTeam.teamCode || !legacyTeam.leadEmail) continue;

        // Check if team is already in the normalized Team collection
        const existing = await Team.findOne({
          $or: [
            { teamCode: legacyTeam.teamCode.toUpperCase() },
            { eventId: event._id, leadEmail: legacyTeam.leadEmail.toLowerCase() },
          ],
        });

        if (existing) {
          totalSkipped++;
          continue;
        }

        const membersList = Array.isArray(legacyTeam.members)
          ? legacyTeam.members.map((m: any) => ({
              name: m.name || "Student Co-Founder",
              email: (m.email || "").toLowerCase(),
              phone: m.phone || "",
              department: m.department || "General",
              roll: m.roll || "",
              joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
            }))
          : [];

        await Team.create({
          eventId: event._id,
          teamCode: legacyTeam.teamCode.toUpperCase(),
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
          members: membersList,
          status: legacyTeam.status || "pending",
          checkedIn: false,
          registeredAt: legacyTeam.registeredAt ? new Date(legacyTeam.registeredAt) : new Date(),
        });

        totalMigrated++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Migration completed: ${totalMigrated} teams migrated, ${totalSkipped} already normalized.`,
        migrated: totalMigrated,
        skipped: totalSkipped,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Failed to execute team migration: " + (error as Error).message },
      { status: 500 }
    );
  }
}

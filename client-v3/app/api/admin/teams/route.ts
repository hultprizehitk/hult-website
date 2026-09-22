import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import Team from "@/models/Team";

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (eventId) filter.eventId = eventId;
    if (status && status !== "all") filter.status = status;

    const teams = await Team.find(filter)
      .populate("eventId", "title date tag")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error("Admin teams GET error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
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

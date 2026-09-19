import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import { auth } from "@/auth";

// GET: Fetch user's profile customization OR list radar students looking for team
export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const isRadarQuery = url.searchParams.get("radar") === "true";

    await connectDB();

    // If querying radar list for matchmaking
    if (isRadarQuery) {
      const radarUsers = await User.find({ lookingForTeam: true })
        .select("name email department year avatarId archetype desiredRole bio lookingForTeam")
        .limit(20)
        .lean();

      return NextResponse.json({ radarStudents: radarUsers }, { status: 200 });
    }

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({
        avatarId: "ai-architect",
        archetype: "Neon Cyberpunk",
        xp: 150,
        level: 1,
        lookingForTeam: false,
        desiredRole: "Co-Founder",
      });
    }

    return NextResponse.json({
      avatarId: user.avatarId || "ai-architect",
      archetype: user.archetype || "Neon Cyberpunk",
      xp: user.xp || 150,
      level: user.level || 1,
      lookingForTeam: user.lookingForTeam || false,
      desiredRole: user.desiredRole || "Co-Founder",
      bio: user.bio || "",
    });
  } catch (err: any) {
    console.error("GET /api/profile/customize error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// POST: Save profile avatar, team badge, or matchmaking status
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const body = await req.json();
    const { action, avatarId, archetype, teamId, badgeConfig, lookingForTeam, desiredRole, bio } = body;

    await connectDB();

    // 1. Update 3D Founder Character Avatar
    if (action === "update_avatar") {
      if (!avatarId) {
        return NextResponse.json({ error: "Avatar ID is required" }, { status: 400 });
      }

      const updatedUser = await User.findOneAndUpdate(
        { email },
        { avatarId, archetype: archetype || "Cyberpunk" },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    }

    // 2. Update Team Guild Badge (Team Leader Only)
    if (action === "update_team_badge") {
      if (!teamId || !badgeConfig) {
        return NextResponse.json({ error: "Team ID and badgeConfig are required" }, { status: 400 });
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.leadEmail.toLowerCase() !== email) {
        return NextResponse.json(
          { error: "Only the Team Leader can customize the Team Badge." },
          { status: 403 }
        );
      }

      team.badgeConfig = badgeConfig;
      await team.save();

      return NextResponse.json({ success: true, team }, { status: 200 });
    }

    // 3. Toggle Co-Founder Matchmaking Radar Status
    if (action === "toggle_looking_for_team") {
      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          lookingForTeam: Boolean(lookingForTeam),
          desiredRole: desiredRole || "Co-Founder",
          bio: bio || "",
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/profile/customize error:", err);
    return NextResponse.json({ error: err.message || "Failed to save customization" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { teamId, action, reason } = await req.json();

    if (!teamId || !["disqualify", "reinstate"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters. teamId and valid action ('disqualify' | 'reinstate') required." },
        { status: 400 }
      );
    }

    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction session not found" }, { status: 404 });
    }

    const teamIndex = session.teams.findIndex((t) => t.teamId === teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    const team = session.teams[teamIndex];
    if (action === "disqualify") {
      team.status = "disqualified";
      team.disqualificationReason = reason || "Disqualified for rules violation";
    } else {
      team.status = "active";
      team.disqualificationReason = "";
    }

    session.markModified("teams");
    await session.save();

    return NextResponse.json({
      success: true,
      message: `Team ${team.teamName} marked as ${action === "disqualify" ? "Disqualified" : "Active"}`,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update team status" },
      { status: 500 }
    );
  }
}

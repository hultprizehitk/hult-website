import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { lotId } = await req.json();

    if (!lotId) {
      return NextResponse.json({ success: false, error: "lotId is required" }, { status: 400 });
    }

    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction session not found" }, { status: 404 });
    }

    const lotIndex = session.lots.findIndex((l) => l.lotId === lotId);
    if (lotIndex === -1) {
      return NextResponse.json({ success: false, error: "Lot not found" }, { status: 404 });
    }

    const lot = session.lots[lotIndex];
    if (lot.status !== "sold") {
      return NextResponse.json({ success: false, error: "Item is not currently marked as sold" }, { status: 400 });
    }

    const winningTeamId = lot.winningTeamId;
    const soldPrice = lot.soldPrice || 0;

    // Refund team and remove asset from inventory
    if (winningTeamId) {
      const teamIndex = session.teams.findIndex((t) => t.teamId === winningTeamId);
      if (teamIndex !== -1) {
        const team = session.teams[teamIndex];
        team.currentBalance = Math.round((team.currentBalance + soldPrice) * 100) / 100;

        if (lot.type === "industry") {
          team.ownedIndustries = team.ownedIndustries.filter((id) => id !== lot.lotId);
        } else if (lot.type === "state" && team.ownedState === lot.lotId) {
          team.ownedState = null;
        }
      }
    }

    // Reset lot
    const prevTeamName = lot.winningTeamName;
    lot.status = "unsold";
    lot.winningTeamId = null;
    lot.winningTeamName = null;
    lot.soldPrice = null;
    lot.soldAt = null;

    // Remove from history
    session.history = session.history.filter((h) => !(h.lotId === lot.lotId && h.teamId === winningTeamId));

    session.markModified("teams");
    session.markModified("lots");
    session.markModified("history");
    await session.save();

    return NextResponse.json({
      success: true,
      message: `Revoked sale of ${lot.name}. Refunded ₹${soldPrice} Cr to ${prevTeamName}.`,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke sale" },
      { status: 500 }
    );
  }
}

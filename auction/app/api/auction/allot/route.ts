import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { lotId, teamId, price } = await req.json();

    if (!lotId || !teamId || typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters. lotId, teamId, and positive price are required." },
        { status: 400 }
      );
    }

    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction session not found" }, { status: 404 });
    }

    const teamIndex = session.teams.findIndex((t) => t.teamId === teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ success: false, error: "Selected team does not exist" }, { status: 400 });
    }

    const team = session.teams[teamIndex];
    if (team.status === "disqualified") {
      return NextResponse.json(
        { success: false, error: `Team ${team.teamName} is currently disqualified.` },
        { status: 400 }
      );
    }

    const lotIndex = session.lots.findIndex((l) => l.lotId === lotId);
    if (lotIndex === -1) {
      return NextResponse.json({ success: false, error: "Selected lot does not exist" }, { status: 400 });
    }

    const lot = session.lots[lotIndex];
    if (lot.status === "sold") {
      return NextResponse.json(
        { success: false, error: `Item ${lot.name} is already sold to ${lot.winningTeamName}. Revoke first if needed.` },
        { status: 400 }
      );
    }

    // Validation: Budget Limit
    if (price > team.currentBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Overspending violation: Team ${team.teamName} only has ₹${team.currentBalance} Cr remaining, cannot bid ₹${price} Cr.`,
        },
        { status: 400 }
      );
    }

    // Validation: Exactly One State Limit
    if (lot.type === "state" && team.ownedState) {
      return NextResponse.json(
        {
          success: false,
          error: `Rule violation: Team ${team.teamName} already owns a State. Each team is strictly limited to 1 State.`,
        },
        { status: 400 }
      );
    }

    // Deduct Funds and Assign Asset
    team.currentBalance = Math.round((team.currentBalance - price) * 100) / 100;

    if (lot.type === "industry") {
      if (!team.ownedIndustries.includes(lot.lotId)) {
        team.ownedIndustries.push(lot.lotId);
      }
    } else if (lot.type === "state") {
      team.ownedState = lot.lotId;
    }

    // Update Lot
    lot.status = "sold";
    lot.winningTeamId = team.teamId;
    lot.winningTeamName = team.teamName;
    lot.soldPrice = price;
    lot.soldAt = new Date();

    // Log in History
    session.history.unshift({
      lotId: lot.lotId,
      lotName: lot.name,
      type: lot.type,
      teamId: team.teamId,
      teamName: team.teamName,
      price: price,
      timestamp: new Date(),
    });

    // Store last sold lot for stage presentation
    session.lastSoldLot = {
      lotId: lot.lotId,
      name: lot.name,
      type: lot.type,
      winningTeamId: team.teamId,
      winningTeamName: team.teamName,
      price: price,
      soldAt: new Date(),
    };
    session.stageMode = "sold";
    session.viewerMode = "stage";
    session.activeLotId = lot.lotId; // Keep active until cleared or admin changes screen

    session.markModified("teams");
    session.markModified("lots");
    session.markModified("history");
    session.markModified("lastSoldLot");
    await session.save();

    return NextResponse.json({
      success: true,
      message: `Sold ${lot.name} to ${team.teamName} for ₹${price} Cr`,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to allot item" },
      { status: 500 }
    );
  }
}

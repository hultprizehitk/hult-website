import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (!guard.ok) return guard.response;

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
    let prevTeamCode = "";

    // Refund team and remove asset from inventory
    if (winningTeamId) {
      const teamIndex = session.teams.findIndex((t) => t.teamId === winningTeamId);
      if (teamIndex !== -1) {
        const team = session.teams[teamIndex];
        prevTeamCode = team.teamCode || "";
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

    // Undo the stage pointers so a revoked sale never stays on the projector
    if (session.activeLotId === lot.lotId) {
      session.activeLotId = null;
    }
    if (session.lastSoldLot?.lotId === lot.lotId) {
      const latest = session.history[0];
      session.lastSoldLot = latest
        ? {
            lotId: latest.lotId,
            name: latest.lotName,
            type: latest.type,
            winningTeamId: latest.teamId,
            winningTeamName: latest.teamName,
            price: latest.price,
            soldAt: latest.timestamp,
          }
        : null;
      if (!session.lastSoldLot) {
        session.stageMode = "auto";
        session.viewerMode = "stage";
      }
    }

    session.markModified("teams");
    session.markModified("lots");
    session.markModified("history");
    session.markModified("lastSoldLot");
    await session.save();

    await logAction(req, {
      action: "revoke",
      teamId: winningTeamId || "",
      teamName: prevTeamName || "",
      teamCode: prevTeamCode,
      lotId: lot.lotId,
      lotName: lot.name,
      lotType: lot.type,
      amount: soldPrice,
      detail: `Revoked sale of ${lot.name}${prevTeamName ? ` from ${prevTeamName}` : ""} and refunded ₹${soldPrice} Cr`,
    });

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

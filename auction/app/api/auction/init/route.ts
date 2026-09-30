import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";
import { INDUSTRIES, STATES, INITIAL_TEAM_BUDGET } from "@/lib/auction-data";
import mongoose from "mongoose";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    let inputTeams = body.teams as
      | { teamId: string; teamName: string; teamCode: string; quizRank: number }[]
      | undefined;

    // If no teams passed, query the main database's teams collection for confirmed teams
    if (!inputTeams || inputTeams.length === 0) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const registeredTeams = await db
            .collection("teams")
            .find({ status: "confirmed" })
            .limit(10)
            .toArray();

          if (registeredTeams && registeredTeams.length > 0) {
            inputTeams = registeredTeams.map((t, idx) => ({
              teamId: t._id.toString(),
              teamName: t.teamName || `Team ${idx + 1}`,
              teamCode: t.teamCode || `T00${idx + 1}`,
              quizRank: idx + 1,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not query teams collection, falling back to slots:", err);
      }
    }

    // If still fewer than 10 teams, fill up to 10 slots
    if (!inputTeams || inputTeams.length === 0) {
      inputTeams = Array.from({ length: 10 }, (_, i) => ({
        teamId: `team-${i + 1}`,
        teamName: `Quiz Qualifier #${i + 1}`,
        teamCode: `QQ-0${i + 1}`,
        quizRank: i + 1,
      }));
    } else if (inputTeams.length < 10) {
      const existingCount = inputTeams.length;
      for (let i = existingCount; i < 10; i++) {
        inputTeams.push({
          teamId: `team-${i + 1}`,
          teamName: `Qualifier Slot #${i + 1}`,
          teamCode: `QS-0${i + 1}`,
          quizRank: i + 1,
        });
      }
    }

    // Build teams schema array
    const auctionTeams = inputTeams.slice(0, 10).map((t, idx) => ({
      teamId: t.teamId || `team-${idx + 1}`,
      teamName: t.teamName,
      teamCode: t.teamCode || `T${idx + 1}`,
      quizRank: t.quizRank || idx + 1,
      startingBudget: INITIAL_TEAM_BUDGET,
      currentBalance: INITIAL_TEAM_BUDGET,
      ownedIndustries: [],
      ownedState: null,
      status: "active",
      disqualificationReason: "",
    }));

    // Build 16 industry lots + 10 state lots
    const lots = [
      ...INDUSTRIES.map((ind) => ({
        lotId: ind.id,
        name: ind.name,
        type: "industry" as const,
        basePrice: ind.basePrice,
        status: "unsold" as const,
        winningTeamId: null,
        winningTeamName: null,
        soldPrice: null,
        soldAt: null,
      })),
      ...STATES.map((st) => ({
        lotId: st.id,
        name: st.name,
        type: "state" as const,
        basePrice: st.basePrice,
        status: "unsold" as const,
        winningTeamId: null,
        winningTeamName: null,
        soldPrice: null,
        soldAt: null,
      })),
    ];

    const session = await AuctionSession.findOneAndUpdate(
      { sessionId: "live" },
      {
        $set: {
          currentRound: "round1",
          activeLotId: null,
          matrixRevealed: false,
          teams: auctionTeams,
          lots: lots,
          history: [],
          reAuctionVotes: {},
        },
      },
      { upsert: true, new: true }
    );

    await logAction(req, {
      action: "init",
      amount: null,
      detail: `Auction reset with ${auctionTeams.length} teams, ${lots.length} lots. All balances cleared.`,
    });

    return NextResponse.json({
      success: true,
      message: "Auction initialized with 10 Top Quiz Teams, 16 Industries, and 10 States",
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize auction" },
      { status: 500 }
    );
  }
}

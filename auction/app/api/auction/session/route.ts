import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";
import { evaluateTeamScore, rankAllTeams } from "@/lib/auction-data";

export async function GET() {
  try {
    await connectDB();
    let session = await AuctionSession.findOne({ sessionId: "live" });

    if (!session) {
      session = await AuctionSession.create({
        sessionId: "live",
        currentRound: "setup",
        activeLotId: null,
        matrixRevealed: false,
        teams: [],
        lots: [],
        history: [],
      });
    }

    // Compute live results if in results round or for preview
    const evaluatedTeams = session.teams.map((t) =>
      evaluateTeamScore({
        teamId: t.teamId,
        teamName: t.teamName,
        teamCode: t.teamCode,
        quizRank: t.quizRank,
        currentBalance: t.currentBalance,
        ownedState: t.ownedState,
        ownedIndustries: t.ownedIndustries,
        status: t.status,
      })
    );

    const rankedTeams = rankAllTeams(evaluatedTeams);

    const sessionObj = session.toObject ? session.toObject() : session;
    if (!sessionObj.viewerMode) {
      sessionObj.viewerMode =
        sessionObj.stageMode === "matrix"
          ? "matrix"
          : sessionObj.stageMode === "board"
          ? "ledger"
          : "stage";
    }

    return NextResponse.json({
      success: true,
      session: sessionObj,
      liveStandings: rankedTeams,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch auction session" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";
import AuctionLog from "@/models/AuctionLog";
import {
  evaluateTeamScore,
  rankAllTeams,
  INDUSTRIES,
  STATES,
  MINIMUM_BALANCE_THRESHOLD,
} from "@/lib/auction-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const wanted = decodeURIComponent(code).replace(/^#/, "").trim().toUpperCase();

    if (!wanted) {
      return NextResponse.json({ success: false, error: "Enter a team code." }, { status: 400 });
    }

    await connectDB();
    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction not started yet." }, { status: 404 });
    }

    const team = session.teams.find((t: any) => (t.teamCode || "").toUpperCase() === wanted);
    if (!team) {
      return NextResponse.json(
        { success: false, error: `No team found with code ${wanted}.` },
        { status: 404 }
      );
    }

    const evaluated = session.teams.map((t: any) =>
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
    const ranked = rankAllTeams(evaluated);
    const me = ranked.find((r) => r.teamId === team.teamId);

    const stateObj = team.ownedState ? STATES.find((s) => s.id === team.ownedState) : null;

    const industries = (team.ownedIndustries || []).map((id: string) => {
      const ind = INDUSTRIES.find((i) => i.id === id);
      const sector = stateObj?.sectors.find((s) => s.industryId === id);
      return {
        id,
        name: ind?.name || id,
        matched: Boolean(sector),
        points: sector?.points || 0,
        priority: sector?.priority || null,
      };
    });

    const activity = await AuctionLog.find({ sessionId: "live", teamCode: team.teamCode })
      .select("_id action lotName lotType amount detail createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      team: {
        teamName: team.teamName,
        teamCode: team.teamCode,
        quizRank: team.quizRank,
        currentBalance: team.currentBalance,
        startingBudget: team.startingBudget,
        safeMax: Math.max(0, team.currentBalance - MINIMUM_BALANCE_THRESHOLD),
        status: team.status,
        ownedStateId: team.ownedState,
        ownedStateName: stateObj?.name || null,
        stateSectors: stateObj?.sectors || [],
      },
      score: me,
      industries,
      purchases: (session.history || [])
        .filter((h: any) => h.teamId === team.teamId)
        .slice(0, 30),
      activity,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch team" },
      { status: 500 }
    );
  }
}

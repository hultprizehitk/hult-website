import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { readPublishedQuizTop10, toSeedTeams } from "@/lib/quiz-standings";

export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
    }

    // The quiz publishes its final top 10 when the session ends. That is the real ranking.
    const standings = await readPublishedQuizTop10();
    if (standings) {
      return NextResponse.json({
        success: true,
        source: "quiz",
        quizCode: standings.code,
        eventTitle: standings.eventTitle,
        publishedAt: standings.publishedAt,
        totalRanked: standings.totalRanked,
        teams: toSeedTeams(standings).map((t, i) => ({
          id: t.teamId,
          name: t.teamName,
          code: t.teamCode,
          quizRank: t.quizRank,
          rank: standings.teams[i]?.rank ?? t.quizRank,
          score: standings.teams[i]?.score ?? null,
          correctCount: standings.teams[i]?.correctCount ?? null,
        })),
      });
    }

    // Nothing published yet: fall back to registrations so Setup is usable before the quiz runs.
    const registeredTeams = await db
      .collection("teams")
      .find({})
      .sort({ registeredAt: 1 })
      .project({
        _id: 1,
        teamName: 1,
        teamCode: 1,
        ventureName: 1,
        status: 1,
        submissionStatus: 1,
      })
      .toArray();

    return NextResponse.json({
      success: true,
      source: "registrations",
      teams: registeredTeams.map((t) => ({
        id: t._id.toString(),
        name: t.teamName,
        code: t.teamCode,
        venture: t.ventureName,
        status: t.status,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch team source" },
      { status: 500 }
    );
  }
}

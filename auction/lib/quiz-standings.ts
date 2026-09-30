import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

/** Collection the quiz app upserts its final top 10 into when the session ends. */
export const QUIZ_STANDINGS_COLLECTION = "quizStandings";

export interface QuizStandingTeam {
  rank: number;
  teamId: string;
  teamName: string;
  teamCode: string | null;
  score: number;
  totalTimeMs: number;
  correctCount: number;
  answeredCount: number;
}

export interface QuizStandingsDoc {
  code: string;
  eventTitle: string | null;
  publishedAt: Date;
  totalRanked: number;
  teams: QuizStandingTeam[];
}

/** The seed shape the admin Setup tab and /api/auction/init both consume. */
export interface SeedTeam {
  teamId: string;
  teamName: string;
  teamCode: string;
  quizRank: number;
}

/**
 * Newest published quiz top 10, or null when the quiz has not published yet.
 * The quiz keys each publish by session code, so this picks the most recent one and the
 * auction does not need to know the session code in advance.
 */
export async function readPublishedQuizTop10(limit = 10): Promise<QuizStandingsDoc | null> {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return null;

  const doc = await db
    .collection(QUIZ_STANDINGS_COLLECTION)
    .find({ teams: { $exists: true, $ne: [] } })
    .sort({ publishedAt: -1 })
    .limit(1)
    .next();

  if (!doc) return null;
  const teams = (Array.isArray(doc.teams) ? doc.teams : [])
    .slice()
    .sort((a: QuizStandingTeam, b: QuizStandingTeam) => a.rank - b.rank)
    .slice(0, limit);

  if (!teams.length) return null;
  return {
    code: doc.code,
    eventTitle: doc.eventTitle ?? null,
    publishedAt: doc.publishedAt ?? null,
    totalRanked: doc.totalRanked ?? teams.length,
    teams,
  };
}

/** Maps a published leaderboard into the auction's seed shape, falling back to a generated code. */
export function toSeedTeams(standings: QuizStandingsDoc): SeedTeam[] {
  return standings.teams.map((t, i) => ({
    teamId: t.teamId || `quiz-${i + 1}`,
    teamName: t.teamName || `Quiz Qualifier #${t.rank || i + 1}`,
    teamCode: t.teamCode || `QS-${String(t.rank || i + 1).padStart(2, "0")}`,
    quizRank: t.rank || i + 1,
  }));
}

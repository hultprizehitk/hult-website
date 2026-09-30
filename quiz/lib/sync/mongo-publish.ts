// The ONLY quiz module allowed to write to the main site's MongoDB. Reads standings out of Firestore
// and upserts them into the `quizStandings` collection, which the auction app reads to seed its top 10.
// The reader (mongo-read.ts) stays read-only; tests/unit/sync-guard.test.ts enforces both halves.
import { connectDB } from "@/lib/db";
import { adminDb } from "@/lib/firebase/admin";
import { paths, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import { LEADERBOARD_SIZE } from "@/lib/quiz/types";

export const STANDINGS_COLLECTION = "quizStandings";

/** One ranked team as the auction consumes it. teamCode is joined in here because the session leaderboard omits it. */
export interface PublishedTeam {
  rank: number;
  teamId: string;
  teamName: string;
  teamCode: string | null;
  score: number;
  totalTimeMs: number;
  correctCount: number;
  answeredCount: number;
}

export interface PublishResult {
  published: boolean;
  code: string;
  count: number;
  reason?: "no_mongodb" | "no_standings";
}

/** Stored shape. _id is the normalized session code string so re-publishing upserts in place. */
interface StandingsDoc extends Record<string, unknown> {
  _id: string;
}

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * Upserts the session's final top 10 into MongoDB keyed by session code, so re-running is idempotent.
 * Refuses to publish an empty leaderboard rather than wiping a good earlier publish, and is a no-op when
 * MONGODB_URI is unset (local emulator development).
 */
export async function publishStandingsToMongo(code: string, now: Date = new Date()): Promise<PublishResult> {
  if (!process.env.MONGODB_URI) return { published: false, code, count: 0, reason: "no_mongodb" };

  const db = adminDb();
  const sSnap = await db.doc(paths.session(code)).get();
  if (!sSnap.exists) return { published: false, code, count: 0, reason: "no_standings" };
  const s = sSnap.data() as SessionDoc;

  const leaderboard = (s.leaderboard ?? []).slice().sort((a, b) => a.rank - b.rank).slice(0, LEADERBOARD_SIZE);
  if (!leaderboard.length) return { published: false, code, count: 0, reason: "no_standings" };

  // The session leaderboard carries rank/score but no teamCode; the team docs hold it.
  const teamIds = leaderboard.map((r) => r.teamId);
  const teamsSnap = await db.getAll(...teamIds.map((id) => db.doc(paths.team(code, id))));
  const codeOf = new Map(teamsSnap.map((d) => [d.id, (d.data() as TeamDoc | undefined)?.teamCode ?? null]));

  const teams: PublishedTeam[] = leaderboard.map((r) => ({
    rank: r.rank,
    teamId: r.teamId,
    teamName: r.teamName,
    teamCode: codeOf.get(r.teamId) ?? null,
    score: r.score,
    totalTimeMs: r.totalTimeMs,
    correctCount: r.correctCount,
    answeredCount: r.answeredCount,
  }));

  const mongo = (await connectDB()).connection.db;
  if (!mongo) throw new Error("MongoDB not connected");
  // Typed as a loose document because _id is the session code string, not an ObjectId.
  await mongo.collection<StandingsDoc>(STANDINGS_COLLECTION).replaceOne(
    { _id: normalizeCode(code) },
    {
      code,
      eventId: s.eventId,
      eventTitle: s.eventTitle ?? null,
      title: s.title,
      status: s.status,
      gradedThrough: s.gradedThrough,
      totalRanked: s.totalRanked ?? leaderboard.length,
      publishedAt: now,
      publishedBy: "quiz-end",
      teams,
    },
    { upsert: true },
  );

  console.info(`[quiz publish] ${code} -> ${STANDINGS_COLLECTION} (${teams.length} teams)`);
  return { published: true, code, count: teams.length };
}

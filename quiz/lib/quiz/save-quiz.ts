import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { QuizError } from "./errors";
import { paths, type QuestionDoc, type SavedQuizSnapshot, type SessionDoc, type TeamDoc } from "./fs-types";
import { standingsFromTeams } from "./client-state";
import { getSession } from "./sessions";

export interface SaveQuizResult {
  savedAt: number;
  totalTeams: number;
  checkedInTeams: number;
  totalQuestions: number;
  leaderboardCount: number;
}

/**
 * Aggregates all session questions, teams, answers, scores, and standings,
 * and writes a permanent snapshot document into Firebase DB under:
 * quizSessions/{code}/savedResults/latest
 * and quizSessions/{code}/savedResults/{timestamp}
 */
export async function saveQuizSnapshot(code: string, adminEmail: string, now: Date = new Date()): Promise<SaveQuizResult> {
  const db = adminDb();
  const session = await getSession(code);
  if (!session) throw new QuizError("not_found", "Session not found");

  const [questionsSnap, teamsSnap] = await Promise.all([
    db.collection(paths.questions(code)).orderBy("order", "asc").get(),
    db.collection(paths.teams(code)).get(),
  ]);

  const questions = questionsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as QuestionDoc),
  }));

  const teams = teamsSnap.docs.map((d) => d.data() as TeamDoc);
  const checkedInTeams = teams.filter((t) => t.checkedInAt);
  const standings = standingsFromTeams(teams);

  const snapshot: SavedQuizSnapshot<Timestamp> = {
    code: session.code,
    title: session.title,
    eventId: session.eventId,
    eventTitle: session.eventTitle,
    status: session.status,
    savedAt: Timestamp.fromDate(now),
    savedBy: adminEmail,
    totalQuestions: questions.length,
    totalTeams: teams.length,
    checkedInTeams: checkedInTeams.length,
    standings,
    questions,
    teamsSummary: teams.map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      teamCode: t.teamCode,
      score: t.score,
      totalTimeMs: t.totalTimeMs,
      rank: t.rank,
      takerEmail: t.takerEmail,
      answeredCount: t.answeredCount,
      correctCount: t.correctCount,
      answers: t.perQuestion ?? {},
    })),
  };

  const timestampId = String(now.getTime());

  const batch = db.batch();
  // 1. Write the latest snapshot doc
  batch.set(db.doc(paths.savedResult(code, "latest")), snapshot);
  // 2. Write the timestamped history archive
  batch.set(db.doc(paths.savedResult(code, timestampId)), snapshot);
  // 3. Update the parent session doc with last saved meta
  batch.update(db.doc(paths.session(code)), {
    lastSavedAt: Timestamp.fromDate(now),
    lastSavedBy: adminEmail,
  });

  await batch.commit();

  return {
    savedAt: now.getTime(),
    totalTeams: teams.length,
    checkedInTeams: checkedInTeams.length,
    totalQuestions: questions.length,
    leaderboardCount: standings.length,
  };
}

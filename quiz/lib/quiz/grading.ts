import type { QuestionResult } from "./fs-types";
import { rankStandings } from "./scoring";
import type { Standing } from "./types";

export interface GradeTeam {
  teamId: string;
  teamName: string;
  checkedIn: boolean;
  currentAnswer: { qid: string; optionIndex: number; responseMs: number } | null;
  score: number;
  totalTimeMs: number;
  answeredCount: number;
  correctCount: number;
  /** Rank after the previous graded question; becomes the new standing's prevRank. */
  rank?: number | null;
  /** This question's earlier result, if it was graded before (admin re-published it). It is replaced, not added to. */
  previous?: QuestionResult | null;
}

export interface GradeQuestionInput {
  id: string;
  index: number;
  correctIndex: number;
  points: number;
  timeLimitSec: number;
  optionCount: number;
}

export interface TeamGradeUpdate {
  score: number;
  totalTimeMs: number;
  answeredCount: number;
  correctCount: number;
  result: QuestionResult;
}

export interface GradeOutput {
  updates: Map<string, TeamGradeUpdate>;
  distribution: number[];
  /** All checked-in teams ranked after this question. */
  standings: Standing[];
}

/**
 * Grades one question for every checked-in team (runs once, at Reveal or End).
 * Correct = question points; wrong/none = 0. Time = response time (clamped to the limit), or the full limit if unanswered.
 */
export function gradeQuestion(q: GradeQuestionInput, teams: GradeTeam[]): GradeOutput {
  const limitMs = q.timeLimitSec * 1000;
  const distribution = new Array<number>(q.optionCount).fill(0);
  const updates = new Map<string, TeamGradeUpdate>();

  for (const t of teams) {
    if (!t.checkedIn) continue;
    const a = t.currentAnswer && t.currentAnswer.qid === q.id ? t.currentAnswer : null;
    let result: QuestionResult;
    if (a) {
      if (a.optionIndex >= 0 && a.optionIndex < q.optionCount) distribution[a.optionIndex] += 1;
      const correct = a.optionIndex === q.correctIndex;
      result = { optionIndex: a.optionIndex, correct, points: correct ? q.points : 0, ms: Math.min(Math.max(a.responseMs, 0), limitMs) };
    } else {
      result = { optionIndex: null, correct: false, points: 0, ms: limitMs };
    }
    const p = t.previous;
    updates.set(t.teamId, {
      score: t.score - (p?.points ?? 0) + result.points,
      totalTimeMs: t.totalTimeMs - (p?.ms ?? 0) + result.ms,
      answeredCount: t.answeredCount - (p && p.optionIndex !== null ? 1 : 0) + (a ? 1 : 0),
      correctCount: t.correctCount - (p?.correct ? 1 : 0) + (result.correct ? 1 : 0),
      result,
    });
  }

  const standings = rankStandings(
    teams
      .filter((t) => updates.has(t.teamId))
      .map((t) => {
        const u = updates.get(t.teamId)!;
        return {
          teamId: t.teamId,
          teamName: t.teamName,
          score: u.score,
          totalTimeMs: u.totalTimeMs,
          answeredCount: u.answeredCount,
          correctCount: u.correctCount,
          lastMs: u.result.optionIndex === null ? null : u.result.ms,
          lastCorrect: u.result.correct,
          prevRank: t.rank ?? null,
        };
      }),
  );

  return { updates, distribution, standings };
}

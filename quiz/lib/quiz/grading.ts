import type { PlanItem, QuestionResult } from "./fs-types";
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
    updates.set(t.teamId, {
      score: t.score + result.points,
      totalTimeMs: t.totalTimeMs + result.ms,
      answeredCount: t.answeredCount + (a ? 1 : 0),
      correctCount: t.correctCount + (result.correct ? 1 : 0),
      result,
    });
  }

  const standings = rankStandings(
    teams
      .filter((t) => updates.has(t.teamId))
      .map((t) => {
        const u = updates.get(t.teamId)!;
        return { teamId: t.teamId, teamName: t.teamName, score: u.score, totalTimeMs: u.totalTimeMs, answeredCount: u.answeredCount, correctCount: u.correctCount };
      }),
  );

  return { updates, distribution, standings };
}

/** A team checking in after some questions were graded gets the full time for each of them (fair tie-break). */
export function latePenaltyMs(plan: PlanItem[], gradedThrough: number): number {
  let ms = 0;
  for (let i = 0; i <= gradedThrough && i < plan.length; i++) ms += plan[i].timeLimitSec * 1000;
  return ms;
}

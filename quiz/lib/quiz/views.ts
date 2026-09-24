import type { AnswerView, PublicQuestion, QuestionLite, SessionState } from "./types";

export function isRevealed(s: SessionState): boolean {
  return s.status === "ended" || s.phase === "reveal" || s.phase === "leaderboard";
}

export function publicQuestion(
  s: SessionState,
  q: QuestionLite | undefined,
  index: number,
  now: Date,
): PublicQuestion | null {
  if (!q || index < 0 || s.phase === "idle" || !s.questionOpenedAt || !s.questionClosesAt) return null;
  const openedAt = s.questionOpenedAt.getTime();
  const visible = now.getTime() >= openedAt || isRevealed(s);
  return {
    id: q.id,
    index,
    points: q.points,
    timeLimitSec: q.timeLimitSec,
    openedAt,
    closesAt: s.questionClosesAt.getTime(),
    text: visible ? q.text : null,
    options: visible ? q.options : null,
    correctIndex: isRevealed(s) ? q.correctIndex : null,
  };
}

export function distribution(optionCount: number, answers: { optionIndex: number }[]): number[] {
  const counts = new Array<number>(optionCount).fill(0);
  for (const a of answers) if (a.optionIndex >= 0 && a.optionIndex < optionCount) counts[a.optionIndex] += 1;
  return counts;
}

export function answerView(
  a: { optionIndex: number; isCorrect: boolean; pointsAwarded: number },
  revealed: boolean,
): AnswerView {
  return {
    optionIndex: a.optionIndex,
    isCorrect: revealed ? a.isCorrect : null,
    pointsAwarded: revealed ? a.pointsAwarded : null,
  };
}

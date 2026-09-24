import type { Standing } from "./types";

export interface ScoringAnswer {
  teamId: string;
  questionId: string;
  pointsAwarded: number;
  isCorrect: boolean;
  responseMs: number;
}

export function computeStandings(
  teams: { teamId: string; teamName: string }[],
  closedQuestions: { id: string; timeLimitSec: number }[],
  answers: ScoringAnswer[],
): Standing[] {
  const byKey = new Map<string, ScoringAnswer>();
  for (const a of answers) byKey.set(`${a.teamId}:${a.questionId}`, a);

  const rows = teams.map((t) => {
    let score = 0;
    let totalTimeMs = 0;
    let answeredCount = 0;
    let correctCount = 0;
    for (const q of closedQuestions) {
      const a = byKey.get(`${t.teamId}:${q.id}`);
      if (a) {
        score += a.pointsAwarded;
        totalTimeMs += a.responseMs;
        answeredCount += 1;
        if (a.isCorrect) correctCount += 1;
      } else {
        totalTimeMs += q.timeLimitSec * 1000;
      }
    }
    return { teamId: t.teamId, teamName: t.teamName, score, totalTimeMs, answeredCount, correctCount };
  });

  rows.sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs || a.teamName.localeCompare(b.teamName));

  const out: Standing[] = [];
  rows.forEach((r, i) => {
    const prev = out[i - 1];
    const tied = prev !== undefined && prev.score === r.score && prev.totalTimeMs === r.totalTimeMs;
    out.push({ ...r, rank: tied ? prev.rank : i + 1 });
  });
  return out;
}

import { formatMs, optionLetter } from "@/lib/format";
import type { Standing } from "./types";

export interface CsvInput {
  standings: Standing[];
  teams: { teamId: string; teamCode: string; takerEmail: string | null }[];
  questions: { id: string }[];
  answers: { teamId: string; questionId: string; optionIndex: number; isCorrect: boolean; responseMs: number }[];
}

function cell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Per-question cell: option letter, "+" when correct, then response time. "-" when unanswered. */
export function standingsCsv({ standings, teams, questions, answers }: CsvInput): string {
  const teamById = new Map(teams.map((t) => [t.teamId, t]));
  const answerByKey = new Map(answers.map((a) => [`${a.teamId}:${a.questionId}`, a]));
  const header = ["rank", "team", "code", "taker", "score", "total_time_s", "correct", "answered", ...questions.map((_, i) => `Q${i + 1}`)];
  const rows = standings.map((s) => {
    const t = teamById.get(s.teamId);
    const perQ = questions.map((q) => {
      const a = answerByKey.get(`${s.teamId}:${q.id}`);
      return a ? `${optionLetter(a.optionIndex)}${a.isCorrect ? "+" : ""} ${formatMs(a.responseMs)}` : "-";
    });
    return [s.rank, s.teamName, t?.teamCode ?? "", t?.takerEmail ?? "", s.score, (s.totalTimeMs / 1000).toFixed(1), s.correctCount, s.answeredCount, ...perQ];
  });
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";
}

import { describe, it, expect } from "vitest";
import { computeStandings, type ScoringAnswer } from "@/lib/quiz/scoring";

const teams = [
  { teamId: "t1", teamName: "Alpha" },
  { teamId: "t2", teamName: "Bravo" },
  { teamId: "t3", teamName: "Charlie" },
];
const closed = [
  { id: "q1", timeLimitSec: 20 },
  { id: "q2", timeLimitSec: 10 },
];
const ans = (teamId: string, questionId: string, pts: number, responseMs: number): ScoringAnswer => ({
  teamId, questionId, pointsAwarded: pts, isCorrect: pts > 0, responseMs,
});

describe("computeStandings", () => {
  it("ranks by score desc then total time asc", () => {
    const s = computeStandings(teams, closed, [
      ans("t1", "q1", 100, 5000), ans("t1", "q2", 0, 2000),
      ans("t2", "q1", 100, 3000), ans("t2", "q2", 100, 9000),
      ans("t3", "q1", 100, 1000), ans("t3", "q2", 0, 1000),
    ]);
    expect(s.map((r) => [r.teamName, r.rank, r.score, r.totalTimeMs])).toEqual([
      ["Bravo", 1, 200, 12000],
      ["Charlie", 2, 100, 2000],
      ["Alpha", 3, 100, 7000],
    ]);
  });

  it("charges the full time limit for unanswered closed questions", () => {
    const s = computeStandings([teams[0]], closed, [ans("t1", "q1", 100, 4000)]);
    expect(s[0]).toMatchObject({ score: 100, totalTimeMs: 4000 + 10_000, answeredCount: 1, correctCount: 1 });
  });

  it("gives teams with no answers score 0 and full time", () => {
    const s = computeStandings([teams[0]], closed, []);
    expect(s[0]).toMatchObject({ rank: 1, score: 0, totalTimeMs: 30_000, answeredCount: 0 });
  });

  it("ignores answers to questions that are not closed yet", () => {
    const s = computeStandings([teams[0]], [closed[0]], [ans("t1", "q1", 100, 1000), ans("t1", "q2", 100, 1000)]);
    expect(s[0]).toMatchObject({ score: 100, totalTimeMs: 1000 });
  });

  it("shares rank on exact score and time ties (1,1,3)", () => {
    const s = computeStandings(teams, [closed[0]], [
      ans("t1", "q1", 100, 2000), ans("t2", "q1", 100, 2000), ans("t3", "q1", 100, 3000),
    ]);
    expect(s.map((r) => r.rank)).toEqual([1, 1, 3]);
  });
});

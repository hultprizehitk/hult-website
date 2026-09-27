import { describe, it, expect } from "vitest";
import { gradeQuestion, latePenaltyMs, type GradeTeam } from "@/lib/quiz/grading";
import { rankStandings } from "@/lib/quiz/scoring";

const team = (id: string, over: Partial<GradeTeam> = {}): GradeTeam => ({
  teamId: id, teamName: `Team ${id}`, checkedIn: true, currentAnswer: null,
  score: 0, totalTimeMs: 0, answeredCount: 0, correctCount: 0, ...over,
});
const Q = { id: "q1", index: 0, correctIndex: 1, points: 100, timeLimitSec: 20, optionCount: 4 };

describe("rankStandings", () => {
  it("sorts by score desc then time asc with shared ranks", () => {
    const rows = [
      { teamId: "a", teamName: "A", score: 100, totalTimeMs: 5000, answeredCount: 1, correctCount: 1 },
      { teamId: "b", teamName: "B", score: 200, totalTimeMs: 9000, answeredCount: 2, correctCount: 2 },
      { teamId: "c", teamName: "C", score: 100, totalTimeMs: 5000, answeredCount: 1, correctCount: 1 },
      { teamId: "d", teamName: "D", score: 100, totalTimeMs: 6000, answeredCount: 1, correctCount: 1 },
    ];
    expect(rankStandings(rows).map((r) => [r.teamId, r.rank])).toEqual([["b", 1], ["a", 2], ["c", 2], ["d", 4]]);
  });
});

describe("gradeQuestion", () => {
  it("awards points to correct answers, clamps nothing extra, and charges full time to non-answerers", () => {
    const out = gradeQuestion(Q, [
      team("t1", { currentAnswer: { qid: "q1", optionIndex: 1, responseMs: 4000 } }),
      team("t2", { currentAnswer: { qid: "q1", optionIndex: 0, responseMs: 2000 } }),
      team("t3"),
    ]);
    expect(out.updates.get("t1")).toMatchObject({ score: 100, totalTimeMs: 4000, answeredCount: 1, correctCount: 1, result: { optionIndex: 1, correct: true, points: 100, ms: 4000 } });
    expect(out.updates.get("t2")).toMatchObject({ score: 0, totalTimeMs: 2000, answeredCount: 1, correctCount: 0, result: { correct: false, points: 0 } });
    expect(out.updates.get("t3")).toMatchObject({ score: 0, totalTimeMs: 20000, answeredCount: 0, result: { optionIndex: null, correct: false, ms: 20000 } });
    expect(out.distribution).toEqual([1, 1, 0, 0]);
    expect(out.standings.map((s) => [s.teamId, s.rank])).toEqual([["t1", 1], ["t2", 2], ["t3", 3]]);
  });

  it("ignores answers that belong to another question (stale currentAnswer)", () => {
    const out = gradeQuestion(Q, [team("t1", { currentAnswer: { qid: "q0", optionIndex: 1, responseMs: 1000 } })]);
    expect(out.updates.get("t1")).toMatchObject({ answeredCount: 0, totalTimeMs: 20000 });
    expect(out.distribution).toEqual([0, 0, 0, 0]);
  });

  it("accumulates onto existing totals and skips teams that never checked in", () => {
    const out = gradeQuestion(Q, [
      team("t1", { score: 300, totalTimeMs: 10000, answeredCount: 3, correctCount: 3, currentAnswer: { qid: "q1", optionIndex: 1, responseMs: 1000 } }),
      team("t9", { checkedIn: false, currentAnswer: { qid: "q1", optionIndex: 1, responseMs: 1 } }),
    ]);
    expect(out.updates.get("t1")).toMatchObject({ score: 400, totalTimeMs: 11000, answeredCount: 4, correctCount: 4 });
    expect(out.updates.has("t9")).toBe(false);
    expect(out.standings).toHaveLength(1);
  });

  it("clamps response time to the time limit", () => {
    const out = gradeQuestion(Q, [team("t1", { currentAnswer: { qid: "q1", optionIndex: 1, responseMs: 99_999 } })]);
    expect(out.updates.get("t1")!.totalTimeMs).toBe(20000);
  });
});

describe("latePenaltyMs", () => {
  it("charges full time for every question graded before the team checked in", () => {
    const plan = [{ id: "a", timeLimitSec: 20 }, { id: "b", timeLimitSec: 10 }, { id: "c", timeLimitSec: 30 }];
    expect(latePenaltyMs(plan, -1)).toBe(0);
    expect(latePenaltyMs(plan, 1)).toBe(30_000);
    expect(latePenaltyMs(plan, 2)).toBe(60_000);
  });
});

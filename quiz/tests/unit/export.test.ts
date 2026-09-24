import { describe, it, expect } from "vitest";
import { standingsCsv } from "@/lib/quiz/export";

describe("standingsCsv", () => {
  it("writes one row per team with per-question cells and escapes commas/quotes", () => {
    const csv = standingsCsv({
      standings: [{ rank: 1, teamId: "t1", teamName: 'Team "A", Inc', score: 100, totalTimeMs: 4500, answeredCount: 1, correctCount: 1 }],
      teams: [{ teamId: "t1", teamCode: "ABC123", takerEmail: "x@heritageit.edu.in" }],
      questions: [{ id: "q1" }, { id: "q2" }],
      answers: [{ teamId: "t1", questionId: "q1", optionIndex: 2, isCorrect: true, responseMs: 4500 }],
    });
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("rank,team,code,taker,score,total_time_s,correct,answered,Q1,Q2");
    expect(lines[1]).toBe('1,"Team ""A"", Inc",ABC123,x@heritageit.edu.in,100,4.5,1,1,C+ 4.5s,-');
  });
});

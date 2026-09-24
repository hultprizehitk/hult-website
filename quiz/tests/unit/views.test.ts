import { describe, it, expect } from "vitest";
import { publicQuestion, distribution, answerView, isRevealed } from "@/lib/quiz/views";
import type { QuestionLite, SessionState } from "@/lib/quiz/types";

const T0 = new Date("2026-10-01T10:00:00.000Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const q: QuestionLite = { id: "q1", order: 0, text: "Capital?", options: ["A", "B", "C"], correctIndex: 2, points: 100, timeLimitSec: 20 };
const live: SessionState = {
  status: "live", phase: "question", currentIndex: 0, checkinOpen: false,
  questionOpenedAt: at(3000), questionClosesAt: at(23000), startedAt: T0, endedAt: null,
};

describe("views", () => {
  it("hides text and options during the lead-in", () => {
    const v = publicQuestion(live, q, 0, at(1000))!;
    expect(v.text).toBeNull();
    expect(v.options).toBeNull();
    expect(v.correctIndex).toBeNull();
    expect(v.openedAt).toBe(at(3000).getTime());
  });

  it("shows text but never correctIndex while the question is running", () => {
    const v = publicQuestion(live, q, 0, at(5000))!;
    expect(v.text).toBe("Capital?");
    expect(v.options).toEqual(["A", "B", "C"]);
    expect(v.correctIndex).toBeNull();
  });

  it("shows correctIndex on reveal and after the quiz ends", () => {
    expect(publicQuestion({ ...live, phase: "reveal" }, q, 0, at(30000))!.correctIndex).toBe(2);
    expect(publicQuestion({ ...live, status: "ended", phase: "leaderboard" }, q, 0, at(30000))!.correctIndex).toBe(2);
  });

  it("returns null before the first question", () => {
    expect(publicQuestion({ ...live, phase: "idle", currentIndex: -1 }, undefined, -1, T0)).toBeNull();
  });

  it("counts answers per option", () => {
    expect(distribution(3, [{ optionIndex: 0 }, { optionIndex: 2 }, { optionIndex: 2 }])).toEqual([1, 0, 2]);
  });

  it("hides correctness until revealed", () => {
    const a = { optionIndex: 1, isCorrect: true, pointsAwarded: 100 };
    expect(answerView(a, false)).toEqual({ optionIndex: 1, isCorrect: null, pointsAwarded: null });
    expect(answerView(a, true)).toEqual({ optionIndex: 1, isCorrect: true, pointsAwarded: 100 });
  });

  it("isRevealed covers reveal, leaderboard and ended", () => {
    expect(isRevealed(live)).toBe(false);
    expect(isRevealed({ ...live, phase: "leaderboard" })).toBe(true);
    expect(isRevealed({ ...live, status: "ended" })).toBe(true);
  });
});

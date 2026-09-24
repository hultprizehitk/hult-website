import { describe, it, expect } from "vitest";
import { applyAction, closedQuestionCount, isQuestionOpen } from "@/lib/quiz/engine";
import { LEAD_IN_MS, type QuestionLite, type SessionState } from "@/lib/quiz/types";

const T0 = new Date("2026-10-01T10:00:00.000Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const questions: QuestionLite[] = [0, 1, 2].map((i) => ({
  id: `q${i}`, order: i, text: `Q${i}`, options: ["a", "b"], correctIndex: 0, points: 100, timeLimitSec: 20,
}));
const base: SessionState = {
  status: "draft", phase: "idle", currentIndex: -1, checkinOpen: false,
  questionOpenedAt: null, questionClosesAt: null, startedAt: null, endedAt: null,
};
const merge = (s: SessionState, patch: Partial<SessionState>): SessionState => ({ ...s, ...patch });

function liveAtQuestion(index: number): SessionState {
  return merge(base, {
    status: "live", phase: "question", currentIndex: index,
    questionOpenedAt: at(LEAD_IN_MS), questionClosesAt: at(LEAD_IN_MS + 20_000), startedAt: T0,
  });
}

describe("engine.applyAction", () => {
  it("opens the lobby from draft with check-in open", () => {
    expect(applyAction(base, { type: "open_lobby" }, questions, T0).patch).toEqual({ status: "lobby", checkinOpen: true });
  });

  it("refuses open_lobby outside draft", () => {
    expect(() => applyAction(merge(base, { status: "live" }), { type: "open_lobby" }, questions, T0)).toThrow("invalid_state");
  });

  it("toggles check-in only in lobby", () => {
    const lobby = merge(base, { status: "lobby", checkinOpen: true });
    expect(applyAction(lobby, { type: "toggle_checkin" }, questions, T0).patch).toEqual({ checkinOpen: false });
    expect(() => applyAction(base, { type: "toggle_checkin" }, questions, T0)).toThrow("invalid_state");
  });

  it("starts: closes check-in and opens question 0 after the lead-in", () => {
    const lobby = merge(base, { status: "lobby", checkinOpen: true });
    const { patch } = applyAction(lobby, { type: "start" }, questions, T0);
    expect(patch).toEqual({
      status: "live", checkinOpen: false, startedAt: T0, currentIndex: 0, phase: "question",
      questionOpenedAt: at(LEAD_IN_MS), questionClosesAt: at(LEAD_IN_MS + 20_000),
    });
  });

  it("refuses start with no questions", () => {
    const lobby = merge(base, { status: "lobby" });
    expect(() => applyAction(lobby, { type: "start" }, [], T0)).toThrow("no_questions");
  });

  it("extends an open question", () => {
    const s = liveAtQuestion(0);
    const { patch } = applyAction(s, { type: "extend", seconds: 15 }, questions, at(10_000));
    expect(patch.questionClosesAt).toEqual(at(LEAD_IN_MS + 35_000));
  });

  it("refuses extend after the question closed", () => {
    const s = liveAtQuestion(0);
    expect(() => applyAction(s, { type: "extend", seconds: 15 }, questions, at(LEAD_IN_MS + 20_000))).toThrow("invalid_state");
  });

  it("close_now sets closesAt to now (never before openedAt)", () => {
    const s = liveAtQuestion(0);
    expect(applyAction(s, { type: "close_now" }, questions, at(10_000)).patch).toEqual({ questionClosesAt: at(10_000) });
    expect(applyAction(s, { type: "close_now" }, questions, at(1_000)).patch).toEqual({ questionClosesAt: at(LEAD_IN_MS) });
  });

  it("close_now after the question already closed is a no-op, not an error", () => {
    const s = liveAtQuestion(0);
    expect(applyAction(s, { type: "close_now" }, questions, at(LEAD_IN_MS + 20_500)).patch).toEqual({});
    const revealed = merge(s, { phase: "reveal" });
    expect(() => applyAction(revealed, { type: "close_now" }, questions, T0)).toThrow("invalid_state");
  });

  it("reveal closes an open question and switches phase", () => {
    const s = liveAtQuestion(0);
    expect(applyAction(s, { type: "reveal" }, questions, at(10_000)).patch).toEqual({ phase: "reveal", questionClosesAt: at(10_000) });
  });

  it("reveal after natural close keeps closesAt", () => {
    const s = liveAtQuestion(0);
    expect(applyAction(s, { type: "reveal" }, questions, at(60_000)).patch).toEqual({ phase: "reveal" });
  });

  it("show_leaderboard only from reveal", () => {
    const s = merge(liveAtQuestion(0), { phase: "reveal" });
    expect(applyAction(s, { type: "show_leaderboard" }, questions, T0).patch).toEqual({ phase: "leaderboard" });
    expect(() => applyAction(liveAtQuestion(0), { type: "show_leaderboard" }, questions, T0)).toThrow("invalid_state");
  });

  it("next opens the following question from reveal or leaderboard", () => {
    const s = merge(liveAtQuestion(0), { phase: "leaderboard" });
    const { patch } = applyAction(s, { type: "next" }, questions, at(100_000));
    expect(patch).toEqual({
      currentIndex: 1, phase: "question",
      questionOpenedAt: at(100_000 + LEAD_IN_MS), questionClosesAt: at(100_000 + LEAD_IN_MS + 20_000),
    });
  });

  it("next refuses during an open question and after the last one", () => {
    expect(() => applyAction(liveAtQuestion(0), { type: "next" }, questions, T0)).toThrow("invalid_state");
    const last = merge(liveAtQuestion(2), { phase: "reveal" });
    expect(() => applyAction(last, { type: "next" }, questions, T0)).toThrow("last_question");
  });

  it("restart_question reopens the current question and clears its answers", () => {
    const s = liveAtQuestion(1);
    const r = applyAction(s, { type: "restart_question" }, questions, at(50_000));
    expect(r.clearAnswersForIndex).toBe(1);
    expect(r.patch.questionOpenedAt).toEqual(at(50_000 + LEAD_IN_MS));
  });

  it("end works from lobby and live, not from draft", () => {
    const { patch } = applyAction(liveAtQuestion(1), { type: "end" }, questions, at(5));
    expect(patch).toEqual({ status: "ended", phase: "leaderboard", endedAt: at(5), checkinOpen: false });
    expect(() => applyAction(base, { type: "end" }, questions, T0)).toThrow("invalid_state");
  });
});

describe("engine helpers", () => {
  it("isQuestionOpen respects lead-in and close", () => {
    const s = liveAtQuestion(0);
    expect(isQuestionOpen(s, at(LEAD_IN_MS - 1))).toBe(false);
    expect(isQuestionOpen(s, at(LEAD_IN_MS))).toBe(true);
    expect(isQuestionOpen(s, at(LEAD_IN_MS + 20_000))).toBe(false);
  });

  it("closedQuestionCount excludes an open current question", () => {
    expect(closedQuestionCount(base, T0)).toBe(0);
    expect(closedQuestionCount(liveAtQuestion(2), at(5_000))).toBe(2);
    expect(closedQuestionCount(liveAtQuestion(2), at(60_000))).toBe(3);
    expect(closedQuestionCount(merge(liveAtQuestion(2), { phase: "reveal" }), at(5_000))).toBe(3);
  });
});

import { describe, it, expect } from "vitest";
import { applyAction, closedQuestionCount, isQuestionOpen } from "@/lib/quiz/engine";
import { LEAD_IN_MS, type ControlAction, type QuestionLite, type SessionState } from "@/lib/quiz/types";

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
const lobby = merge(base, { status: "lobby", checkinOpen: true });
const starting = merge(base, { status: "live", phase: "idle", startedAt: T0 });

function atQuestion(index: number): SessionState {
  return merge(starting, { phase: "question", currentIndex: index, questionOpenedAt: at(LEAD_IN_MS), questionClosesAt: at(LEAD_IN_MS + 20_000) });
}
const results = (index: number) => merge(atQuestion(index), { phase: "results" });
const refuse = (s: SessionState, a: ControlAction, now = T0) => expect(() => applyAction(s, a, questions, now)).toThrow(expect.objectContaining({ code: "invalid_state" }));

describe("engine: setup and check-in", () => {
  it("opens check-in from setup only", () => {
    expect(applyAction(base, { type: "open_lobby" }, questions, T0).patch).toEqual({ status: "lobby", checkinOpen: true });
    refuse(lobby, { type: "open_lobby" });
    refuse(starting, { type: "open_lobby" });
  });

  it("pauses and resumes check-in only before start", () => {
    expect(applyAction(lobby, { type: "toggle_checkin" }, questions, T0).patch).toEqual({ checkinOpen: false });
    refuse(base, { type: "toggle_checkin" });
    refuse(starting, { type: "toggle_checkin" });
  });

  it("start closes check-in and shows 'quiz is starting' (idle) without opening a question", () => {
    expect(applyAction(lobby, { type: "start" }, questions, T0).patch).toEqual({ status: "live", phase: "idle", currentIndex: -1, checkinOpen: false, startedAt: T0 });
    expect(() => applyAction(lobby, { type: "start" }, [], T0)).toThrow(expect.objectContaining({ code: "no_questions" }));
    refuse(base, { type: "start" });
    refuse(starting, { type: "start" });
  });
});

describe("engine: strictly ordered questions", () => {
  it("next from 'starting' opens question 1 after the lead-in", () => {
    expect(applyAction(starting, { type: "next" }, questions, T0).patch).toEqual({
      currentIndex: 0, phase: "question", questionOpenedAt: at(LEAD_IN_MS), questionClosesAt: at(LEAD_IN_MS + 20_000),
    });
  });

  it("next from results opens exactly the following question", () => {
    expect(applyAction(results(0), { type: "next" }, questions, at(30_000)).patch).toMatchObject({ currentIndex: 1, phase: "question" });
    expect(applyAction(results(1), { type: "next" }, questions, at(30_000)).patch).toMatchObject({ currentIndex: 2 });
  });

  it("refuses next during a question, before start, and after the last question", () => {
    refuse(atQuestion(0), { type: "next" }, at(10_000));
    refuse(lobby, { type: "next" });
    expect(() => applyAction(results(2), { type: "next" }, questions, T0)).toThrow(expect.objectContaining({ code: "last_question" }));
  });
});

describe("engine: during a question", () => {
  it("extends and closes only while open; close is idempotent after time is up", () => {
    const q = atQuestion(0);
    expect(applyAction(q, { type: "extend", seconds: 15 }, questions, at(10_000)).patch).toEqual({ questionClosesAt: at(LEAD_IN_MS + 35_000) });
    refuse(q, { type: "extend", seconds: 15 }, at(LEAD_IN_MS + 20_000));
    expect(applyAction(q, { type: "close_now" }, questions, at(10_000)).patch).toEqual({ questionClosesAt: at(10_000) });
    expect(applyAction(q, { type: "close_now" }, questions, at(LEAD_IN_MS + 25_000)).patch).toEqual({});
    // Closing during the lead-in closes at open time (zero-length window), never before it.
    expect(applyAction(q, { type: "close_now" }, questions, at(1000)).patch).toEqual({ questionClosesAt: at(LEAD_IN_MS) });
  });

  it("restart reopens the same question with a new lead-in and clears its answers", () => {
    expect(applyAction(atQuestion(1), { type: "restart_question" }, questions, at(9000))).toEqual({
      patch: { currentIndex: 1, phase: "question", questionOpenedAt: at(9000 + LEAD_IN_MS), questionClosesAt: at(9000 + LEAD_IN_MS + 20_000) },
      clearAnswersForIndex: 1,
    });
    refuse(results(1), { type: "restart_question" });
  });

  it("show_results closes a running question, or just switches phase after time is up", () => {
    expect(applyAction(atQuestion(0), { type: "show_results" }, questions, at(10_000)).patch).toEqual({ phase: "results", questionClosesAt: at(10_000) });
    expect(applyAction(atQuestion(0), { type: "show_results" }, questions, at(40_000)).patch).toEqual({ phase: "results" });
    refuse(results(0), { type: "show_results" });
    refuse(starting, { type: "show_results" });
  });
});

describe("engine: end and reset", () => {
  it("ends from check-in or live; closes a running question", () => {
    expect(applyAction(results(2), { type: "end" }, questions, at(1000)).patch).toEqual({ status: "ended", phase: "results", endedAt: at(1000), checkinOpen: false });
    expect(applyAction(atQuestion(0), { type: "end" }, questions, at(10_000)).patch).toEqual({
      status: "ended", phase: "results", endedAt: at(10_000), checkinOpen: false, questionClosesAt: at(10_000),
    });
    expect(applyAction(lobby, { type: "end" }, questions, T0).patch).toMatchObject({ status: "ended", phase: "idle" });
    refuse(base, { type: "end" });
    refuse(merge(results(2), { status: "ended" }), { type: "end" });
  });

  it("reset_event returns to setup from any state and flags a full wipe", () => {
    for (const s of [base, lobby, atQuestion(1), merge(results(2), { status: "ended", endedAt: at(5000) })]) {
      expect(applyAction(s, { type: "reset_event" }, questions, T0)).toEqual({
        patch: { status: "draft", phase: "idle", currentIndex: -1, checkinOpen: false, questionOpenedAt: null, questionClosesAt: null, startedAt: null, endedAt: null },
        resetEvent: true,
      });
    }
  });
});

describe("engine helpers", () => {
  it("isQuestionOpen is true only inside the window", () => {
    const q = atQuestion(0);
    expect(isQuestionOpen(q, at(LEAD_IN_MS - 1))).toBe(false);
    expect(isQuestionOpen(q, at(LEAD_IN_MS))).toBe(true);
    expect(isQuestionOpen(q, at(LEAD_IN_MS + 20_000))).toBe(false);
    expect(isQuestionOpen(results(0), at(LEAD_IN_MS + 1))).toBe(false);
  });

  it("closedQuestionCount counts the current question once its window is over", () => {
    expect(closedQuestionCount(starting, T0)).toBe(0);
    expect(closedQuestionCount(atQuestion(1), at(10_000))).toBe(1);
    expect(closedQuestionCount(atQuestion(1), at(LEAD_IN_MS + 20_000))).toBe(2);
    expect(closedQuestionCount(results(1), T0)).toBe(2);
  });
});

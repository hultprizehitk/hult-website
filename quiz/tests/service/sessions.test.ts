import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { startDb, clearDb, stopDb } from "../helpers/db";
import { addQuestions, makeEvent, makeSession } from "../helpers/fixtures";
import { applyControl, createSession, deleteSession, getSessionByCode } from "@/lib/quiz/sessions";
import { addQuestion, deleteQuestion, listQuestions, reorderQuestions } from "@/lib/quiz/questions";
import { QuizAnswer } from "@/models/quiz";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const q = (text: string) => ({ text, options: ["x", "y"], correctIndex: 0, points: 100, timeLimitSec: 20 });

describe("sessions", () => {
  it("creates a draft session with a 6-digit code for an existing event", async () => {
    const ev = await makeEvent();
    const s = await createSession({ title: "Round 1", eventId: String(ev._id), requireSubmitted: true }, "a@heritageit.edu.in");
    expect(s.code).toMatch(/^\d{6}$/);
    expect(s.status).toBe("draft");
    expect(s.currentIndex).toBe(-1);
  });

  it("rejects an unknown event", async () => {
    await expect(
      createSession({ title: "X", eventId: String(new Types.ObjectId()), requireSubmitted: true }, "a"),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("runs lobby -> start -> reveal -> leaderboard -> next -> end", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id, { status: "draft", checkinOpen: false });
    await addQuestions(s._id, 2);
    await applyControl(s.code, { type: "open_lobby" });
    const live = await applyControl(s.code, { type: "start" });
    expect(live).toMatchObject({ status: "live", phase: "question", currentIndex: 0, checkinOpen: false });
    await applyControl(s.code, { type: "reveal" });
    await applyControl(s.code, { type: "show_leaderboard" });
    const q2 = await applyControl(s.code, { type: "next" });
    expect(q2.currentIndex).toBe(1);
    const ended = await applyControl(s.code, { type: "end" });
    expect(ended.status).toBe("ended");
    expect(ended.stateVersion).toBe(6);
  });

  it("lets exactly one of two concurrent identical actions win", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id, { status: "draft", checkinOpen: false });
    const results = await Promise.allSettled([
      applyControl(s.code, { type: "open_lobby" }),
      applyControl(s.code, { type: "open_lobby" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await getSessionByCode(s.code)).stateVersion).toBe(1);
  });

  it("restart_question deletes answers of the current question only", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id);
    await addQuestions(s._id, 2);
    await applyControl(s.code, { type: "start" });
    const [q0, q1] = await listQuestions(s._id);
    const base = { sessionId: s._id, teamId: new Types.ObjectId(), takerEmail: "t", optionIndex: 0, isCorrect: false, pointsAwarded: 0, responseMs: 1, answeredAt: new Date() };
    await QuizAnswer.create({ ...base, questionId: new Types.ObjectId(q0.id), questionIndex: 0 });
    await QuizAnswer.create({ ...base, questionId: new Types.ObjectId(q1.id), questionIndex: 1 });
    await applyControl(s.code, { type: "restart_question" });
    expect(await QuizAnswer.countDocuments({ questionIndex: 0 })).toBe(0);
    expect(await QuizAnswer.countDocuments({ questionIndex: 1 })).toBe(1);
  });

  it("refuses to delete a live session", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id, { status: "live" });
    await expect(deleteSession(s.code)).rejects.toMatchObject({ code: "invalid_state" });
  });
});

describe("questions", () => {
  it("appends, deletes with resequencing, and reorders", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id);
    const a = await addQuestion(s, q("A"));
    const b = await addQuestion(s, q("B"));
    const c = await addQuestion(s, q("C"));
    expect([a.order, b.order, c.order]).toEqual([0, 1, 2]);
    await deleteQuestion(s, b.id);
    expect((await listQuestions(s._id)).map((x) => [x.text, x.order])).toEqual([["A", 0], ["C", 1]]);
    const re = await reorderQuestions(s, [c.id, a.id]);
    expect(re.map((x) => x.text)).toEqual(["C", "A"]);
  });

  it("rejects a reorder that misses or repeats ids", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id);
    const a = await addQuestion(s, q("A"));
    await addQuestion(s, q("B"));
    await expect(reorderQuestions(s, [a.id, a.id])).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("locks questions once live", async () => {
    const ev = await makeEvent();
    const s = await makeSession(ev._id, { status: "live" });
    await expect(addQuestion(s, q("A"))).rejects.toMatchObject({ code: "invalid_state" });
  });
});

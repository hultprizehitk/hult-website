import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/quiz/fs-types";
import { applyControl, createSession, deleteSession, getSession, listSessions, updateSessionMeta } from "@/lib/quiz/sessions";
import { addQuestion, bulkUpdateQuestions, deleteQuestion, importQuestions, listQuestions, reorderQuestions, updateQuestion } from "@/lib/quiz/questions";
import { joinSession } from "@/lib/quiz/teams";
import { submitAnswer } from "@/lib/quiz/answers";
import { LEAD_IN_MS } from "@/lib/quiz/types";
import { at, clearFirestore, countAnswers, mail, qInput, readCounts, readSession, readTeam, setup, srcTeam, startAndOpenFirst, T0 } from "../helpers/firestore";

beforeEach(clearFirestore);

describe("sessions", () => {
  it("creates a draft session keyed by a 6-digit code", async () => {
    const s = await createSession({ title: "Round 1", eventId: "e1", eventTitle: "Event", requireSubmitted: true }, mail("a"));
    expect(s.code).toMatch(/^\d{6}$/);
    expect(await readSession(s.code)).toMatchObject({ status: "draft", phase: "idle", currentIndex: -1, stateVersion: 0, plan: [], gradedThrough: -1 });
    expect(await readCounts(s.code)).toEqual({ checkedIn: 0, eligible: 0, answeredCurrent: 0, answeredFor: null });
    expect((await listSessions()).map((x) => x.code)).toEqual([s.code]);
  });

  it("runs check-in -> start (starting) -> Q1 -> results -> Q2 -> results -> final, in order", async () => {
    const code = await setup({ status: "draft" });
    await applyControl(code, { type: "open_lobby" }, T0);
    expect(await applyControl(code, { type: "start" }, T0)).toMatchObject({ status: "live", phase: "idle", currentIndex: -1 });
    expect((await readSession(code)).current).toBeNull();

    await applyControl(code, { type: "next" }, T0);
    const q1 = await readSession(code);
    expect(q1.current).toMatchObject({ index: 0, text: "Question 1", options: ["A", "B", "C", "D"], correctIndex: null, distribution: null });
    expect(q1.questionOpenedAt!.toMillis()).toBe(T0.getTime() + LEAD_IN_MS);

    await applyControl(code, { type: "show_results" }, at(10_000));
    const r1 = await readSession(code);
    expect(r1).toMatchObject({ phase: "results", gradedThrough: 0 });
    expect(r1.current).toMatchObject({ correctIndex: 1, distribution: [0, 0, 0, 0] });
    await expect(applyControl(code, { type: "show_results" }, at(11_000))).rejects.toMatchObject({ code: "invalid_state" });

    await applyControl(code, { type: "next" }, at(12_000));
    expect((await readSession(code)).current).toMatchObject({ index: 1, text: "Question 2", correctIndex: null });
    await expect(applyControl(code, { type: "next" }, at(13_000))).rejects.toMatchObject({ code: "invalid_state" });
    await applyControl(code, { type: "show_results" }, at(40_000));
    await expect(applyControl(code, { type: "next" }, at(41_000))).rejects.toMatchObject({ code: "last_question" });
    const ended = await applyControl(code, { type: "end" }, at(42_000));
    expect(ended).toMatchObject({ status: "ended", stateVersion: 7 });
    expect((await readSession(code)).gradedThrough).toBe(1);
  });

  it("End on a running question grades it", async () => {
    const code = await setup();
    await startAndOpenFirst(code);
    await applyControl(code, { type: "end" }, at(5000));
    const s = await readSession(code);
    expect(s).toMatchObject({ status: "ended", phase: "results", gradedThrough: 0 });
    expect(s.current!.correctIndex).toBe(1);
  });

  it("rejects a stale expectedVersion and serialises concurrent identical actions", async () => {
    const code = await setup({ status: "draft" });
    await expect(applyControl(code, { type: "open_lobby" }, T0, 7)).rejects.toMatchObject({ code: "conflict" });
    const results = await Promise.allSettled([
      applyControl(code, { type: "open_lobby" }, T0, 0),
      applyControl(code, { type: "open_lobby" }, T0, 0),
    ]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect((await readSession(code)).stateVersion).toBe(1);
  });

  it("restart_question deletes that question's answers and clears team currentAnswer", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), "device-aaaaaaaa", T0);
    await startAndOpenFirst(code);
    const qid = (await readSession(code)).current!.id;
    await submitAnswer(code, mail("lead1"), { questionId: qid, optionIndex: 1, deviceId: "device-aaaaaaaa" }, at(LEAD_IN_MS + 500));
    expect(await countAnswers(code)).toBe(1);
    await applyControl(code, { type: "restart_question" }, at(9000));
    expect(await countAnswers(code)).toBe(0);
    expect((await readTeam(code, 1)).currentAnswer).toBeNull();
    expect((await readCounts(code)).answeredCurrent).toBe(0);
    // The same team can answer the restarted question.
    await submitAnswer(code, mail("lead1"), { questionId: qid, optionIndex: 2, deviceId: "device-aaaaaaaa" }, at(9000 + LEAD_IN_MS + 100));
    expect((await readTeam(code, 1)).currentAnswer).toMatchObject({ optionIndex: 2 });
  });

  it("reset_event wipes scores, answers, check-ins and seats, archives the run and returns to setup", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await joinSession(code, mail("lead1"), "device-aaaaaaaa", T0);
    await startAndOpenFirst(code);
    const qid = (await readSession(code)).current!.id;
    await submitAnswer(code, mail("lead1"), { questionId: qid, optionIndex: 1, deviceId: "device-aaaaaaaa" }, at(LEAD_IN_MS + 500));
    await applyControl(code, { type: "show_results" }, at(30_000));
    expect((await readTeam(code, 1)).score).toBe(100);

    await applyControl(code, { type: "reset_event" }, at(40_000));
    const s = await readSession(code);
    expect(s).toMatchObject({ status: "draft", phase: "idle", currentIndex: -1, checkinOpen: false, current: null, leaderboard: null, gradedThrough: -1 });
    expect(await readTeam(code, 1)).toMatchObject({ checkedInAt: null, takerEmail: null, deviceId: null, currentAnswer: null, score: 0, totalTimeMs: 0, rank: null, perQuestion: {} });
    expect(await countAnswers(code)).toBe(0);
    expect(await readCounts(code)).toMatchObject({ checkedIn: 0, eligible: 2, answeredCurrent: 0 });
    const runs = await adminDb().collection(`${paths.session(code)}/runs`).get();
    expect(runs.size).toBe(1);
    expect(runs.docs[0].data().teams).toEqual([expect.objectContaining({ teamName: "Team 1", score: 100, rank: 1 })]);
    // Questions survive the reset.
    expect(s.plan).toHaveLength(2);
  });

  it("updates meta only before live and refuses to delete a live session", async () => {
    const code = await setup();
    expect((await updateSessionMeta(code, { title: "Renamed" })).title).toBe("Renamed");
    await applyControl(code, { type: "start" }, T0);
    await expect(updateSessionMeta(code, { title: "X" })).rejects.toMatchObject({ code: "invalid_state" });
    await expect(deleteSession(code)).rejects.toMatchObject({ code: "invalid_state" });
    await applyControl(code, { type: "end" }, at(1000));
    await deleteSession(code);
    await expect(getSession(code)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("questions", () => {
  it("keeps the session plan in sync on add, update, delete and reorder", async () => {
    const code = await setup({ questions: 0 });
    const a = await addQuestion(code, qInput("A"));
    const b = await addQuestion(code, qInput("B", { timeLimitSec: 30 }));
    const c = await addQuestion(code, qInput("C"));
    expect((await readSession(code)).plan).toEqual([{ id: a.id, timeLimitSec: 20 }, { id: b.id, timeLimitSec: 30 }, { id: c.id, timeLimitSec: 20 }]);
    await updateQuestion(code, a.id, qInput("A2", { timeLimitSec: 45 }));
    await deleteQuestion(code, b.id);
    expect((await listQuestions(code)).map((q) => [q.text, q.order])).toEqual([["A2", 0], ["C", 1]]);
    const re = await reorderQuestions(code, [c.id, a.id]);
    expect(re.map((q) => q.text)).toEqual(["C", "A2"]);
    expect((await readSession(code)).plan).toEqual([{ id: c.id, timeLimitSec: 20 }, { id: a.id, timeLimitSec: 45 }]);
  });

  it("bulk-sets points and time for every question and the plan", async () => {
    const code = await setup({ questions: 3 });
    const out = await bulkUpdateQuestions(code, { timeLimitSec: 30, points: 50 });
    expect(out.map((q) => [q.points, q.timeLimitSec])).toEqual([[50, 30], [50, 30], [50, 30]]);
    expect((await readSession(code)).plan.map((p) => p.timeLimitSec)).toEqual([30, 30, 30]);
    await bulkUpdateQuestions(code, { points: 10 });
    expect((await listQuestions(code)).map((q) => [q.points, q.timeLimitSec])).toEqual([[10, 30], [10, 30], [10, 30]]);
  });

  it("rejects a reorder that misses or repeats ids", async () => {
    const code = await setup({ questions: 2 });
    const [a] = await listQuestions(code);
    await expect(reorderQuestions(code, [a.id, a.id])).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("imports by appending or replacing", async () => {
    const code = await setup({ questions: 1 });
    expect((await importQuestions(code, [qInput("I1"), qInput("I2")], "append")).map((q) => [q.text, q.order])).toEqual([["Question 1", 0], ["I1", 1], ["I2", 2]]);
    expect((await importQuestions(code, [qInput("R1")], "replace")).map((q) => q.text)).toEqual(["R1"]);
    expect((await readSession(code)).plan).toHaveLength(1);
  });

  it("locks questions once live", async () => {
    const code = await setup();
    await applyControl(code, { type: "start" }, T0);
    await expect(addQuestion(code, qInput("X"))).rejects.toMatchObject({ code: "invalid_state" });
    await expect(importQuestions(code, [qInput("X")], "append")).rejects.toMatchObject({ code: "invalid_state" });
    await expect(bulkUpdateQuestions(code, { points: 5 })).rejects.toMatchObject({ code: "invalid_state" });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { startDb, clearDb, stopDb } from "../helpers/db";
import { addQuestions, mail, makeEvent, makeSession, makeTeam } from "../helpers/fixtures";
import { joinSession } from "@/lib/quiz/teams";
import { submitAnswer } from "@/lib/quiz/answers";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { listQuestions } from "@/lib/quiz/questions";
import { QuizAnswer, QuizSession } from "@/models/quiz";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const DEV = "device-aaaaaaaa";
const OPENED = new Date("2026-10-01T10:00:00.000Z");
const at = (ms: number) => new Date(OPENED.getTime() + ms);

async function liveSetup() {
  const ev = await makeEvent();
  await makeTeam(ev._id, 1);
  const s = await makeSession(ev._id);
  await addQuestions(s._id, 2);
  await joinSession(s, mail("lead1"), DEV);
  await joinSession(s, mail("m1a"), "device-teammate1");
  await QuizSession.updateOne(
    { _id: s._id },
    { $set: { status: "live", phase: "question", currentIndex: 0, checkinOpen: false, questionOpenedAt: OPENED, questionClosesAt: at(20_000) } },
  );
  const session = await getSessionByCode(s.code);
  const questions = await listQuestions(s._id);
  return { session, questions, qid: questions[0].id };
}

describe("submitAnswer", () => {
  it("scores a correct answer with clamped response time", async () => {
    const { session, questions, qid } = await liveSetup();
    const r = await submitAnswer(session, questions, mail("lead1"), { questionId: qid, optionIndex: 1, deviceId: DEV }, at(4200));
    expect(r.duplicate).toBe(false);
    expect(r.answer).toMatchObject({ isCorrect: true, pointsAwarded: 100, responseMs: 4200, questionIndex: 0 });
  });

  it("scores a wrong answer as zero", async () => {
    const { session, questions, qid } = await liveSetup();
    const r = await submitAnswer(session, questions, mail("lead1"), { questionId: qid, optionIndex: 0, deviceId: DEV }, at(1000));
    expect(r.answer).toMatchObject({ isCorrect: false, pointsAwarded: 0 });
  });

  it("enforces the time window with network grace", async () => {
    const { session, questions, qid } = await liveSetup();
    const input = { questionId: qid, optionIndex: 1, deviceId: DEV };
    await expect(submitAnswer(session, questions, mail("lead1"), input, at(-1))).rejects.toMatchObject({ code: "too_early" });
    await expect(submitAnswer(session, questions, mail("lead1"), input, at(20_751))).rejects.toMatchObject({ code: "too_late" });
    const late = await submitAnswer(session, questions, mail("lead1"), input, at(20_700));
    expect(late.answer.responseMs).toBe(20_000);
  });

  it("only accepts the taker on the bound device", async () => {
    const { session, questions, qid } = await liveSetup();
    await expect(
      submitAnswer(session, questions, mail("m1a"), { questionId: qid, optionIndex: 1, deviceId: "device-teammate1" }, at(1000)),
    ).rejects.toMatchObject({ code: "not_taker" });
    await expect(
      submitAnswer(session, questions, mail("lead1"), { questionId: qid, optionIndex: 1, deviceId: "device-other123" }, at(1000)),
    ).rejects.toMatchObject({ code: "wrong_device" });
  });

  it("keeps the first answer and reports duplicates", async () => {
    const { session, questions, qid } = await liveSetup();
    await submitAnswer(session, questions, mail("lead1"), { questionId: qid, optionIndex: 1, deviceId: DEV }, at(1000));
    const dup = await submitAnswer(session, questions, mail("lead1"), { questionId: qid, optionIndex: 2, deviceId: DEV }, at(2000));
    expect(dup.duplicate).toBe(true);
    expect(dup.answer.optionIndex).toBe(1);
  });

  it("stores exactly one answer under concurrent double-submit", async () => {
    const { session, questions, qid } = await liveSetup();
    const input = { questionId: qid, optionIndex: 1, deviceId: DEV };
    await Promise.all([
      submitAnswer(session, questions, mail("lead1"), input, at(1000)),
      submitAnswer(session, questions, mail("lead1"), input, at(1001)),
    ]);
    expect(await QuizAnswer.countDocuments()).toBe(1);
  });

  it("rejects a non-current question and an out-of-range option", async () => {
    const { session, questions } = await liveSetup();
    await expect(
      submitAnswer(session, questions, mail("lead1"), { questionId: questions[1].id, optionIndex: 1, deviceId: DEV }, at(1000)),
    ).rejects.toMatchObject({ code: "invalid_state" });
    await expect(
      submitAnswer(session, questions, mail("lead1"), { questionId: questions[0].id, optionIndex: 5, deviceId: DEV }, at(1000)),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });
});

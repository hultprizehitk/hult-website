import { beforeEach, describe, expect, it } from "vitest";
import { submitAnswer } from "@/lib/quiz/answers";
import { applyControl } from "@/lib/quiz/sessions";
import { joinSession } from "@/lib/quiz/teams";
import { LEAD_IN_MS } from "@/lib/quiz/types";
import { at, clearFirestore, countAnswers, mail, readCounts, readSession, readTeam, setup, srcTeam, startAndOpenFirst, T0 } from "../helpers/firestore";

beforeEach(clearFirestore);

const DEV = "device-aaaaaaaa";
const OPEN = LEAD_IN_MS; // ms after T0 when question 1 opens

/** Team 1: lead1 holds the seat on DEV; m1a opened the quiz on another phone (teammate). */
async function live(teams = [srcTeam(1)]) {
  const code = await setup({ teams });
  await joinSession(code, mail("lead1"), DEV, T0);
  await joinSession(code, mail("m1a"), "device-teammate1", T0);
  await startAndOpenFirst(code);
  const s = await readSession(code);
  return { code, qid: s.current!.id, plan: s.plan };
}
const input = (qid: string, optionIndex = 1, deviceId = DEV) => ({ questionId: qid, optionIndex, deviceId });

describe("submitAnswer", () => {
  it("stores the answer on the team (no correctness) and counts it", async () => {
    const { code, qid } = await live();
    const r = await submitAnswer(code, mail("lead1"), input(qid), at(OPEN + 4200));
    expect(r).toEqual({ questionId: qid, optionIndex: 1, duplicate: false });
    const t = await readTeam(code, 1);
    expect(t.currentAnswer).toEqual({ qid, optionIndex: 1, responseMs: 4200 });
    expect(t.lastResult).toBeNull();
    expect(t.score).toBe(0);
    expect((await readCounts(code)).answeredCurrent).toBe(1);
    expect(await countAnswers(code)).toBe(1);
  });

  it("enforces the time window with network grace and clamps response time", async () => {
    const { code, qid } = await live();
    await expect(submitAnswer(code, mail("lead1"), input(qid), at(OPEN - 1))).rejects.toMatchObject({ code: "too_early" });
    await expect(submitAnswer(code, mail("lead1"), input(qid), at(OPEN + 20_751))).rejects.toMatchObject({ code: "too_late" });
    await submitAnswer(code, mail("lead1"), input(qid), at(OPEN + 20_700));
    expect((await readTeam(code, 1)).currentAnswer!.responseMs).toBe(20_000);
  });

  it("only accepts the seat holder on the bound device", async () => {
    const { code, qid } = await live();
    await expect(submitAnswer(code, mail("m1a"), input(qid, 1, "device-teammate1"), at(OPEN + 1000))).rejects.toMatchObject({ code: "not_taker" });
    await expect(submitAnswer(code, mail("lead1"), input(qid, 1, "device-other123"), at(OPEN + 1000))).rejects.toMatchObject({ code: "wrong_device" });
    await expect(submitAnswer(code, mail("stranger"), input(qid), at(OPEN + 1000))).rejects.toMatchObject({ code: "not_registered" });
  });

  it("keeps the first answer and reports duplicates; concurrent double-submit stores one", async () => {
    const { code, qid } = await live();
    await Promise.all([
      submitAnswer(code, mail("lead1"), input(qid, 1), at(OPEN + 1000)),
      submitAnswer(code, mail("lead1"), input(qid, 1), at(OPEN + 1001)),
    ]);
    const dup = await submitAnswer(code, mail("lead1"), input(qid, 2), at(OPEN + 2000));
    expect(dup).toMatchObject({ duplicate: true, optionIndex: 1 });
    expect(await countAnswers(code)).toBe(1);
    expect((await readCounts(code)).answeredCurrent).toBe(1);
  });

  it("rejects a non-current question, a bad option, and answers after results", async () => {
    const { code, qid, plan } = await live();
    await expect(submitAnswer(code, mail("lead1"), input(plan[1].id), at(OPEN + 1000))).rejects.toMatchObject({ code: "invalid_state" });
    await expect(submitAnswer(code, mail("lead1"), input(qid, 5), at(OPEN + 1000))).rejects.toMatchObject({ code: "invalid_input" });
    await applyControl(code, { type: "show_results" }, at(OPEN + 2000));
    await expect(submitAnswer(code, mail("lead1"), input(qid), at(OPEN + 2100))).rejects.toMatchObject({ code: "invalid_state" });
  });
});

describe("grading at results", () => {
  it("scores, penalises non-answerers, ranks, and publishes the answer and top 10", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2), srcTeam(3), srcTeam(4)] });
    for (const n of [1, 2, 3]) await joinSession(code, mail(`lead${n}`), `device-team-${n}`, T0);
    await startAndOpenFirst(code);
    const qid = (await readSession(code)).current!.id;
    await submitAnswer(code, mail("lead1"), { questionId: qid, optionIndex: 1, deviceId: "device-team-1" }, at(OPEN + 3000));
    await submitAnswer(code, mail("lead2"), { questionId: qid, optionIndex: 0, deviceId: "device-team-2" }, at(OPEN + 1000));

    await applyControl(code, { type: "show_results" }, at(OPEN + 5000));
    const t1 = await readTeam(code, 1);
    const t2 = await readTeam(code, 2);
    const t3 = await readTeam(code, 3);
    expect(t1).toMatchObject({ score: 100, totalTimeMs: 3000, correctCount: 1, rank: 1, prevRank: null, lastResult: { qid, correct: true, points: 100, optionIndex: 1, ms: 3000 } });
    expect(t2).toMatchObject({ score: 0, totalTimeMs: 1000, correctCount: 0, rank: 2, lastResult: { correct: false } });
    expect(t3).toMatchObject({ score: 0, totalTimeMs: 0, answeredCount: 0, rank: 3, lastResult: { optionIndex: null } });
    expect((await readTeam(code, 4)).rank).toBeNull(); // never checked in
    expect(t1.perQuestion[qid]).toEqual({ optionIndex: 1, correct: true, points: 100, ms: 3000 });

    const s = await readSession(code);
    expect(s.current).toMatchObject({ correctIndex: 1, distribution: [1, 1, 0, 0] });
    expect(s.leaderboard!.map((r) => [r.teamName, r.rank, r.lastMs])).toEqual([["Team 1", 1, 3000], ["Team 2", 2, 1000], ["Team 3", 3, null]]);

    // Question 2: team 3 answers correctly and moves up; prevRank carries the old rank.
    await applyControl(code, { type: "next" }, at(OPEN + 6000));
    const q2 = (await readSession(code)).current!.id;
    const open2 = OPEN + 6000 + LEAD_IN_MS;
    await submitAnswer(code, mail("lead3"), { questionId: q2, optionIndex: 1, deviceId: "device-team-3" }, at(open2 + 500));
    await applyControl(code, { type: "show_results" }, at(open2 + 1000));
    // Both on 100; team 3's total time (0 s + 0.5 s = 0.5 s) beats team 1's (3 s + 0 s unanswered = 3 s).
    expect(await readTeam(code, 3)).toMatchObject({ score: 100, rank: 1, prevRank: 3 });
    expect(await readTeam(code, 1)).toMatchObject({ rank: 2, prevRank: 1 });
    await applyControl(code, { type: "end" }, at(open2 + 2000));
    expect((await readTeam(code, 1)).score).toBe(100);
  });

  it("shares rank on an exact tie", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    for (const n of [1, 2]) await joinSession(code, mail(`lead${n}`), `device-team-${n}`, T0);
    await startAndOpenFirst(code);
    const qid = (await readSession(code)).current!.id;
    for (const n of [1, 2]) await submitAnswer(code, mail(`lead${n}`), { questionId: qid, optionIndex: 1, deviceId: `device-team-${n}` }, at(OPEN + 2000));
    await applyControl(code, { type: "show_results" }, at(OPEN + 5000));
    expect([(await readTeam(code, 1)).rank, (await readTeam(code, 2)).rank]).toEqual([1, 1]);
  });
});

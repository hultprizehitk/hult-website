import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { startDb, clearDb, stopDb } from "../helpers/db";
import { addQuestions, mail, makeEvent, makeSession, makeTeam } from "../helpers/fixtures";
import { joinSession } from "@/lib/quiz/teams";
import { submitAnswer } from "@/lib/quiz/answers";
import { applyControl, getSessionByCode } from "@/lib/quiz/sessions";
import { listQuestions } from "@/lib/quiz/questions";
import { getAdminView, getState } from "@/lib/quiz/state";
import { invalidateSnapshot } from "@/lib/quiz/cache";
import { LEAD_IN_MS } from "@/lib/quiz/types";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const DEV = "device-aaaaaaaa";

async function eventually<T>(fn: () => Promise<T | null>, timeoutMs = 3000): Promise<T> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const v = await fn();
    if (v !== null) return v;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("condition not met in time");
}

async function lobby() {
  const ev = await makeEvent();
  await makeTeam(ev._id, 1);
  await makeTeam(ev._id, 2, { submissionStatus: "forming" });
  const s = await makeSession(ev._id);
  await addQuestions(s._id, 2);
  await joinSession(s, mail("lead1"), DEV);
  return s;
}

describe("getState", () => {
  it("returns null for unknown codes", async () => {
    expect(await getState("999999", null, null)).toBeNull();
  });

  it("reports lobby counts and viewer roles", async () => {
    const s = await lobby();
    const anon = (await getState(s.code, null, null))!;
    expect(anon).toMatchObject({ status: "lobby", question: null, me: null, counts: { checkedIn: 1, eligible: 1, answered: 0 } });
    expect((await getState(s.code, { email: mail("lead1") }, DEV))!.me).toMatchObject({ role: "taker", deviceOk: true, checkedIn: true });
    expect((await getState(s.code, { email: mail("m1a") }, null))!.me).toMatchObject({ role: "teammate", checkedIn: true });
    expect((await getState(s.code, { email: mail("lead2") }, null))!.me!.role).toBe("ineligible");
    expect((await getState(s.code, { email: mail("nobody") }, null))!.me!.role).toBe("unregistered");
  });

  it("hides the question during lead-in and correctness until reveal", async () => {
    const s = await lobby();
    const t0 = new Date();
    await applyControl(s.code, { type: "start" }, t0);
    const leadIn = (await getState(s.code, null, null, t0))!;
    expect(leadIn.question).toMatchObject({ index: 0, text: null, options: null, correctIndex: null });

    const open = new Date(t0.getTime() + LEAD_IN_MS + 1000);
    const session = await getSessionByCode(s.code);
    const qs = await listQuestions(session._id);
    await getState(s.code, null, null, open); // warm the cache so the answer's soft invalidation is exercised
    await submitAnswer(session, qs, mail("lead1"), { questionId: qs[0].id, optionIndex: 1, deviceId: DEV }, open);
    // Answers soft-invalidate: the first read may still be the old snapshot; the background refresh lands shortly.
    const stale = (await getState(s.code, null, null, open))!;
    expect(stale.counts.answered).toBe(0);
    const mid = await eventually(async () => {
      const v = (await getState(s.code, { email: mail("lead1") }, DEV, open))!;
      return v.counts.answered === 1 ? v : null;
    });
    expect(mid.question!.text).toBe("Question 1");
    expect(mid.question!.correctIndex).toBeNull();
    expect(mid.counts.answered).toBe(1);
    expect(mid.me!.answer).toEqual({ optionIndex: 1, isCorrect: null, pointsAwarded: null });
    expect(mid.me!.standing!.score).toBe(0);
    expect(mid.distribution).toBeNull();

    await applyControl(s.code, { type: "reveal" }, open);
    const rev = (await getState(s.code, { email: mail("lead1") }, DEV, open))!;
    expect(rev.question!.correctIndex).toBe(1);
    expect(rev.distribution).toEqual([0, 1, 0, 0]);
    expect(rev.me!.answer).toEqual({ optionIndex: 1, isCorrect: true, pointsAwarded: 100 });
    expect(rev.leaderboard).toBeNull();

    await applyControl(s.code, { type: "show_leaderboard" }, open);
    const lb = (await getState(s.code, null, null, open))!;
    expect(lb.leaderboard![0]).toMatchObject({ rank: 1, teamName: "Team 1", score: 100 });
  });

  it("serves cached snapshots but reflects writes made in the same process", async () => {
    const s = await lobby();
    await getState(s.code, null, null);
    await joinSession(s, mail("m1a"), "device-teammate1");
    expect((await getState(s.code, null, null))!.counts.checkedIn).toBe(1);
    invalidateSnapshot(s.code);
    expect((await getState(s.code, { email: mail("m1a") }, null))!.me!.checkedIn).toBe(true);
  });
});

describe("getAdminView", () => {
  it("includes correct answers and live distribution", async () => {
    const s = await lobby();
    await applyControl(s.code, { type: "start" });
    const v = await getAdminView(s.code);
    expect(v.questions[0].correctIndex).toBe(1);
    expect(v.distribution).toEqual([0, 0, 0, 0]);
    expect(v.session).toMatchObject({ status: "live", currentIndex: 0 });
    expect(v.standings).toHaveLength(1);
  });
});

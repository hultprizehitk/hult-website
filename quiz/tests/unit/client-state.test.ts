import { describe, it, expect } from "vitest";
import { emptyTeamState, type CountsDoc, type SessionDoc, type TeamDoc, type Ts } from "@/lib/quiz/fs-types";
import { liveDistribution, publicQuestionFromDoc, seatState, standingsFromTeams, teamBoardRows, toStateResponse } from "@/lib/quiz/client-state";

const ts = (ms: number): Ts => ({ toMillis: () => ms });
const T0 = 1_800_000_000_000;

function session(over: Partial<SessionDoc> = {}): SessionDoc {
  return {
    code: "123456", title: "Quiz", eventId: "e1", eventTitle: "Event", status: "live", phase: "question", currentIndex: 0,
    checkinOpen: false, requireSubmitted: true, questionOpenedAt: ts(T0 + 3000), questionClosesAt: ts(T0 + 23000),
    startedAt: ts(T0), endedAt: null, stateVersion: 3, plan: [{ id: "q1", timeLimitSec: 20 }, { id: "q2", timeLimitSec: 20 }],
    current: { id: "q1", index: 0, text: "Capital?", options: ["A", "B", "C"], points: 100, timeLimitSec: 20, correctIndex: null, distribution: null },
    leaderboard: null, gradedThrough: -1, createdBy: "a", createdAt: ts(T0), lastSyncAt: null, lastSync: null, ...over,
  };
}
function team(over: Partial<TeamDoc> = {}): TeamDoc {
  return {
    teamId: "t1", teamName: "Team 1", teamCode: "T1", leadEmail: "lead@x.in",
    members: [{ name: "Lead", email: "lead@x.in" }, { name: "Mem", email: "mem@x.in" }], memberEmails: ["lead@x.in", "mem@x.in"],
    eligible: true, syncedAt: ts(T0), ...emptyTeamState(), checkedInAt: ts(T0), takerEmail: "lead@x.in", deviceId: "dev-1", ...over,
  };
}
const counts: CountsDoc = { checkedIn: 5, eligible: 9, answeredCurrent: 2, answeredFor: "q1" };

describe("publicQuestionFromDoc", () => {
  it("hides text and options during the lead-in and correctIndex until reveal", () => {
    expect(publicQuestionFromDoc(session(), T0 + 1000)).toMatchObject({ text: null, options: null, correctIndex: null, openedAt: T0 + 3000 });
    expect(publicQuestionFromDoc(session(), T0 + 5000)).toMatchObject({ text: "Capital?", options: ["A", "B", "C"], correctIndex: null });
    const revealed = session({ phase: "results", current: { ...session().current!, correctIndex: 2, distribution: [0, 1, 3] } });
    expect(publicQuestionFromDoc(revealed, T0 + 5000)!.correctIndex).toBe(2);
  });
  it("is null before the first question", () => {
    expect(publicQuestionFromDoc(session({ status: "lobby", phase: "idle", currentIndex: -1, current: null }), T0)).toBeNull();
  });
});

describe("toStateResponse", () => {
  it("builds taker view with device check and answered count for the current question only", () => {
    const s = toStateResponse({ session: session(), counts, team: team(), email: "lead@x.in", deviceId: "dev-1", nowMs: T0 + 5000 });
    expect(s.me).toMatchObject({ role: "taker", deviceOk: true, deviceBound: true, checkedIn: true, answer: null });
    expect(s.counts).toEqual({ checkedIn: 5, eligible: 9, answered: 2 });
    const stale = toStateResponse({ session: session(), counts: { ...counts, answeredFor: "q0" }, team: team(), email: "lead@x.in", deviceId: "dev-1", nowMs: T0 });
    expect(stale.counts.answered).toBe(0);
  });

  it("shows the team's locked answer to teammates without correctness before reveal", () => {
    const t = team({ currentAnswer: { qid: "q1", optionIndex: 1, responseMs: 900 } });
    const s = toStateResponse({ session: session(), counts: null, team: t, email: "mem@x.in", deviceId: "other", nowMs: T0 + 5000 });
    expect(s.me).toMatchObject({ role: "teammate", deviceOk: false, answer: { optionIndex: 1, isCorrect: null, pointsAwarded: null } });
  });

  it("shows correctness, distribution, top 10 and standing in results", () => {
    const t = team({
      currentAnswer: { qid: "q1", optionIndex: 1, responseMs: 900 },
      lastResult: { qid: "q1", optionIndex: 1, correct: true, points: 100, ms: 900 },
      score: 100, totalTimeMs: 900, answeredCount: 1, correctCount: 1, rank: 1, prevRank: 3,
    });
    const s = toStateResponse({
      session: session({ phase: "results", gradedThrough: 0, leaderboard: [], current: { ...session().current!, correctIndex: 1, distribution: [0, 1, 0] } }),
      counts: null, team: t, email: "lead@x.in", deviceId: "dev-1", nowMs: T0 + 30000,
    });
    expect(s.me!.answer).toEqual({ optionIndex: 1, isCorrect: true, pointsAwarded: 100 });
    expect(s.distribution).toEqual([0, 1, 0]);
    expect(s.leaderboard).toEqual([]);
    expect(s.me!.standing).toMatchObject({ rank: 1, score: 100, prevRank: 3, lastMs: 900, lastCorrect: true });
    expect(s.me!.gradedQid).toBe("q1");
  });

  it("exposes the leaderboard only in results and after the end", () => {
    const board = [{ rank: 1, teamId: "t1", teamName: "Team 1", score: 100, totalTimeMs: 900, answeredCount: 1, correctCount: 1 }];
    const view = (over: Partial<SessionDoc>) => toStateResponse({ session: session({ leaderboard: board, ...over }), counts: null, team: null, email: null, deviceId: null, nowMs: T0 }).leaderboard;
    expect(view({ phase: "question" })).toBeNull();
    expect(view({ phase: "results" })).toEqual(board);
    expect(view({ status: "ended", phase: "idle" })).toEqual(board);
  });

  it("derives the seat state for this phone", () => {
    expect(seatState({ takerEmail: "a@x.in", deviceId: "d1" }, "a@x.in", "d1")).toBe("mine");
    expect(seatState({ takerEmail: "a@x.in", deviceId: "d1" }, "a@x.in", "d2")).toBe("other_device");
    expect(seatState({ takerEmail: "a@x.in", deviceId: null }, "a@x.in", "d2")).toBe("reserved_me");
    expect(seatState({ takerEmail: "a@x.in", deviceId: "d1" }, "b@x.in", "d2")).toBe("taken");
    expect(seatState({ takerEmail: "a@x.in", deviceId: null }, "b@x.in", "d2")).toBe("reserved_other");
    expect(seatState({ takerEmail: null, deviceId: null }, "b@x.in", "d2")).toBe("free");
    const me = toStateResponse({ session: session(), counts: null, team: team({ takerEmail: "mem@x.in", deviceId: "d9" }), email: "lead@x.in", deviceId: "d1", nowMs: T0 }).me!;
    expect(me).toMatchObject({ role: "teammate", seat: "taken", takerName: "Mem" });
  });

  it("reports unregistered / ineligible roles from the join result", () => {
    expect(toStateResponse({ session: session(), counts: null, team: null, email: "x@x.in", deviceId: null, nowMs: T0, role: "ineligible" }).me!.role).toBe("ineligible");
    expect(toStateResponse({ session: session(), counts: null, team: null, email: null, deviceId: null, nowMs: T0 }).me).toBeNull();
  });
});

describe("admin helpers", () => {
  const teams = [
    team({ teamId: "t1", teamName: "A", score: 100, totalTimeMs: 3000, currentAnswer: { qid: "q1", optionIndex: 2, responseMs: 1 } }),
    team({ teamId: "t2", teamName: "B", score: 200, totalTimeMs: 9000, currentAnswer: { qid: "q1", optionIndex: 2, responseMs: 1 } }),
    team({ teamId: "t3", teamName: "C", checkedInAt: null, eligible: false }),
  ];
  it("ranks only checked-in teams", () => {
    expect(standingsFromTeams(teams).map((s) => [s.teamName, s.rank])).toEqual([["B", 1], ["A", 2]]);
  });
  it("builds board rows and live distribution for the current question", () => {
    const rows = teamBoardRows(teams, "q1");
    expect(rows.map((r) => [r.teamName, r.checkedIn, r.eligible, r.answeredCurrent])).toEqual([
      ["A", true, true, true], ["B", true, true, true], ["C", false, false, false],
    ]);
    expect(liveDistribution(teams, "q1", 3)).toEqual([0, 0, 2]);
  });
});

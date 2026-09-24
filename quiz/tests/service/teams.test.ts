import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { startDb, clearDb, stopDb } from "../helpers/db";
import { mail, makeEvent, makeSession, makeTeam } from "../helpers/fixtures";
import {
  adminCheckin, adminReassignTaker, adminResetDevice, countEligibleTeams, joinSession, setTaker, teamBoard,
} from "@/lib/quiz/teams";
import { QuizTeam } from "@/models/quiz";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const DEV_A = "device-aaaaaaaa";
const DEV_B = "device-bbbbbbbb";

async function setup(sessionOverrides = {}) {
  const ev = await makeEvent();
  const team = await makeTeam(ev._id, 1);
  const session = await makeSession(ev._id, sessionOverrides);
  return { ev, team, session };
}

describe("joinSession", () => {
  it("rejects users with no team", async () => {
    const { session } = await setup();
    await expect(joinSession(session, mail("stranger"), DEV_A)).rejects.toMatchObject({ code: "not_registered" });
  });

  it("rejects unsubmitted or disqualified teams when required", async () => {
    const ev = await makeEvent();
    await makeTeam(ev._id, 2, { submissionStatus: "forming" });
    await makeTeam(ev._id, 3, { status: "disqualified" });
    const session = await makeSession(ev._id);
    await expect(joinSession(session, mail("lead2"), DEV_A)).rejects.toMatchObject({ code: "ineligible" });
    await expect(joinSession(session, mail("lead3"), DEV_A)).rejects.toMatchObject({ code: "ineligible" });
    const relaxed = { ...session, requireSubmitted: false };
    await expect(joinSession(relaxed, mail("lead2"), DEV_A)).resolves.toMatchObject({ role: "taker" });
  });

  it("checks the team in, makes the lead the taker, and binds the first device", async () => {
    const { session } = await setup();
    const r = await joinSession(session, mail("lead1"), DEV_A);
    expect(r.role).toBe("taker");
    expect(r.deviceOk).toBe(true);
    expect(r.quizTeam.memberEmails).toEqual([mail("lead1"), mail("m1a"), mail("m1b")]);
    const again = await joinSession(session, mail("lead1"), DEV_B);
    expect(again.deviceOk).toBe(false);
  });

  it("gives teammates the teammate role", async () => {
    const { session } = await setup();
    const r = await joinSession(session, mail("m1a"), DEV_A);
    expect(r.role).toBe("teammate");
    expect(r.quizTeam.takerEmail).toBe(mail("lead1"));
  });

  it("creates one quiz team when two members join at once", async () => {
    const { session } = await setup();
    await Promise.all([joinSession(session, mail("m1a"), DEV_A), joinSession(session, mail("m1b"), DEV_B)]);
    expect(await QuizTeam.countDocuments()).toBe(1);
  });

  it("blocks new check-ins when closed but lets checked-in members back", async () => {
    const { session } = await setup();
    await joinSession(session, mail("lead1"), DEV_A);
    const closed = { ...session, checkinOpen: false, status: "live" as const };
    await expect(joinSession(closed, mail("lead1"), DEV_A)).resolves.toMatchObject({ deviceOk: true });
    const ev2 = await makeEvent();
    await makeTeam(ev2._id, 9);
    const s2 = await makeSession(ev2._id, { code: "654321", checkinOpen: false });
    await expect(joinSession(s2, mail("lead9"), DEV_A)).rejects.toMatchObject({ code: "checkin_closed" });
  });
});

describe("setTaker", () => {
  it("lets the lead switch the taker in the lobby and clears the device", async () => {
    const { session } = await setup();
    await joinSession(session, mail("lead1"), DEV_A);
    const qt = await setTaker(session, mail("lead1"), mail("m1b"));
    expect(qt.takerEmail).toBe(mail("m1b"));
    expect(qt.deviceId).toBeNull();
    const r = await joinSession(session, mail("m1b"), DEV_B);
    expect(r).toMatchObject({ role: "taker", deviceOk: true });
  });

  it("rejects non-leads, non-members, and a started quiz", async () => {
    const { session } = await setup();
    await joinSession(session, mail("lead1"), DEV_A);
    await expect(setTaker(session, mail("m1a"), mail("m1a"))).rejects.toMatchObject({ code: "not_lead" });
    await expect(setTaker(session, mail("lead1"), mail("stranger"))).rejects.toMatchObject({ code: "invalid_input" });
    await expect(setTaker({ ...session, status: "live" }, mail("lead1"), mail("m1a"))).rejects.toMatchObject({ code: "invalid_state" });
  });
});

describe("admin team ops", () => {
  it("checks in despite closed check-in, reassigns taker, resets device", async () => {
    const { session, team } = await setup({ checkinOpen: false });
    const qt = await adminCheckin(session, String(team._id), mail("admin"));
    expect(qt.checkedInBy).toBe(mail("admin"));
    await joinSession({ ...session, checkinOpen: false }, mail("lead1"), DEV_A);
    const re = await adminReassignTaker(session, String(team._id), mail("m1a"));
    expect(re).toMatchObject({ takerEmail: mail("m1a"), deviceId: null });
    await joinSession(session, mail("m1a"), DEV_A);
    const reset = await adminResetDevice(session, String(team._id));
    expect(reset.deviceId).toBeNull();
  });

  it("lists every event team on the board with eligibility and check-in", async () => {
    const ev = await makeEvent();
    await makeTeam(ev._id, 1);
    await makeTeam(ev._id, 2, { submissionStatus: "ready" });
    const session = await makeSession(ev._id);
    await joinSession(session, mail("lead1"), DEV_A);
    const board = await teamBoard(session, null);
    expect(board.map((r) => [r.teamName, r.eligible, r.checkedIn])).toEqual([
      ["Team 1", true, true],
      ["Team 2", false, false],
    ]);
    expect(await countEligibleTeams(session)).toBe(1);
  });
});

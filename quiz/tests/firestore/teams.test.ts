import { beforeEach, describe, expect, it } from "vitest";
import { applyControl } from "@/lib/quiz/sessions";
import { adminFreeSeat, adminReassignTaker, joinSession, releaseTeamDevice, type VenueCheck } from "@/lib/quiz/teams";
import { clearFirestore, mail, readCounts, readTeam, setup, srcTeam, T0 } from "../helpers/firestore";

beforeEach(clearFirestore);

const DEV_A = "device-aaaaaaaa";
const DEV_B = "device-bbbbbbbb";
const DEV_C = "device-cccccccc";

describe("joinSession: check-in", () => {
  it("rejects users with no team, and unsubmitted or disqualified teams", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2, { submissionStatus: "forming" }), srcTeam(3, { status: "disqualified" })] });
    await expect(joinSession(code, mail("stranger"), DEV_A)).rejects.toMatchObject({ code: "not_registered" });
    await expect(joinSession(code, mail("lead2"), DEV_A)).rejects.toMatchObject({ code: "ineligible" });
    await expect(joinSession(code, mail("lead3"), DEV_A)).rejects.toMatchObject({ code: "ineligible" });
    expect((await readCounts(code)).eligible).toBe(1);
  });

  it("any team is eligible when submission is not required", async () => {
    const code = await setup({ teams: [srcTeam(2, { submissionStatus: "forming" })], requireSubmitted: false });
    await expect(joinSession(code, mail("lead2"), DEV_A)).resolves.toMatchObject({ role: "taker" });
  });

  it("the first member to open the quiz checks the team in and takes the seat, whoever it is", async () => {
    const code = await setup();
    const r = await joinSession(code, mail("m1b"), DEV_A, T0);
    expect(r).toMatchObject({ role: "taker", deviceOk: true });
    expect(await readTeam(code, 1)).toMatchObject({ checkedInBy: mail("m1b"), takerEmail: mail("m1b"), deviceId: DEV_A });
    expect((await readCounts(code)).checkedIn).toBe(1);
    // Page reloads are idempotent.
    expect(await joinSession(code, mail("m1b"), DEV_A)).toMatchObject({ role: "taker", deviceOk: true });
  });

  it("other members become teammates (no error) and a team is counted once under concurrent joins", async () => {
    const code = await setup();
    const results = await Promise.all([joinSession(code, mail("m1a"), DEV_A), joinSession(code, mail("m1b"), DEV_B), joinSession(code, mail("lead1"), DEV_C)]);
    expect(results.filter((r) => r.role === "taker")).toHaveLength(1);
    expect(results.filter((r) => r.role === "teammate")).toHaveLength(2);
    expect((await readCounts(code)).checkedIn).toBe(1);
  });

  it("refuses new check-ins while paused, in setup, and after Start (no late teams)", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2), srcTeam(3)] });
    await joinSession(code, mail("lead1"), DEV_A);
    await applyControl(code, { type: "toggle_checkin" }, T0);
    await expect(joinSession(code, mail("lead2"), DEV_B)).rejects.toMatchObject({ code: "checkin_closed" });
    await applyControl(code, { type: "toggle_checkin" }, T0);
    await joinSession(code, mail("lead2"), DEV_B);
    await applyControl(code, { type: "start" }, T0);
    await expect(joinSession(code, mail("lead3"), DEV_C)).rejects.toMatchObject({ code: "checkin_closed" });
    // Checked-in teams can come back after Start (refresh, new tab).
    await expect(joinSession(code, mail("lead1"), DEV_A)).resolves.toMatchObject({ deviceOk: true });
    const draft = await setup({ status: "draft" });
    await expect(joinSession(draft, mail("lead1"), DEV_A)).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("lets a desk-scanned member check in at any time, even after Start or while paused", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2), srcTeam(3, { checkedIn: true })] });
    const venue: VenueCheck = async (email) => (email === mail("lead2") ? "ok" : "not_checked_in");
    await applyControl(code, { type: "toggle_checkin" }, T0);
    await expect(joinSession(code, mail("lead2"), DEV_B, T0, { venueCheck: venue })).resolves.toMatchObject({ role: "taker" });
    await applyControl(code, { type: "toggle_checkin" }, T0);
    await joinSession(code, mail("lead1"), DEV_A);
    await applyControl(code, { type: "start" }, T0);
    // Scanned per the synced roster (no MongoDB lookup needed), and admins count as scanned.
    await expect(joinSession(code, mail("lead3"), DEV_C)).resolves.toMatchObject({ role: "taker", deviceOk: true });
    const other = await setup({ teams: [srcTeam(4)] });
    await applyControl(other, { type: "start" }, T0);
    await expect(joinSession(other, mail("lead4"), DEV_A)).rejects.toMatchObject({ code: "checkin_closed" });
    await expect(joinSession(other, mail("lead4"), DEV_A, T0, { trusted: true })).resolves.toMatchObject({ role: "taker" });
  });

  it("requires the desk scan before the team's first check-in only", async () => {
    const code = await setup();
    const scanned = new Set<string>();
    const venue: VenueCheck = async (email) => (scanned.has(email) ? "ok" : "not_checked_in");
    await expect(joinSession(code, mail("lead1"), DEV_A, T0, { venueCheck: venue })).rejects.toMatchObject({ code: "not_checked_in" });
    scanned.add(mail("lead1"));
    await joinSession(code, mail("lead1"), DEV_A, T0, { venueCheck: venue });
    // A lookup failure ("unknown") never blocks: sign-in already enforced the gate.
    const down: VenueCheck = async () => "unknown";
    const other = await setup({ teams: [srcTeam(2)] });
    await expect(joinSession(other, mail("lead2"), DEV_B, T0, { venueCheck: down })).resolves.toMatchObject({ role: "taker" });
  });
});

describe("joinSession: the one seat", () => {
  it("same account on a new device needs an explicit claim (Play here), then the old device loses the seat", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), DEV_A);
    expect(await joinSession(code, mail("lead1"), DEV_B)).toMatchObject({ role: "taker", deviceOk: false });
    expect((await readTeam(code, 1)).deviceId).toBe(DEV_A);
    expect(await joinSession(code, mail("lead1"), DEV_B, T0, { claim: true })).toMatchObject({ deviceOk: true });
    expect((await readTeam(code, 1)).deviceId).toBe(DEV_B);
  });

  it("a teammate cannot take a held seat, even with claim", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), DEV_A);
    expect(await joinSession(code, mail("m1a"), DEV_B, T0, { claim: true })).toMatchObject({ role: "teammate", deviceOk: false });
    expect((await readTeam(code, 1)).takerEmail).toBe(mail("lead1"));
  });

  it("a freed seat (sign-out or admin) is taken only by an explicit claim", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), DEV_A);
    await releaseTeamDevice(mail("lead1"), code);
    expect(await readTeam(code, 1)).toMatchObject({ takerEmail: null, deviceId: null });
    expect(await joinSession(code, mail("m1a"), DEV_B)).toMatchObject({ role: "teammate" });
    expect(await joinSession(code, mail("m1a"), DEV_B, T0, { claim: true })).toMatchObject({ role: "taker", deviceOk: true });

    await adminFreeSeat(code, srcTeam(1).id);
    expect(await joinSession(code, mail("lead1"), DEV_A, T0, { claim: true })).toMatchObject({ role: "taker", deviceOk: true });
  });

  it("admin Switch player reserves the seat: only that member binds, automatically", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), DEV_A);
    await adminReassignTaker(code, srcTeam(1).id, mail("m1b"));
    expect(await readTeam(code, 1)).toMatchObject({ takerEmail: mail("m1b"), deviceId: null });
    expect(await joinSession(code, mail("m1a"), DEV_C, T0, { claim: true })).toMatchObject({ role: "teammate" });
    expect(await joinSession(code, mail("m1b"), DEV_B)).toMatchObject({ role: "taker", deviceOk: true });
    await expect(adminReassignTaker(code, srcTeam(1).id, mail("stranger"))).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("admin seat actions need a checked-in team and work mid-quiz", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await expect(adminFreeSeat(code, srcTeam(2).id)).rejects.toMatchObject({ code: "invalid_state" });
    await joinSession(code, mail("lead1"), DEV_A);
    await applyControl(code, { type: "start" }, T0);
    await adminReassignTaker(code, srcTeam(1).id, mail("m1a"));
    expect(await joinSession(code, mail("m1a"), DEV_B)).toMatchObject({ role: "taker", deviceOk: true });
  });
});

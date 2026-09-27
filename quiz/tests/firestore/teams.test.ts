import { beforeEach, describe, expect, it } from "vitest";
import { applyControl } from "@/lib/quiz/sessions";
import { adminCheckin, adminReassignTaker, adminResetDevice, joinSession, setTaker } from "@/lib/quiz/teams";
import { at, clearFirestore, mail, readCounts, readTeam, setup, srcTeam, T0 } from "../helpers/firestore";

beforeEach(clearFirestore);

const DEV_A = "device-aaaaaaaa";
const DEV_B = "device-bbbbbbbb";

describe("joinSession", () => {
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

  it("checks the team in, makes the lead the taker and binds the first device", async () => {
    const code = await setup();
    const r = await joinSession(code, mail("lead1"), DEV_A, T0);
    expect(r).toMatchObject({ role: "taker", deviceOk: true });
    const t = await readTeam(code, 1);
    expect(t).toMatchObject({ checkedInBy: mail("lead1"), takerEmail: mail("lead1"), deviceId: DEV_A, totalTimeMs: 0 });
    expect((await readCounts(code)).checkedIn).toBe(1);
    expect(await joinSession(code, mail("lead1"), DEV_B)).toMatchObject({ deviceOk: false });
  });

  it("gives teammates the teammate role and never counts a team twice under concurrent joins", async () => {
    const code = await setup();
    const [a, b] = await Promise.all([joinSession(code, mail("m1a"), DEV_A), joinSession(code, mail("m1b"), DEV_B)]);
    expect([a.role, b.role]).toEqual(["teammate", "teammate"]);
    expect((await readCounts(code)).checkedIn).toBe(1);
    expect((await readTeam(code, 1)).deviceId).toBeNull();
  });

  it("blocks new check-ins when closed or not open, but lets checked-in members back", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await joinSession(code, mail("lead1"), DEV_A);
    await applyControl(code, { type: "toggle_checkin" }, T0);
    await expect(joinSession(code, mail("lead2"), DEV_A)).rejects.toMatchObject({ code: "checkin_closed" });
    await expect(joinSession(code, mail("lead1"), DEV_A)).resolves.toMatchObject({ deviceOk: true });
    const draft = await setup({ status: "draft" });
    await expect(joinSession(draft, mail("lead1"), DEV_A)).rejects.toMatchObject({ code: "invalid_state" });
  });
});

describe("setTaker", () => {
  it("lets the lead switch the taker in the lobby and clears the device", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), DEV_A);
    const t = await setTaker(code, mail("lead1"), mail("m1b"));
    expect(t).toMatchObject({ takerEmail: mail("m1b"), deviceId: null });
    expect(await joinSession(code, mail("m1b"), DEV_B)).toMatchObject({ role: "taker", deviceOk: true });
  });

  it("rejects non-leads, non-members, unchecked teams and a started quiz", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await expect(setTaker(code, mail("lead2"), mail("m2a"))).rejects.toMatchObject({ code: "not_registered" });
    await joinSession(code, mail("lead1"), DEV_A);
    await expect(setTaker(code, mail("m1a"), mail("m1a"))).rejects.toMatchObject({ code: "not_lead" });
    await expect(setTaker(code, mail("lead1"), mail("stranger"))).rejects.toMatchObject({ code: "invalid_input" });
    await applyControl(code, { type: "start" }, T0);
    await expect(setTaker(code, mail("lead1"), mail("m1a"))).rejects.toMatchObject({ code: "invalid_state" });
  });
});

describe("admin team ops", () => {
  it("checks in despite closed check-in, reassigns the taker and resets the device", async () => {
    const code = await setup();
    await applyControl(code, { type: "toggle_checkin" }, T0);
    const id = srcTeam(1).id;
    await adminCheckin(code, id, mail("admin"));
    await adminCheckin(code, id, mail("admin")); // idempotent
    expect((await readCounts(code)).checkedIn).toBe(1);
    expect((await readTeam(code, 1)).checkedInBy).toBe(mail("admin"));
    await joinSession(code, mail("lead1"), DEV_A);
    await adminReassignTaker(code, id, mail("m1a"));
    expect(await readTeam(code, 1)).toMatchObject({ takerEmail: mail("m1a"), deviceId: null });
    await expect(adminReassignTaker(code, id, mail("stranger"))).rejects.toMatchObject({ code: "invalid_input" });
    await joinSession(code, mail("m1a"), DEV_B);
    await adminResetDevice(code, id);
    expect((await readTeam(code, 1)).deviceId).toBeNull();
  });

  it("charges a late check-in the full time of already graded questions", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await joinSession(code, mail("lead1"), DEV_A);
    await applyControl(code, { type: "start" }, T0);
    await applyControl(code, { type: "reveal" }, at(5000));
    await adminCheckin(code, srcTeam(2).id, mail("admin"));
    expect((await readTeam(code, 2)).totalTimeMs).toBe(20_000);
  });
});

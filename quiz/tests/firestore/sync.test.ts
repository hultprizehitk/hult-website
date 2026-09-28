import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { mintFirebaseToken } from "@/lib/firebase/token";
import { clearAdminCache, isAdminEmail } from "@/lib/admin";
import { paths } from "@/lib/quiz/fs-types";
import { applyControl } from "@/lib/quiz/sessions";
import { joinSession } from "@/lib/quiz/teams";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";
import { clearFirestore, mail, readCounts, readSession, readTeam, setup, srcTeam, T0 } from "../helpers/firestore";

beforeEach(async () => {
  await clearFirestore();
  clearAdminCache();
});

describe("syncTeamsToFirestore", () => {
  it("creates teams with roster, eligibility, counters and a sync summary; nobody holds the seat yet", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2, { submissionStatus: "ready" })] });
    const t = await readTeam(code, 1);
    expect(t).toMatchObject({ teamName: "Team 1", eligible: true, takerEmail: null, deviceId: null, memberEmails: [mail("lead1"), mail("m1a"), mail("m1b")], checkedInAt: null, score: 0 });
    expect((await readTeam(code, 2)).eligible).toBe(false);
    expect((await readCounts(code)).eligible).toBe(1);
    expect((await readSession(code)).lastSync).toEqual({ total: 2, eligible: 1, added: 2, updated: 0, removed: 0 });
  });

  it("a desk scan is recorded but does not check the team into the quiz", async () => {
    const code = await setup({ teams: [srcTeam(1, { checkedIn: true })] });
    expect(await readTeam(code, 1)).toMatchObject({ deskScanned: true, checkedInAt: null });
    expect((await readCounts(code)).checkedIn).toBe(0);
  });

  it("writes only what changed and preserves check-in, seat, scores and live counters", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await joinSession(code, mail("m1a"), "device-aaaaaaaa");
    const before = await readTeam(code, 2);
    const unchanged = await syncTeamsToFirestore(code, [srcTeam(1), srcTeam(2)], []);
    expect(unchanged).toEqual({ total: 2, eligible: 2, added: 0, updated: 0, removed: 0 });
    expect((await readTeam(code, 2)).syncedAt!.toMillis()).toBe(before.syncedAt!.toMillis());

    const summary = await syncTeamsToFirestore(code, [srcTeam(1, { teamName: "Renamed" })], []);
    expect(summary).toEqual({ total: 1, eligible: 1, added: 0, updated: 1, removed: 1 });
    expect(await readTeam(code, 1)).toMatchObject({ teamName: "Renamed", takerEmail: mail("m1a"), deviceId: "device-aaaaaaaa" });
    expect((await readTeam(code, 1)).checkedInAt).not.toBeNull();
    expect((await readCounts(code)).checkedIn).toBe(1);
    expect((await readTeam(code, 2)).eligible).toBe(false); // removed on the site -> ineligible, not deleted
    expect((await readCounts(code)).eligible).toBe(1);
  });

  it("frees the seat if the player left the team on the site", async () => {
    const code = await setup();
    await joinSession(code, mail("m1b"), "device-aaaaaaaa");
    await syncTeamsToFirestore(code, [srcTeam(1, { members: [{ name: "A", email: mail("m1a") }] })], []);
    expect(await readTeam(code, 1)).toMatchObject({ takerEmail: null, deviceId: null });
  });

  it("is refused once the quiz has started", async () => {
    const code = await setup();
    await applyControl(code, { type: "start" }, T0);
    await expect(syncTeamsToFirestore(code, [srcTeam(1)], [])).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("mirrors site admins into quizAdmins and removes stale ones", async () => {
    const code = await setup({ admins: [mail("boss"), mail("old")] });
    await syncTeamsToFirestore(code, [srcTeam(1)], [mail("boss")]);
    const admins = await adminDb().collection("quizAdmins").get();
    expect(admins.docs.map((d) => d.id)).toEqual([mail("boss")]);
    expect(await isAdminEmail(mail("boss"))).toBe(true);
    expect(await isAdminEmail(mail("old"))).toBe(false);
  });

  it("preserves manually added quiz admins during team sync", async () => {
    const code = await setup({ admins: [mail("siteadmin")] });
    await adminDb().doc(paths.admin(mail("manualadmin"))).set({ email: mail("manualadmin"), source: "manual" });
    await syncTeamsToFirestore(code, [srcTeam(1)], [mail("siteadmin")]);
    expect((await adminDb().doc(paths.admin(mail("manualadmin"))).get()).exists).toBe(true);
    expect(await isAdminEmail(mail("manualadmin"))).toBe(true);
  });
});

describe("auth bridge (custom token)", () => {
  function claims(token: string) {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { uid: string; claims: { email: string; admin: boolean } };
  }

  it("mints a token whose claims carry the email and admin flag", async () => {
    process.env.ADMIN_EMAILS = mail("envboss");
    const user = await mintFirebaseToken("Lead1@heritageit.edu.in");
    expect(user).toMatchObject({ email: mail("lead1"), admin: false });
    expect(claims(user.token)).toMatchObject({ uid: mail("lead1"), claims: { email: mail("lead1"), admin: false } });
    expect((await mintFirebaseToken(mail("envboss"))).admin).toBe(true);
    await adminDb().doc(paths.admin(mail("dbboss"))).set({ email: mail("dbboss") });
    expect(claims((await mintFirebaseToken(mail("dbboss"))).token).claims.admin).toBe(true);
  });

  it("refuses non-college accounts", async () => {
    await expect(mintFirebaseToken("someone@gmail.com")).rejects.toMatchObject({ code: "forbidden" });
  });
});

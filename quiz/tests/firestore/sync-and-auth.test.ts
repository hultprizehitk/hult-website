import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { adminDb } from "@/lib/firebase/admin";
import { mintFirebaseToken } from "@/lib/firebase/token";
import { clearAdminCache, isAdminEmail } from "@/lib/admin";
import { paths } from "@/lib/quiz/fs-types";
import { applyControl } from "@/lib/quiz/sessions";
import { joinSession, setTaker } from "@/lib/quiz/teams";
import { readAdminEmails, readEventTeams } from "@/lib/sync/mongo-read";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";
import { Event, Team, User } from "@/models/mirror";
import { startMongo, stopMongo } from "../helpers/db";
import { clearFirestore, mail, readCounts, readSession, readTeam, setup, srcTeam, T0, teamId } from "../helpers/firestore";

beforeAll(startMongo);
afterAll(stopMongo);
beforeEach(async () => {
  await clearFirestore();
  clearAdminCache();
});

describe("syncTeamsToFirestore", () => {
  it("creates teams with roster, eligibility, counts and a sync summary", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2, { submissionStatus: "ready" })] });
    const t = await readTeam(code, 1);
    expect(t).toMatchObject({ teamName: "Team 1", eligible: true, takerEmail: mail("lead1"), memberEmails: [mail("lead1"), mail("m1a"), mail("m1b")], checkedInAt: null, score: 0 });
    expect((await readTeam(code, 2)).eligible).toBe(false);
    expect((await readCounts(code)).eligible).toBe(1);
    expect((await readSession(code)).lastSync).toEqual({ total: 2, eligible: 1, added: 2, updated: 0, removed: 0 });
  });

  it("re-sync updates roster fields but preserves check-in, taker, device and scores", async () => {
    const code = await setup({ teams: [srcTeam(1), srcTeam(2)] });
    await joinSession(code, mail("lead1"), "device-aaaaaaaa");
    await setTaker(code, mail("lead1"), mail("m1a"));
    await joinSession(code, mail("m1a"), "device-bbbbbbbb");
    const summary = await syncTeamsToFirestore(code, [srcTeam(1, { teamName: "Renamed" })], []);
    expect(summary).toEqual({ total: 1, eligible: 1, added: 0, updated: 1, removed: 1 });
    expect(await readTeam(code, 1)).toMatchObject({ teamName: "Renamed", takerEmail: mail("m1a"), deviceId: "device-bbbbbbbb" });
    expect((await readTeam(code, 1)).checkedInAt).not.toBeNull();
    expect((await readTeam(code, 2)).eligible).toBe(false); // removed on the site -> ineligible, not deleted
  });

  it("falls back to the lead if the chosen taker left the team", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), "device-aaaaaaaa");
    await setTaker(code, mail("lead1"), mail("m1b"));
    await syncTeamsToFirestore(code, [srcTeam(1, { members: [{ name: "A", email: mail("m1a") }] })], []);
    expect(await readTeam(code, 1)).toMatchObject({ takerEmail: mail("lead1"), deviceId: null });
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

describe("mongo-read (read-only source)", () => {
  it("maps an event's teams and the site's admin users", async () => {
    await connectDB();
    const eventId = new Types.ObjectId();
    await Event.create({ _id: eventId, title: "Quiz Night", date: "2026-10-01", venue: "Hall" });
    await Team.create({
      _id: new Types.ObjectId(teamId(7).slice(0, 24)),
      eventId, teamCode: "T7", teamName: "Team 7",
      lead: { name: "Lead 7", email: "LEAD7@heritageit.edu.in" }, leadEmail: "lead7@heritageit.edu.in",
      members: [{ name: "M", email: "m7@heritageit.edu.in" }], status: "confirmed", submissionStatus: "submitted",
    });
    await User.create({ name: "Admin", email: mail("siteadmin"), role: "lead_admin" });
    await User.create({ name: "User", email: mail("plain"), role: "user" });
    const teams = await readEventTeams(String(eventId));
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject({ teamName: "Team 7", leadEmail: "lead7@heritageit.edu.in", status: "confirmed", submissionStatus: "submitted" });
    expect(await readAdminEmails()).toEqual([mail("siteadmin")]);
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

describe("quiz flow smoke", () => {
  it("an ended quiz keeps checked-in counts", async () => {
    const code = await setup();
    await joinSession(code, mail("lead1"), "device-aaaaaaaa", T0);
    await applyControl(code, { type: "end" }, T0);
    expect((await readSession(code)).status).toBe("ended");
    expect((await readCounts(code)).checkedIn).toBe(1);
  });
});

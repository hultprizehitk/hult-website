import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { HULT_ASCEND_EVENT_ID, readAdminEmails, readEventTeams, venueCheckStatus } from "@/lib/sync/mongo-read";
import { Event, Team, User } from "@/models/mirror";
import { startMongo, stopMongo } from "../helpers/db";
import { mail, teamId } from "../helpers/firestore";

// Needs the mongodb-memory-server binary (downloaded on first run). Set SKIP_MONGO_TESTS=1 where it cannot download.
const skip = process.env.SKIP_MONGO_TESTS === "1";
beforeAll(async () => {
  if (!skip) await startMongo();
}, 120_000);
afterAll(async () => {
  if (!skip) await stopMongo();
});

describe.skipIf(skip)("mongo-read (read-only source)", () => {
  it("maps an event's teams, desk scans and the site's admin users", async () => {
    await connectDB();
    const eventId = new Types.ObjectId();
    await Event.create({ _id: eventId, title: "Quiz Night", date: "2026-10-01", venue: "Hall" });
    await Team.create({
      _id: new Types.ObjectId(teamId(7).slice(0, 24)),
      eventId, teamCode: "T7", teamName: "Team 7",
      lead: { name: "Lead 7", email: "LEAD7@heritageit.edu.in" }, leadEmail: "lead7@heritageit.edu.in",
      members: [{ name: "M", email: "m7@heritageit.edu.in", checkedIn: true }], status: "confirmed", submissionStatus: "submitted",
    });
    await User.create({ name: "Admin", email: mail("siteadmin"), role: "lead_admin" });
    await User.create({ name: "User", email: mail("plain"), role: "user" });
    const teams = await readEventTeams(String(eventId));
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject({ teamName: "Team 7", leadEmail: "lead7@heritageit.edu.in", status: "confirmed", submissionStatus: "submitted", checkedIn: true });
    expect(await readAdminEmails()).toEqual([mail("siteadmin")]);
  });

  it("venueCheckStatus: scanned members pass, unscanned are refused", async () => {
    await connectDB();
    await Team.create({
      eventId: HULT_ASCEND_EVENT_ID, teamCode: "HA1", teamName: "Ascend 1",
      lead: { name: "L", email: mail("halead") }, leadEmail: mail("halead"),
      members: [{ name: "M", email: mail("hamember"), checkedIn: true }], status: "confirmed", submissionStatus: "submitted",
    });
    expect(await venueCheckStatus(mail("hamember"))).toBe("ok");
    expect(await venueCheckStatus(mail("halead"))).toBe("not_checked_in");
  });
});

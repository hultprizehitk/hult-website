import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { questionInputSchema } from "@/lib/quiz/validation";
import { Event, Team, User } from "@/models/mirror";
import { QuizAnswer, QuizQuestion, QuizSession, QuizTeam } from "@/models/quiz";
import { DEV_QUESTIONS } from "./dev-questions";

const PROTECTED_DBS = new Set(["hult-website"]);
const EVENT_TITLE = "DEV Quiz Event";
const SESSION_CODE = "424242";
const mail = (local: string) => `${local}@heritageit.edu.in`;
const pad = (n: number) => String(n).padStart(2, "0");

async function main() {
  if (process.env.ALLOW_DEV_SEED !== "true") throw new Error("Refusing to seed: set ALLOW_DEV_SEED=true in quiz/.env.local");
  const conn = await connectDB();
  const dbName = conn.connection.db?.databaseName ?? "";
  if (!dbName || PROTECTED_DBS.has(dbName)) throw new Error(`Refusing to seed protected database "${dbName}"`);
  console.log(`Seeding database: ${dbName}`);

  const questions = DEV_QUESTIONS.map((q) => questionInputSchema.parse(q));

  const oldEvent = await Event.findOne({ title: EVENT_TITLE }).lean();
  if (oldEvent) {
    await Team.deleteMany({ eventId: oldEvent._id });
    await Event.deleteOne({ _id: oldEvent._id });
  }
  const oldSession = await QuizSession.findOne({ code: SESSION_CODE }).lean();
  if (oldSession) {
    await Promise.all([
      QuizQuestion.deleteMany({ sessionId: oldSession._id }),
      QuizTeam.deleteMany({ sessionId: oldSession._id }),
      QuizAnswer.deleteMany({ sessionId: oldSession._id }),
    ]);
    await QuizSession.deleteOne({ _id: oldSession._id });
  }

  const event = await Event.create({ title: EVENT_TITLE, date: "2026-10-01", venue: "Auditorium 1" });

  await User.updateOne(
    { email: mail("dev.admin") },
    { $set: { name: "Dev Admin", email: mail("dev.admin"), role: "master_admin", department: "CSE", year: "3rd Year" } },
    { upsert: true },
  );

  await Team.insertMany(
    Array.from({ length: 50 }, (_, i) => {
      const n = pad(i + 1);
      return {
        eventId: event._id,
        teamCode: `DEV${n}`,
        teamName: `Dev Team ${n}`,
        lead: { name: `Lead ${n}`, email: mail(`dev.t${n}.lead`) },
        leadEmail: mail(`dev.t${n}.lead`),
        members: [1, 2, 3].map((m) => ({ name: `Member ${n}-${m}`, email: mail(`dev.t${n}.m${m}`) })),
        membersCount: 4,
        department: "CSE",
        status: i === 49 ? "disqualified" : "confirmed",
        submissionStatus: i === 47 || i === 48 ? "forming" : "submitted",
      };
    }),
  );

  const session = await QuizSession.create({
    code: SESSION_CODE,
    title: "Hult Prize Quiz (Dev)",
    eventId: event._id,
    status: "lobby",
    checkinOpen: true,
    requireSubmitted: true,
    createdBy: mail("dev.admin"),
  });
  await QuizQuestion.insertMany(questions.map((q, order) => ({ sessionId: session._id, order, ...q })));

  console.log(`Event        ${event._id}`);
  console.log(`Session      #${SESSION_CODE} (lobby, check-in open, ${questions.length} questions)`);
  console.log("Teams        50 (47 eligible, DEV48-49 forming, DEV50 disqualified)");
  console.log(`Admin        ${mail("dev.admin")}`);
  console.log(`Participants ${mail("dev.t01.lead")} .. ${mail("dev.t50.lead")}, members dev.tNN.m1..m3`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

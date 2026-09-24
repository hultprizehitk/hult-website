import { Types } from "mongoose";
import { Event, Team, type MirrorTeam } from "@/models/mirror";
import { QuizQuestion, QuizSession, type QuizSessionDoc } from "@/models/quiz";

export const mail = (local: string) => `${local}@heritageit.edu.in`;

export async function makeEvent() {
  return (await Event.create({ title: "Quiz Night", date: "2026-10-01", venue: "Auditorium" })).toObject();
}

export async function makeTeam(eventId: Types.ObjectId, n: number, overrides: Partial<MirrorTeam> = {}) {
  const doc = await Team.create({
    eventId,
    teamCode: `T${n}`,
    teamName: `Team ${n}`,
    lead: { name: `Lead ${n}`, email: mail(`lead${n}`) },
    leadEmail: mail(`lead${n}`),
    members: [
      { name: `Member ${n}a`, email: mail(`m${n}a`) },
      { name: `Member ${n}b`, email: mail(`m${n}b`) },
    ],
    status: "confirmed",
    submissionStatus: "submitted",
    ...overrides,
  });
  return doc.toObject();
}

export async function makeSession(eventId: Types.ObjectId, overrides: Partial<QuizSessionDoc> = {}): Promise<QuizSessionDoc> {
  const doc = await QuizSession.create({
    code: "123456", title: "Quiz", eventId, status: "lobby", checkinOpen: true, ...overrides,
  });
  return doc.toObject();
}

export async function addQuestions(sessionId: Types.ObjectId, n: number, timeLimitSec = 20) {
  await QuizQuestion.insertMany(
    Array.from({ length: n }, (_, i) => ({
      sessionId, order: i, text: `Question ${i + 1}`, options: ["A", "B", "C", "D"], correctIndex: 1, points: 100, timeLimitSec,
    })),
  );
}

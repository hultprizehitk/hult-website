import { randomInt } from "node:crypto";
import { Types } from "mongoose";
import { Event } from "@/models/mirror";
import { QuizAnswer, QuizQuestion, QuizSession, QuizTeam, type QuizSessionDoc } from "@/models/quiz";
import { applyAction } from "./engine";
import { QuizError } from "./errors";
import { invalidateSnapshot } from "./cache";
import { listQuestions } from "./questions";
import type { ControlAction, SessionState } from "./types";

export function toState(s: QuizSessionDoc): SessionState {
  return {
    status: s.status,
    phase: s.phase,
    currentIndex: s.currentIndex,
    checkinOpen: s.checkinOpen,
    questionOpenedAt: s.questionOpenedAt ? new Date(s.questionOpenedAt) : null,
    questionClosesAt: s.questionClosesAt ? new Date(s.questionClosesAt) : null,
    startedAt: s.startedAt ? new Date(s.startedAt) : null,
    endedAt: s.endedAt ? new Date(s.endedAt) : null,
  };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

export async function createSession(
  input: { title: string; eventId: string; requireSubmitted: boolean },
  createdBy: string,
): Promise<QuizSessionDoc> {
  if (!(await Event.exists({ _id: input.eventId }))) throw new QuizError("not_found", "Event not found");
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(randomInt(100000, 1000000));
    try {
      const doc = await QuizSession.create({ ...input, eventId: new Types.ObjectId(input.eventId), code, createdBy });
      return doc.toObject();
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
    }
  }
  throw new QuizError("conflict", "Could not allocate a session code");
}

export async function listSessions(): Promise<QuizSessionDoc[]> {
  return QuizSession.find().sort({ createdAt: -1 }).lean<QuizSessionDoc[]>();
}

export async function getSessionByCode(code: string): Promise<QuizSessionDoc> {
  const s = await QuizSession.findOne({ code }).lean<QuizSessionDoc>();
  if (!s) throw new QuizError("not_found", "Session not found");
  return s;
}

export async function updateSessionMeta(
  code: string,
  patch: { title?: string; requireSubmitted?: boolean },
): Promise<QuizSessionDoc> {
  const s = await getSessionByCode(code);
  if (s.status === "live" || s.status === "ended") throw new QuizError("invalid_state", "Session is locked");
  const updated = await QuizSession.findOneAndUpdate({ _id: s._id }, { $set: patch }, { new: true }).lean<QuizSessionDoc>();
  invalidateSnapshot(code);
  return updated!;
}

export async function deleteSession(code: string): Promise<void> {
  const s = await getSessionByCode(code);
  if (s.status === "live") throw new QuizError("invalid_state", "End the quiz before deleting");
  await Promise.all([
    QuizQuestion.deleteMany({ sessionId: s._id }),
    QuizTeam.deleteMany({ sessionId: s._id }),
    QuizAnswer.deleteMany({ sessionId: s._id }),
  ]);
  await QuizSession.deleteOne({ _id: s._id });
  invalidateSnapshot(code);
}

/** Runs one state-machine action with optimistic concurrency on stateVersion. */
export async function applyControl(code: string, action: ControlAction, now: Date = new Date()): Promise<QuizSessionDoc> {
  const session = await getSessionByCode(code);
  const questions = await listQuestions(session._id);
  const result = applyAction(toState(session), action, questions, now);
  const updated = await QuizSession.findOneAndUpdate(
    { _id: session._id, stateVersion: session.stateVersion },
    { $set: result.patch, $inc: { stateVersion: 1 } },
    { new: true },
  ).lean<QuizSessionDoc>();
  if (!updated) throw new QuizError("conflict", "State changed, retry");
  if (result.clearAnswersForIndex !== undefined) {
    const q = questions[result.clearAnswersForIndex];
    await QuizAnswer.deleteMany({ sessionId: session._id, questionId: new Types.ObjectId(q.id) });
  }
  invalidateSnapshot(code);
  return updated;
}

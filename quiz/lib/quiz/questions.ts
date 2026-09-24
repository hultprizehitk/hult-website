import { Types } from "mongoose";
import { QuizQuestion, type QuizQuestionDoc, type QuizSessionDoc } from "@/models/quiz";
import { QuizError } from "./errors";
import { invalidateSnapshot } from "./cache";
import type { QuestionLite } from "./types";
import type { QuestionInput } from "./validation";

export function toLite(d: QuizQuestionDoc): QuestionLite {
  return {
    id: String(d._id),
    order: d.order,
    text: d.text,
    options: [...d.options],
    correctIndex: d.correctIndex,
    points: d.points,
    timeLimitSec: d.timeLimitSec,
  };
}

export async function listQuestions(sessionId: Types.ObjectId): Promise<QuestionLite[]> {
  const docs = await QuizQuestion.find({ sessionId }).sort({ order: 1, _id: 1 }).lean<QuizQuestionDoc[]>();
  return docs.map(toLite);
}

function assertEditable(session: QuizSessionDoc): void {
  if (session.status === "live" || session.status === "ended") {
    throw new QuizError("invalid_state", "Questions are locked once the quiz starts");
  }
}

async function resequence(sessionId: Types.ObjectId): Promise<void> {
  const qs = await listQuestions(sessionId);
  if (qs.length === 0) return;
  await QuizQuestion.bulkWrite(
    qs.map((q, i) => ({ updateOne: { filter: { _id: new Types.ObjectId(q.id) }, update: { $set: { order: i } } } })),
  );
}

export async function addQuestion(session: QuizSessionDoc, input: QuestionInput): Promise<QuestionLite> {
  assertEditable(session);
  const last = await QuizQuestion.findOne({ sessionId: session._id }).sort({ order: -1 }).lean<QuizQuestionDoc>();
  const doc = await QuizQuestion.create({ sessionId: session._id, order: (last?.order ?? -1) + 1, ...input });
  invalidateSnapshot(session.code);
  return toLite(doc.toObject());
}

export async function updateQuestion(session: QuizSessionDoc, id: string, input: QuestionInput): Promise<QuestionLite> {
  assertEditable(session);
  const doc = await QuizQuestion.findOneAndUpdate({ _id: id, sessionId: session._id }, { $set: input }, { new: true }).lean<QuizQuestionDoc>();
  if (!doc) throw new QuizError("not_found", "Question not found");
  invalidateSnapshot(session.code);
  return toLite(doc);
}

export async function deleteQuestion(session: QuizSessionDoc, id: string): Promise<void> {
  assertEditable(session);
  const res = await QuizQuestion.deleteOne({ _id: id, sessionId: session._id });
  if (res.deletedCount === 0) throw new QuizError("not_found", "Question not found");
  await resequence(session._id);
  invalidateSnapshot(session.code);
}

export async function reorderQuestions(session: QuizSessionDoc, ids: string[]): Promise<QuestionLite[]> {
  assertEditable(session);
  const existing = await listQuestions(session._id);
  const sameSet = ids.length === existing.length && new Set(ids).size === ids.length && existing.every((q) => ids.includes(q.id));
  if (!sameSet) throw new QuizError("invalid_input", "ids must list every question once");
  await QuizQuestion.bulkWrite(
    ids.map((id, i) => ({
      updateOne: { filter: { _id: new Types.ObjectId(id), sessionId: session._id }, update: { $set: { order: i } } },
    })),
  );
  invalidateSnapshot(session.code);
  return listQuestions(session._id);
}

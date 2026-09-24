import { Types } from "mongoose";
import { QuizAnswer, type QuizAnswerDoc, type QuizSessionDoc } from "@/models/quiz";
import { QuizError } from "./errors";
import { markSnapshotStale } from "./cache";
import { findQuizTeamForEmail } from "./teams";
import { ANSWER_GRACE_MS, type QuestionLite } from "./types";
import type { AnswerInput } from "./validation";

export interface SubmitResult {
  answer: QuizAnswerDoc;
  duplicate: boolean;
}

export async function submitAnswer(
  session: QuizSessionDoc,
  questions: QuestionLite[],
  email: string,
  input: AnswerInput,
  now: Date = new Date(),
): Promise<SubmitResult> {
  if (session.status !== "live" || session.phase !== "question" || !session.questionOpenedAt || !session.questionClosesAt) {
    throw new QuizError("invalid_state", "No open question");
  }
  const q = questions[session.currentIndex];
  if (!q || q.id !== input.questionId) throw new QuizError("invalid_state", "Question is not current");

  const t = now.getTime();
  const openedAt = new Date(session.questionOpenedAt).getTime();
  const closesAt = new Date(session.questionClosesAt).getTime();
  if (t < openedAt) throw new QuizError("too_early", "Question not open yet");
  if (t > closesAt + ANSWER_GRACE_MS) throw new QuizError("too_late", "Time is up");
  if (input.optionIndex >= q.options.length) throw new QuizError("invalid_input", "Invalid option");

  const qt = await findQuizTeamForEmail(session._id, email);
  if (!qt) throw new QuizError("not_registered", "Team not checked in");
  if (qt.takerEmail !== email) throw new QuizError("not_taker", "Your teammate is answering");
  if (!qt.deviceId || qt.deviceId !== input.deviceId) throw new QuizError("wrong_device", "Active on another device");

  const isCorrect = input.optionIndex === q.correctIndex;
  const doc = {
    sessionId: session._id,
    teamId: qt.teamId,
    questionId: new Types.ObjectId(q.id),
    questionIndex: session.currentIndex,
    takerEmail: email,
    optionIndex: input.optionIndex,
    isCorrect,
    pointsAwarded: isCorrect ? q.points : 0,
    responseMs: Math.min(Math.max(t - openedAt, 0), q.timeLimitSec * 1000),
    answeredAt: now,
  };
  try {
    const created = await QuizAnswer.create(doc);
    // Soft: pollers keep the current snapshot while it refreshes; the answering phone shows its answer optimistically.
    markSnapshotStale(session.code);
    return { answer: created.toObject(), duplicate: false };
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    const existing = await QuizAnswer.findOne({
      sessionId: session._id, teamId: qt.teamId, questionId: doc.questionId,
    }).lean<QuizAnswerDoc>();
    return { answer: existing!, duplicate: true };
  }
}

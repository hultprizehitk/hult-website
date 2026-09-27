import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { QuizError } from "./errors";
import { paths, type AnswerDoc, type SessionDoc, type TeamDoc } from "./fs-types";
import { ANSWER_GRACE_MS } from "./types";
import type { AnswerInput } from "./validation";

export interface SubmitResult {
  questionId: string;
  optionIndex: number;
  duplicate: boolean;
}

/**
 * One transaction: 2 reads (session, team) + 3 writes (audit answer, team.currentAnswer, counts).
 * The team's currentAnswer makes a second submit a no-op; correctness is only computed at Reveal.
 */
export async function submitAnswer(code: string, email: string, input: AnswerInput, now: Date = new Date()): Promise<SubmitResult> {
  const db = adminDb();
  // Resolve the participant outside the transaction so a burst of teams does not
  // place a transactional lock on the shared memberEmails query range.
  const teamQuery = await db.collection(paths.teams(code)).where("memberEmails", "array-contains", email).limit(1).get();
  if (teamQuery.empty) throw new QuizError("not_registered", "Team not checked in");
  const teamRef = teamQuery.docs[0].ref;
  return db.runTransaction(async (tx) => {
    const sSnap = await tx.get(db.doc(paths.session(code)));
    if (!sSnap.exists) throw new QuizError("not_found", "Session not found");
    const s = sSnap.data() as SessionDoc;
    if (s.status !== "live" || s.phase !== "question" || !s.current || !s.questionOpenedAt || !s.questionClosesAt) {
      throw new QuizError("invalid_state", "No open question");
    }
    const q = s.current;
    if (q.id !== input.questionId) throw new QuizError("invalid_state", "Question is not current");

    const t = now.getTime();
    const openedAt = s.questionOpenedAt.toMillis();
    const closesAt = s.questionClosesAt.toMillis();
    if (t < openedAt) throw new QuizError("too_early", "Question not open yet");
    if (t > closesAt + ANSWER_GRACE_MS) throw new QuizError("too_late", "Time is up");
    if (input.optionIndex >= q.options.length) throw new QuizError("invalid_input", "Invalid option");

    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists) throw new QuizError("not_registered", "Team not checked in");
    const team = teamSnap.data() as TeamDoc;
    if (!team.memberEmails.includes(email)) throw new QuizError("not_registered", "Team not checked in");
    if (!team.checkedInAt) throw new QuizError("not_registered", "Team not checked in");
    if (team.takerEmail !== email) throw new QuizError("not_taker", "Your teammate is answering");
    if (!team.deviceId || team.deviceId !== input.deviceId) throw new QuizError("wrong_device", "Active on another device");

    if (team.currentAnswer?.qid === q.id) {
      return { questionId: q.id, optionIndex: team.currentAnswer.optionIndex, duplicate: true };
    }

    const responseMs = Math.min(Math.max(t - openedAt, 0), q.timeLimitSec * 1000);
    const answer: AnswerDoc<Timestamp> = {
      teamId: team.teamId,
      questionId: q.id,
      questionIndex: q.index,
      takerEmail: email,
      optionIndex: input.optionIndex,
      answeredAt: Timestamp.fromDate(now),
      responseMs,
    };
    tx.set(db.doc(paths.answer(code, team.teamId, q.id)), answer);
    tx.update(teamRef, { currentAnswer: { qid: q.id, optionIndex: input.optionIndex, responseMs } });
    tx.update(db.doc(paths.counter(code, team.teamId)), { answeredFor: q.id, answered: true });
    return { questionId: q.id, optionIndex: input.optionIndex, duplicate: false };
  });
}

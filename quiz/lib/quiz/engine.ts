import { QuizError } from "./errors";
import { LEAD_IN_MS, type ActionResult, type ControlAction, type QuestionLite, type SessionState } from "./types";

const ms = (d: Date | null) => (d ? d.getTime() : 0);

export function openQuestionPatch(index: number, questions: QuestionLite[], now: Date): Partial<SessionState> {
  const q = questions[index];
  const openedAt = new Date(now.getTime() + LEAD_IN_MS);
  return {
    currentIndex: index,
    phase: "question",
    questionOpenedAt: openedAt,
    questionClosesAt: new Date(openedAt.getTime() + q.timeLimitSec * 1000),
  };
}

export function isQuestionOpen(s: SessionState, now: Date): boolean {
  if (s.status !== "live" || s.phase !== "question") return false;
  const t = now.getTime();
  return t >= ms(s.questionOpenedAt) && t < ms(s.questionClosesAt);
}

/** Number of questions (from index 0) whose answering window is over. */
export function closedQuestionCount(s: SessionState, now: Date): number {
  if (s.currentIndex < 0) return 0;
  const currentStillRunning = s.status === "live" && s.phase === "question" && now.getTime() < ms(s.questionClosesAt);
  return currentStillRunning ? s.currentIndex : s.currentIndex + 1;
}

function requireState(ok: boolean): void {
  if (!ok) throw new QuizError("invalid_state");
}

export function applyAction(s: SessionState, a: ControlAction, questions: QuestionLite[], now: Date): ActionResult {
  const t = now.getTime();
  const live = s.status === "live";
  const inQuestion = live && s.phase === "question";

  switch (a.type) {
    case "open_lobby":
      requireState(s.status === "draft");
      return { patch: { status: "lobby", checkinOpen: true } };

    case "toggle_checkin":
      requireState(s.status === "lobby");
      return { patch: { checkinOpen: !s.checkinOpen } };

    case "start":
      requireState(s.status === "lobby");
      if (questions.length === 0) throw new QuizError("no_questions");
      return { patch: { status: "live", checkinOpen: false, startedAt: now, ...openQuestionPatch(0, questions, now) } };

    case "next": {
      requireState(live && (s.phase === "reveal" || s.phase === "leaderboard"));
      const nextIndex = s.currentIndex + 1;
      if (nextIndex >= questions.length) throw new QuizError("last_question");
      return { patch: openQuestionPatch(nextIndex, questions, now) };
    }

    case "close_now":
      requireState(inQuestion && t < ms(s.questionClosesAt));
      return { patch: { questionClosesAt: new Date(Math.max(t, ms(s.questionOpenedAt))) } };

    case "extend":
      requireState(inQuestion && t < ms(s.questionClosesAt));
      return { patch: { questionClosesAt: new Date(ms(s.questionClosesAt) + a.seconds * 1000) } };

    case "restart_question":
      requireState(inQuestion);
      return { patch: openQuestionPatch(s.currentIndex, questions, now), clearAnswersForIndex: s.currentIndex };

    case "reveal":
      requireState(inQuestion);
      if (t < ms(s.questionClosesAt)) {
        return { patch: { phase: "reveal", questionClosesAt: new Date(Math.max(t, ms(s.questionOpenedAt))) } };
      }
      return { patch: { phase: "reveal" } };

    case "show_leaderboard":
      requireState(live && s.phase === "reveal");
      return { patch: { phase: "leaderboard" } };

    case "end":
      requireState(s.status === "lobby" || live);
      return { patch: { status: "ended", phase: "leaderboard", endedAt: now, checkinOpen: false } };
  }
}

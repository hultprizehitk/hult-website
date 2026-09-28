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

/**
 * Host state machine (docs/superpowers/specs/2026-09-28-quiz-ux-overhaul.md §3). The primary flow runs in order:
 * start -> idle ("quiz is starting") -> next -> question -> show_results -> next -> ... -> end.
 * `publish_question` lets the admin jump to any question from check-in, mid-quiz or after the end.
 */
export function applyAction(s: SessionState, a: ControlAction, questions: QuestionLite[], now: Date): ActionResult {
  const t = now.getTime();
  const live = s.status === "live";
  const inQuestion = live && s.phase === "question";
  const stillOpen = inQuestion && t < ms(s.questionClosesAt);

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
      return { patch: { status: "live", phase: "idle", currentIndex: -1, checkinOpen: false, startedAt: now } };

    case "next": {
      requireState(live && (s.phase === "idle" || s.phase === "results"));
      const nextIndex = s.currentIndex + 1;
      if (nextIndex >= questions.length) throw new QuizError("last_question");
      return { patch: openQuestionPatch(nextIndex, questions, now) };
    }

    case "publish_question":
      // Jump to any question. Leaving an open question does not grade it; re-grading a question replaces its old result.
      requireState(s.status !== "draft");
      if (questions.length === 0) throw new QuizError("no_questions");
      if (a.index < 0 || a.index >= questions.length) throw new QuizError("not_found");
      return {
        patch: { status: "live", checkinOpen: false, startedAt: s.startedAt ?? now, endedAt: null, ...openQuestionPatch(a.index, questions, now) },
        clearAnswersForIndex: a.index,
      };

    case "close_now":
      requireState(inQuestion);
      // Idempotent: the host may click just as the timer runs out; an already-closed question stays closed.
      if (!stillOpen) return { patch: {} };
      return { patch: { questionClosesAt: new Date(Math.max(t, ms(s.questionOpenedAt))) } };

    case "extend":
      requireState(stillOpen);
      return { patch: { questionClosesAt: new Date(ms(s.questionClosesAt) + a.seconds * 1000) } };

    case "restart_question":
      requireState(inQuestion);
      return { patch: openQuestionPatch(s.currentIndex, questions, now), clearAnswersForIndex: s.currentIndex };

    case "show_results":
      requireState(inQuestion);
      if (stillOpen) return { patch: { phase: "results", questionClosesAt: new Date(Math.max(t, ms(s.questionOpenedAt))) } };
      return { patch: { phase: "results" } };

    case "end":
      requireState(s.status === "lobby" || live);
      if (stillOpen) {
        return { patch: { status: "ended", phase: "results", endedAt: now, checkinOpen: false, questionClosesAt: new Date(Math.max(t, ms(s.questionOpenedAt))) } };
      }
      return { patch: { status: "ended", phase: s.currentIndex >= 0 ? "results" : "idle", endedAt: now, checkinOpen: false } };

    case "reset_event":
      return {
        patch: {
          status: "draft",
          phase: "idle",
          currentIndex: -1,
          checkinOpen: false,
          questionOpenedAt: null,
          questionClosesAt: null,
          startedAt: null,
          endedAt: null,
        },
        resetEvent: true,
      };
  }
}

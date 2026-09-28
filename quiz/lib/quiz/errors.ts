export type QuizErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "invalid_state"
  | "conflict"
  | "not_registered"
  | "not_checked_in"
  | "ineligible"
  | "team_already_active"
  | "checkin_closed"
  | "not_lead"
  | "not_taker"
  | "wrong_device"
  | "too_early"
  | "too_late"
  | "no_questions"
  | "last_question";

const STATUS: Record<QuizErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  invalid_input: 400,
  invalid_state: 409,
  conflict: 409,
  not_registered: 404,
  not_checked_in: 403,
  ineligible: 403,
  team_already_active: 409,
  checkin_closed: 409,
  not_lead: 403,
  not_taker: 403,
  wrong_device: 403,
  too_early: 409,
  too_late: 409,
  no_questions: 409,
  last_question: 409,
};

/** Short default copy when a throw site gives no message (shown in admin toasts). */
const DEFAULT_MESSAGE: Partial<Record<QuizErrorCode, string>> = {
  invalid_state: "Not available at this step",
  conflict: "Already updated",
  no_questions: "Add questions first",
  last_question: "No more questions",
  not_checked_in: "Scan your pass at the desk first",
};

export class QuizError extends Error {
  readonly status: number;
  constructor(readonly code: QuizErrorCode, message?: string) {
    super(message ?? DEFAULT_MESSAGE[code] ?? code);
    this.name = "QuizError";
    this.status = STATUS[code];
  }
}

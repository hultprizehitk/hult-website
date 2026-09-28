export const LEAD_IN_MS = 3000;
export const ANSWER_GRACE_MS = 750;
export const LEADERBOARD_SIZE = 10;

export type SessionStatus = "draft" | "lobby" | "live" | "ended";
/** Live phases: idle = "quiz is starting", question = lead-in + answering, results = graded answer + standings. */
export type Phase = "idle" | "question" | "results";

export interface SessionState {
  status: SessionStatus;
  phase: Phase;
  currentIndex: number;
  checkinOpen: boolean;
  questionOpenedAt: Date | null;
  questionClosesAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface QuestionLite {
  id: string;
  order: number;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  timeLimitSec: number;
}

export type ControlAction =
  | { type: "open_lobby" }
  | { type: "toggle_checkin" }
  | { type: "start" }
  | { type: "next" }
  | { type: "close_now" }
  | { type: "extend"; seconds: number }
  | { type: "restart_question" }
  | { type: "publish_question"; index: number }
  | { type: "show_results" }
  | { type: "end" }
  | { type: "reset_event" };

export interface ActionResult {
  patch: Partial<SessionState>;
  clearAnswersForIndex?: number;
  /** reset_event: wipe scores, answers, check-ins and seats. */
  resetEvent?: boolean;
}

export interface Standing {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  totalTimeMs: number;
  answeredCount: number;
  correctCount: number;
  /** Response time on the last graded question; null = no answer. */
  lastMs?: number | null;
  lastCorrect?: boolean | null;
  /** Rank before the last graded question; null = first ranking. */
  prevRank?: number | null;
}

export interface PublicQuestion {
  id: string;
  index: number;
  points: number;
  timeLimitSec: number;
  openedAt: number;
  closesAt: number;
  text: string | null;
  options: string[] | null;
  correctIndex: number | null;
}

export interface AnswerView {
  optionIndex: number;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export type MeRole = "taker" | "teammate" | "unregistered" | "ineligible";

/**
 * The team's one seat, from this phone's point of view.
 * mine: playing here. other_device: my seat is bound to another device. reserved_me: admin gave me the seat, binding.
 * taken / reserved_other: a teammate plays. free: nobody plays (anyone can take it).
 */
export type SeatState = "mine" | "other_device" | "reserved_me" | "taken" | "reserved_other" | "free";

export interface MeTeam {
  id: string;
  name: string;
  code: string;
  takerEmail: string | null;
  isLead: boolean;
  members: { name: string; email: string }[];
}

export interface MeView {
  email: string;
  role: MeRole;
  team: MeTeam | null;
  checkedIn: boolean;
  deviceBound: boolean;
  deviceOk: boolean;
  seat: SeatState;
  /** Display name of whoever holds (or is reserved) the seat. */
  takerName: string | null;
  answer: AnswerView | null;
  standing: Standing | null;
  /** Question id the standing was last graded for (the session doc can arrive before the team doc). */
  gradedQid: string | null;
}

export interface Counts {
  checkedIn: number;
  eligible: number;
  answered: number;
}

export interface StateResponse {
  serverNow: number;
  stateVersion: number;
  code: string;
  title: string;
  status: SessionStatus;
  phase: Phase;
  currentIndex: number;
  questionCount: number;
  checkinOpen: boolean;
  question: PublicQuestion | null;
  counts: Counts;
  distribution: number[] | null;
  leaderboard: Standing[] | null;
  me: MeView | null;
}

export interface AdminSessionSummary {
  code: string;
  title: string;
  eventId: string;
  status: SessionStatus;
  phase: Phase;
  currentIndex: number;
  checkinOpen: boolean;
  requireSubmitted: boolean;
  questionOpenedAt: number | null;
  questionClosesAt: number | null;
  stateVersion: number;
}

export interface TeamBoardRow {
  teamId: string;
  teamName: string;
  teamCode: string;
  leadEmail: string;
  eligible: boolean;
  checkedIn: boolean;
  checkedInAt: number | null;
  takerEmail: string | null;
  deviceBound: boolean;
  deskScanned: boolean;
  answeredCurrent: boolean;
  /** Last graded question had no answer from this team. */
  missedLast: boolean;
  score: number;
  rank: number | null;
  members: { name: string; email: string }[];
}

export const LEAD_IN_MS = 3000;
export const ANSWER_GRACE_MS = 750;
export const LEADERBOARD_SIZE = 10;
export const POLL_MS = 1000;

export type SessionStatus = "draft" | "lobby" | "live" | "ended";
export type Phase = "idle" | "question" | "reveal" | "leaderboard";

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
  | { type: "reveal" }
  | { type: "show_leaderboard" }
  | { type: "end" };

export interface ActionResult {
  patch: Partial<SessionState>;
  clearAnswersForIndex?: number;
}

export interface Standing {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  totalTimeMs: number;
  answeredCount: number;
  correctCount: number;
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
  answer: AnswerView | null;
  standing: Standing | null;
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

export interface AdminSessionView {
  serverNow: number;
  session: AdminSessionSummary;
  questions: QuestionLite[];
  counts: Counts;
  distribution: number[] | null;
  standings: Standing[];
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
  answeredCurrent: boolean;
  members: { name: string; email: string }[];
}

import type { Phase, SessionStatus, Standing } from "./types";

/** Firestore Timestamp shape shared by firebase-admin and the web SDK. */
export interface Ts {
  toMillis(): number;
}

export const SESSIONS = "quizSessions";
export const ADMINS = "quizAdmins";

export const paths = {
  session: (code: string) => `${SESSIONS}/${code}`,
  counts: (code: string) => `${SESSIONS}/${code}/counts`,
  counter: (code: string, teamId: string) => `${SESSIONS}/${code}/counts/${teamId}`,
  questions: (code: string) => `${SESSIONS}/${code}/questions`,
  question: (code: string, id: string) => `${SESSIONS}/${code}/questions/${id}`,
  teams: (code: string) => `${SESSIONS}/${code}/teams`,
  team: (code: string, teamId: string) => `${SESSIONS}/${code}/teams/${teamId}`,
  answers: (code: string) => `${SESSIONS}/${code}/answers`,
  answer: (code: string, teamId: string, questionId: string) => `${SESSIONS}/${code}/answers/${teamId}_${questionId}`,
  savedResults: (code: string) => `${SESSIONS}/${code}/savedResults`,
  savedResult: (code: string, id: string) => `${SESSIONS}/${code}/savedResults/${id}`,
  admin: (email: string) => `${ADMINS}/${email}`,
};

/** Question order + time limits on the public session doc, so host actions need no question reads. */
export interface PlanItem {
  id: string;
  timeLimitSec: number;
}

/** Public fields of the running question. correctIndex/distribution are null until reveal. */
export interface CurrentQuestion {
  id: string;
  index: number;
  text: string;
  options: string[];
  points: number;
  timeLimitSec: number;
  correctIndex: number | null;
  distribution: number[] | null;
}

export interface SyncSummary {
  total: number;
  eligible: number;
  added: number;
  updated: number;
  removed: number;
}

/** quizSessions/{code} (public). */
export interface SessionDoc<T = Ts> {
  code: string;
  title: string;
  eventId: string;
  eventTitle: string;
  status: SessionStatus;
  phase: Phase;
  currentIndex: number;
  checkinOpen: boolean;
  requireSubmitted: boolean;
  questionOpenedAt: T | null;
  questionClosesAt: T | null;
  startedAt: T | null;
  endedAt: T | null;
  stateVersion: number;
  plan: PlanItem[];
  current: CurrentQuestion | null;
  leaderboard: Standing[] | null;
  totalRanked?: number;
  gradedThrough: number;
  createdBy: string;
  createdAt: T;
  lastSyncAt: T | null;
  lastSync: SyncSummary | null;
  lastSavedAt?: T | null;
  lastSavedBy?: string | null;
}

/** Aggregated counts returned to views; Firestore stores one shard per team instead. */
export interface CountsDoc {
  checkedIn: number;
  eligible: number;
  answeredCurrent: number;
  answeredFor: string | null;
}

/** quizSessions/{code}/counts/{teamId}; avoids a shared write hotspot. */
export interface CounterDoc {
  teamId: string;
  teamName?: string;
  teamCode?: string;
  playerName?: string | null;
  playerEmail?: string | null;
  eligible: boolean;
  checkedIn: boolean;
  answeredFor: string | null;
  answered: boolean;
}

/** quizSessions/{code}/questions/{id} (admin only). */
export interface QuestionDoc {
  order: number;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  timeLimitSec: number;
}

export interface QuestionResult {
  optionIndex: number | null;
  correct: boolean;
  points: number;
  ms: number;
}

/** quizSessions/{code}/teams/{teamId} (members + admin). Roster fields come from sync. */
export interface TeamDoc<T = Ts> {
  teamId: string;
  teamName: string;
  teamCode: string;
  leadEmail: string;
  members: { name: string; email: string }[];
  memberEmails: string[];
  eligible: boolean;
  /** Any member scanned at the venue desk (main site), copied by sync. Informational only. */
  deskScanned?: boolean;
  syncedAt: T | null;
  checkedInAt: T | null;
  checkedInBy: string | null;
  takerEmail: string | null;
  deviceId: string | null;
  currentAnswer: { qid: string; optionIndex: number; responseMs: number } | null;
  score: number;
  totalTimeMs: number;
  answeredCount: number;
  correctCount: number;
  rank: number | null;
  /** Rank before the last graded question (movement arrows). */
  prevRank?: number | null;
  lastResult: { qid: string; optionIndex: number | null; correct: boolean; points: number; ms?: number } | null;
  perQuestion: Record<string, QuestionResult>;
}

/** quizSessions/{code}/answers/{teamId}_{qid} (admin-only audit trail). */
export interface AnswerDoc<T = Ts> {
  teamId: string;
  questionId: string;
  questionIndex: number;
  takerEmail: string;
  optionIndex: number;
  answeredAt: T;
  responseMs: number;
}

export function emptyTeamState<T = Ts>(): Pick<
  TeamDoc<T>,
  | "checkedInAt" | "checkedInBy" | "deviceId" | "currentAnswer" | "score" | "totalTimeMs"
  | "answeredCount" | "correctCount" | "rank" | "prevRank" | "lastResult" | "perQuestion"
> {
  return {
    checkedInAt: null,
    checkedInBy: null,
    deviceId: null,
    currentAnswer: null,
    score: 0,
    totalTimeMs: 0,
    answeredCount: 0,
    correctCount: 0,
    rank: null,
    prevRank: null,
    lastResult: null,
    perQuestion: {},
  };
}

export interface SavedQuizSnapshot<T = Ts> {
  code: string;
  title: string;
  eventId: string;
  eventTitle: string;
  status: SessionStatus;
  savedAt: T;
  savedBy: string;
  totalQuestions: number;
  totalTeams: number;
  checkedInTeams: number;
  standings: Standing[];
  questions: (QuestionDoc & { id: string })[];
  teamsSummary: {
    teamId: string;
    teamName: string;
    teamCode: string;
    score: number;
    totalTimeMs: number;
    rank: number | null;
    takerEmail: string | null;
    answeredCount: number;
    correctCount: number;
    answers: Record<string, QuestionResult>;
  }[];
}


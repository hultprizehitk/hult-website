import { QuizAnswer, QuizSession, QuizTeam, type QuizAnswerDoc, type QuizSessionDoc, type QuizTeamDoc } from "@/models/quiz";
import type { MirrorTeam } from "@/models/mirror";
import { SNAPSHOT_TTL_MS, snapshotCache } from "./cache";
import { closedQuestionCount } from "./engine";
import { QuizError } from "./errors";
import { standingsCsv } from "./export";
import { listQuestions } from "./questions";
import { computeStandings, type ScoringAnswer } from "./scoring";
import { toState } from "./sessions";
import { countEligibleTeams, findTeamForEmail, isTeamEligible } from "./teams";
import { answerView, distribution, isRevealed, publicQuestion } from "./views";
import {
  LEADERBOARD_SIZE,
  type AdminSessionSummary,
  type AdminSessionView,
  type MeView,
  type QuestionLite,
  type SessionState,
  type Standing,
  type StateResponse,
} from "./types";

export interface Snapshot {
  session: QuizSessionDoc;
  state: SessionState;
  questions: QuestionLite[];
  teams: QuizTeamDoc[];
  answers: QuizAnswerDoc[];
  eligibleCount: number;
}

async function loadSnapshot(code: string): Promise<Snapshot | null> {
  const session = await QuizSession.findOne({ code }).lean<QuizSessionDoc>();
  if (!session) return null;
  const [questions, teams, answers, eligibleCount] = await Promise.all([
    listQuestions(session._id),
    QuizTeam.find({ sessionId: session._id }).lean<QuizTeamDoc[]>(),
    QuizAnswer.find({ sessionId: session._id }).lean<QuizAnswerDoc[]>(),
    countEligibleTeams(session),
  ]);
  return { session, state: toState(session), questions, teams, answers, eligibleCount };
}

/** At most one DB load per code per SNAPSHOT_TTL_MS per process; concurrent callers share the promise. */
export function getSnapshot(code: string): Promise<Snapshot | null> {
  const now = Date.now();
  const hit = snapshotCache.get(code);
  if (hit && now - hit.at < SNAPSHOT_TTL_MS) return hit.promise as Promise<Snapshot | null>;
  const promise = loadSnapshot(code);
  snapshotCache.set(code, { at: now, promise });
  promise.catch(() => snapshotCache.delete(code));
  return promise;
}

const toScoring = (a: QuizAnswerDoc): ScoringAnswer => ({
  teamId: String(a.teamId),
  questionId: String(a.questionId),
  pointsAwarded: a.pointsAwarded,
  isCorrect: a.isCorrect,
  responseMs: a.responseMs,
});

function standingsFor(snap: Snapshot, questionCount: number): Standing[] {
  return computeStandings(
    snap.teams.map((t) => ({ teamId: String(t.teamId), teamName: t.teamName })),
    snap.questions.slice(0, questionCount).map((q) => ({ id: q.id, timeLimitSec: q.timeLimitSec })),
    snap.answers.map(toScoring),
  );
}

/** Participants only see scores for questions that have been revealed. */
function revealedCount(s: SessionState): number {
  if (s.currentIndex < 0) return 0;
  return isRevealed(s) ? s.currentIndex + 1 : s.currentIndex;
}

const lookupCache = new Map<string, { at: number; team: MirrorTeam | null }>();
const LOOKUP_TTL_MS = 5000;

async function lookupTeam(session: QuizSessionDoc, email: string): Promise<MirrorTeam | null> {
  const key = `${session._id}:${email}`;
  const hit = lookupCache.get(key);
  if (hit && Date.now() - hit.at < LOOKUP_TTL_MS) return hit.team;
  const team = await findTeamForEmail(session.eventId, email);
  lookupCache.set(key, { at: Date.now(), team });
  return team;
}

async function buildMe(
  snap: Snapshot,
  email: string,
  deviceId: string | null,
  currentQuestion: QuestionLite | undefined,
  standings: Standing[],
): Promise<MeView> {
  const empty: MeView = { email, role: "unregistered", team: null, checkedIn: false, deviceBound: false, deviceOk: false, answer: null, standing: null };
  const qt = snap.teams.find((t) => t.memberEmails.includes(email));
  if (qt) {
    const role = qt.takerEmail === email ? "taker" : "teammate";
    const mine = currentQuestion
      ? snap.answers.find((a) => String(a.teamId) === String(qt.teamId) && String(a.questionId) === currentQuestion.id)
      : undefined;
    return {
      email,
      role,
      team: { id: String(qt.teamId), name: qt.teamName, code: qt.teamCode, takerEmail: qt.takerEmail, isLead: qt.leadEmail === email, members: qt.members },
      checkedIn: true,
      deviceBound: !!qt.deviceId,
      deviceOk: role === "taker" && !!deviceId && qt.deviceId === deviceId,
      answer: mine ? answerView(mine, isRevealed(snap.state)) : null,
      standing: standings.find((s) => s.teamId === String(qt.teamId)) ?? null,
    };
  }
  const team = await lookupTeam(snap.session, email);
  if (!team) return empty;
  const eligible = isTeamEligible(team, snap.session.requireSubmitted);
  const lead = team.leadEmail.toLowerCase();
  return {
    ...empty,
    role: !eligible ? "ineligible" : lead === email ? "taker" : "teammate",
    team: {
      id: String(team._id),
      name: team.teamName,
      code: team.teamCode,
      takerEmail: eligible ? lead : null,
      isLead: lead === email,
      members: [team.lead, ...(team.members ?? [])].map((m) => ({ name: m.name, email: m.email.toLowerCase() })),
    },
  };
}

export async function getState(
  code: string,
  viewer: { email: string } | null,
  deviceId: string | null,
  now: Date = new Date(),
): Promise<StateResponse | null> {
  const snap = await getSnapshot(code);
  if (!snap) return null;
  const { session, state, questions } = snap;
  const q = state.currentIndex >= 0 ? questions[state.currentIndex] : undefined;
  const currentAnswers = q ? snap.answers.filter((a) => String(a.questionId) === q.id) : [];
  const standings = standingsFor(snap, revealedCount(state));
  const showBoard = state.phase === "leaderboard" || state.status === "ended";

  return {
    serverNow: now.getTime(),
    stateVersion: session.stateVersion,
    code: session.code,
    title: session.title,
    status: state.status,
    phase: state.phase,
    currentIndex: state.currentIndex,
    questionCount: questions.length,
    checkinOpen: state.checkinOpen,
    question: publicQuestion(state, q, state.currentIndex, now),
    counts: { checkedIn: snap.teams.length, eligible: snap.eligibleCount, answered: currentAnswers.length },
    distribution: q && state.phase === "reveal" ? distribution(q.options.length, currentAnswers) : null,
    leaderboard: showBoard ? standings.slice(0, LEADERBOARD_SIZE) : null,
    me: viewer ? await buildMe(snap, viewer.email, deviceId, q, standings) : null,
  };
}

export function summarizeSession(s: QuizSessionDoc): AdminSessionSummary {
  return {
    code: s.code,
    title: s.title,
    eventId: String(s.eventId),
    status: s.status,
    phase: s.phase,
    currentIndex: s.currentIndex,
    checkinOpen: s.checkinOpen,
    requireSubmitted: s.requireSubmitted,
    questionOpenedAt: s.questionOpenedAt ? new Date(s.questionOpenedAt).getTime() : null,
    questionClosesAt: s.questionClosesAt ? new Date(s.questionClosesAt).getTime() : null,
    stateVersion: s.stateVersion,
  };
}

async function requireSnapshot(code: string): Promise<Snapshot> {
  const snap = await getSnapshot(code);
  if (!snap) throw new QuizError("not_found", "Session not found");
  return snap;
}

export async function getAdminView(code: string, now: Date = new Date()): Promise<AdminSessionView> {
  const snap = await requireSnapshot(code);
  const q = snap.state.currentIndex >= 0 ? snap.questions[snap.state.currentIndex] : undefined;
  const currentAnswers = q ? snap.answers.filter((a) => String(a.questionId) === q.id) : [];
  return {
    serverNow: now.getTime(),
    session: summarizeSession(snap.session),
    questions: snap.questions,
    counts: { checkedIn: snap.teams.length, eligible: snap.eligibleCount, answered: currentAnswers.length },
    distribution: q ? distribution(q.options.length, currentAnswers) : null,
    standings: standingsFor(snap, closedQuestionCount(snap.state, now)),
  };
}

export async function buildExportCsv(code: string, now: Date = new Date()): Promise<{ filename: string; csv: string }> {
  const snap = await requireSnapshot(code);
  const closed = closedQuestionCount(snap.state, now);
  const csv = standingsCsv({
    standings: standingsFor(snap, closed),
    teams: snap.teams.map((t) => ({ teamId: String(t.teamId), teamCode: t.teamCode, takerEmail: t.takerEmail })),
    questions: snap.questions.slice(0, closed),
    answers: snap.answers.map((a) => ({ ...toScoring(a), optionIndex: a.optionIndex })),
  });
  return { filename: `quiz-${code}-results.csv`, csv };
}

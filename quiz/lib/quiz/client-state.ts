import type { CountsDoc, SessionDoc, TeamDoc, Ts } from "./fs-types";
import { rankStandings } from "./scoring";
import type { AdminSessionSummary, AnswerView, Counts, MeView, PublicQuestion, SessionState, Standing, StateResponse, TeamBoardRow } from "./types";
import { isRevealed } from "./views";

const ms = (t: Ts | null | undefined): number | null => (t ? t.toMillis() : null);
const date = (t: Ts | null | undefined): Date | null => (t ? new Date(t.toMillis()) : null);

export function sessionStateFromDoc(s: SessionDoc): SessionState {
  return {
    status: s.status,
    phase: s.phase,
    currentIndex: s.currentIndex,
    checkinOpen: s.checkinOpen,
    questionOpenedAt: date(s.questionOpenedAt),
    questionClosesAt: date(s.questionClosesAt),
    startedAt: date(s.startedAt),
    endedAt: date(s.endedAt),
  };
}

/** Question as participants may see it at `nowMs`: text hidden during the lead-in, answer hidden until reveal. */
export function publicQuestionFromDoc(s: SessionDoc, nowMs: number): PublicQuestion | null {
  const c = s.current;
  const openedAt = ms(s.questionOpenedAt);
  const closesAt = ms(s.questionClosesAt);
  if (!c || s.currentIndex < 0 || s.phase === "idle" || openedAt === null || closesAt === null) return null;
  const revealed = isRevealed(sessionStateFromDoc(s));
  const visible = nowMs >= openedAt || revealed;
  return {
    id: c.id,
    index: c.index,
    points: c.points,
    timeLimitSec: c.timeLimitSec,
    openedAt,
    closesAt,
    text: visible ? c.text : null,
    options: visible ? c.options : null,
    correctIndex: revealed ? c.correctIndex : null,
  };
}

function teamStanding(t: TeamDoc): Standing | null {
  if (t.rank === null) return null;
  return { rank: t.rank, teamId: t.teamId, teamName: t.teamName, score: t.score, totalTimeMs: t.totalTimeMs, answeredCount: t.answeredCount, correctCount: t.correctCount };
}

function teamAnswer(t: TeamDoc, qid: string | undefined, revealed: boolean): AnswerView | null {
  if (!qid) return null;
  const graded = revealed && t.lastResult?.qid === qid ? t.lastResult : null;
  if (t.currentAnswer?.qid === qid) {
    return { optionIndex: t.currentAnswer.optionIndex, isCorrect: graded ? graded.correct : null, pointsAwarded: graded ? graded.points : null };
  }
  if (graded && graded.optionIndex !== null) return { optionIndex: graded.optionIndex, isCorrect: graded.correct, pointsAwarded: graded.points };
  return null;
}

export function meFromTeam(s: SessionDoc, t: TeamDoc, email: string, deviceId: string | null): MeView {
  const role = t.takerEmail === email ? "taker" : "teammate";
  return {
    email,
    role,
    team: { id: t.teamId, name: t.teamName, code: t.teamCode, takerEmail: t.takerEmail, isLead: t.leadEmail === email, members: t.members },
    checkedIn: !!t.checkedInAt,
    deviceBound: !!t.deviceId,
    deviceOk: role === "taker" && !!deviceId && t.deviceId === deviceId,
    answer: teamAnswer(t, s.current?.id, isRevealed(sessionStateFromDoc(s))),
    standing: teamStanding(t),
  };
}

export function toStateResponse(input: {
  session: SessionDoc;
  counts: CountsDoc | null;
  team: TeamDoc | null;
  email: string | null;
  deviceId: string | null;
  nowMs: number;
  role?: "unregistered" | "ineligible";
}): StateResponse {
  const { session: s, counts, team, email, deviceId, nowMs } = input;
  const c: Counts = counts
    ? { checkedIn: counts.checkedIn, eligible: counts.eligible, answered: counts.answeredFor === s.current?.id ? counts.answeredCurrent : 0 }
    : { checkedIn: 0, eligible: 0, answered: 0 };
  let me: MeView | null = null;
  if (email) {
    me = team
      ? meFromTeam(s, team, email, deviceId)
      : { email, role: input.role ?? "unregistered", team: null, checkedIn: false, deviceBound: false, deviceOk: false, answer: null, standing: null };
  }
  return {
    serverNow: nowMs,
    stateVersion: s.stateVersion,
    code: s.code,
    title: s.title,
    status: s.status,
    phase: s.phase,
    currentIndex: s.currentIndex,
    questionCount: s.plan.length,
    checkinOpen: s.checkinOpen,
    question: publicQuestionFromDoc(s, nowMs),
    counts: c,
    distribution: s.phase === "reveal" ? (s.current?.distribution ?? null) : null,
    leaderboard: s.phase === "leaderboard" || s.status === "ended" ? (s.leaderboard ?? []) : null,
    me,
  };
}

export function adminSummary(s: SessionDoc): AdminSessionSummary {
  return {
    code: s.code,
    title: s.title,
    eventId: s.eventId,
    status: s.status,
    phase: s.phase,
    currentIndex: s.currentIndex,
    checkinOpen: s.checkinOpen,
    requireSubmitted: s.requireSubmitted,
    questionOpenedAt: ms(s.questionOpenedAt),
    questionClosesAt: ms(s.questionClosesAt),
    stateVersion: s.stateVersion,
  };
}

/** Live standings for the admin: checked-in teams ranked by their graded totals. */
export function standingsFromTeams(teams: TeamDoc[]): Standing[] {
  return rankStandings(
    teams
      .filter((t) => t.checkedInAt)
      .map((t) => ({ teamId: t.teamId, teamName: t.teamName, score: t.score, totalTimeMs: t.totalTimeMs, answeredCount: t.answeredCount, correctCount: t.correctCount })),
  );
}

export function teamBoardRows(teams: TeamDoc[], currentQid: string | null): TeamBoardRow[] {
  return teams
    .map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      teamCode: t.teamCode,
      leadEmail: t.leadEmail,
      eligible: t.eligible,
      checkedIn: !!t.checkedInAt,
      checkedInAt: ms(t.checkedInAt),
      takerEmail: t.takerEmail,
      deviceBound: !!t.deviceId,
      answeredCurrent: !!currentQid && t.currentAnswer?.qid === currentQid,
      members: t.members,
    }))
    .sort((a, b) => Number(b.checkedIn) - Number(a.checkedIn) || a.teamName.localeCompare(b.teamName));
}

/** Per-option answer counts for the running question, from team docs the admin already listens to (no extra reads). */
export function liveDistribution(teams: TeamDoc[], qid: string | null, optionCount: number): number[] {
  const out = new Array<number>(optionCount).fill(0);
  if (!qid) return out;
  for (const t of teams) {
    const a = t.currentAnswer;
    if (a && a.qid === qid && a.optionIndex >= 0 && a.optionIndex < optionCount) out[a.optionIndex] += 1;
  }
  return out;
}

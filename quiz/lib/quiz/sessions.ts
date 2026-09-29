import { randomInt } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sessionStateFromDoc } from "./client-state";
import { applyAction } from "./engine";
import { QuizError } from "./errors";
import { emptyTeamState, paths, SESSIONS, type QuestionDoc, type SessionDoc, type TeamDoc } from "./fs-types";
import { gradeQuestion } from "./grading";
import { LEADERBOARD_SIZE, type ControlAction, type QuestionLite, type SessionState } from "./types";

const EDITABLE = new Set(["draft", "lobby"]);

function ts(d: Date | null | undefined): Timestamp | null {
  return d ? Timestamp.fromDate(d) : null;
}

/** SessionState patch (Dates) -> Firestore update (Timestamps). */
export function toDocPatch(patch: Partial<SessionState>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) out[k] = v instanceof Date ? ts(v) : v;
  return out;
}

function sessionRef(code: string) {
  return adminDb().doc(paths.session(code));
}

export async function createSession(
  input: { title: string; eventId: string; eventTitle: string; requireSubmitted: boolean },
  createdBy: string,
  fixedCode?: string,
): Promise<SessionDoc> {
  const db = adminDb();
  for (let attempt = 0; attempt < (fixedCode ? 1 : 10); attempt++) {
    const code = fixedCode ?? String(randomInt(100000, 1000000));
    const doc: SessionDoc<Timestamp> = {
      code,
      title: input.title,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      status: "draft",
      phase: "idle",
      currentIndex: -1,
      checkinOpen: false,
      requireSubmitted: input.requireSubmitted,
      questionOpenedAt: null,
      questionClosesAt: null,
      startedAt: null,
      endedAt: null,
      stateVersion: 0,
      plan: [],
      current: null,
      leaderboard: null,
      gradedThrough: -1,
      createdBy,
      createdAt: Timestamp.now(),
      lastSyncAt: null,
      lastSync: null,
    };
    const batch = db.batch();
    batch.create(db.doc(paths.session(code)), doc);
    try {
      await batch.commit();
      return doc;
    } catch (err) {
      if ((err as { code?: number }).code !== 6) throw err; // 6 = ALREADY_EXISTS: code collision, retry
    }
  }
  throw new QuizError("conflict", "Could not allocate a session code");
}

export async function listSessions(): Promise<SessionDoc[]> {
  const snap = await adminDb().collection(SESSIONS).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => d.data() as SessionDoc);
}

export async function getSession(code: string): Promise<SessionDoc> {
  const snap = await sessionRef(code).get();
  if (!snap.exists) throw new QuizError("not_found", "Session not found");
  return snap.data() as SessionDoc;
}

export function assertEditable(s: Pick<SessionDoc, "status">, message = "Session is locked"): void {
  if (!EDITABLE.has(s.status)) throw new QuizError("invalid_state", message);
}

export async function updateSessionMeta(code: string, patch: { title?: string; requireSubmitted?: boolean }): Promise<SessionDoc> {
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(sessionRef(code));
    if (!snap.exists) throw new QuizError("not_found", "Session not found");
    const s = snap.data() as SessionDoc;
    assertEditable(s);
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    tx.update(snap.ref, clean);
    return { ...s, ...clean };
  });
}

export async function deleteSession(code: string): Promise<void> {
  const s = await getSession(code);
  if (s.status === "live") throw new QuizError("invalid_state", "End the quiz before deleting");
  await adminDb().recursiveDelete(sessionRef(code));
}

export interface ControlResult {
  stateVersion: number;
  status: SessionDoc["status"];
  phase: SessionDoc["phase"];
  currentIndex: number;
}

/**
 * Runs one host action in a transaction. Opening a question copies its public fields into `current`;
 * Show results (and End on an ungraded question) grades every team once and publishes answer, distribution and top 10.
 */
export async function applyControl(
  code: string,
  action: ControlAction,
  now: Date = new Date(),
  expectedVersion?: number,
): Promise<ControlResult> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const sRef = sessionRef(code);
    const snap = await tx.get(sRef);
    if (!snap.exists) throw new QuizError("not_found", "Session not found");
    const s = snap.data() as SessionDoc;
    if (expectedVersion !== undefined && expectedVersion !== s.stateVersion) throw new QuizError("conflict", "State changed, retry");

    const lite: QuestionLite[] = s.plan.map((p, i) => ({ id: p.id, order: i, text: "", options: [], correctIndex: 0, points: 0, timeLimitSec: p.timeLimitSec }));
    const state = sessionStateFromDoc(s);
    const result = applyAction(state, action, lite, now);
    const next: SessionState = { ...state, ...result.patch };

    // ---- reads (all before writes) ----
    const opensQuestion = result.patch.phase === "question" && result.patch.questionOpenedAt !== undefined;
    const openQid = opensQuestion ? s.plan[next.currentIndex].id : null;
    const openQ = openQid ? ((await tx.get(db.doc(paths.question(code, openQid)))).data() as QuestionDoc | undefined) : undefined;
    if (openQid && !openQ) throw new QuizError("not_found", "Question missing");

    const gradeIndex = next.currentIndex;
    // Grades each time an open question ends (results or End). A re-published question replaces its earlier result.
    const needsGrade = (next.phase === "results" || next.status === "ended") && gradeIndex >= 0 && s.status === "live" && s.phase === "question";
    const gradeQid = needsGrade ? s.plan[gradeIndex].id : null;
    const gradeQ = gradeQid ? ((await tx.get(db.doc(paths.question(code, gradeQid)))).data() as QuestionDoc | undefined) : undefined;
    const gradeTeams = gradeQid ? await tx.get(db.collection(paths.teams(code))) : null;

    const clearQid = result.clearAnswersForIndex !== undefined ? s.plan[result.clearAnswersForIndex].id : null;
    const clearAnswers = clearQid ? await tx.get(db.collection(paths.answers(code)).where("questionId", "==", clearQid)) : null;
    const clearTeams = clearQid ? await tx.get(db.collection(paths.teams(code)).where("currentAnswer.qid", "==", clearQid)) : null;

    const resetTeams = result.resetEvent ? await tx.get(db.collection(paths.teams(code))) : null;
    const resetAnswers = result.resetEvent ? await tx.get(db.collection(paths.answers(code))) : null;

    // ---- writes ----
    const update: Record<string, unknown> = { ...toDocPatch(result.patch), stateVersion: s.stateVersion + 1 };
    if (openQid && openQ) {
      update.current = {
        id: openQid,
        index: next.currentIndex,
        text: openQ.text,
        options: openQ.options,
        points: openQ.points,
        timeLimitSec: openQ.timeLimitSec,
        correctIndex: null,
        distribution: null,
      };
    }

    if (resetTeams && resetAnswers) {
      const teamsData = resetTeams.docs.map((d) => d.data() as TeamDoc);
      if (s.startedAt || teamsData.some((t) => t.checkedInAt)) {
        // Keep the rehearsal's results for reference before wiping.
        const runId = `run_${now.getTime()}`;
        tx.set(db.doc(`${paths.session(code)}/runs/${runId}`), {
          runId,
          code,
          title: s.title,
          startedAt: s.startedAt,
          endedAt: s.endedAt ?? Timestamp.fromDate(now),
          leaderboard: s.leaderboard ?? [],
          teams: teamsData
            .filter((t) => t.checkedInAt)
            .map((t) => ({ teamId: t.teamId, teamName: t.teamName, takerEmail: t.takerEmail, score: t.score, rank: t.rank, answeredCount: t.answeredCount, correctCount: t.correctCount, totalTimeMs: t.totalTimeMs })),
          archivedAt: Timestamp.fromDate(now),
        });
      }
      resetAnswers.docs.forEach((d) => tx.delete(d.ref));
      for (const d of resetTeams.docs) {
        const t = d.data() as TeamDoc;
        tx.update(d.ref, { ...emptyTeamState<Timestamp>(), takerEmail: null });
        tx.set(db.doc(paths.counter(code, d.id)), { teamId: d.id, eligible: t.eligible, checkedIn: false, answeredFor: null, answered: false });
      }
      update.current = null;
      update.leaderboard = null;
      update.totalRanked = 0;
      update.gradedThrough = -1;
    }

    if (clearAnswers && clearTeams) {
      clearAnswers.docs.forEach((d) => tx.delete(d.ref));
      clearTeams.docs.forEach((d) => {
        tx.update(d.ref, { currentAnswer: null });
        tx.update(db.doc(paths.counter(code, d.id)), { answeredFor: null, answered: false });
      });
    }

    if (gradeQid && gradeQ && gradeTeams) {
      const teams = gradeTeams.docs.map((d) => d.data() as TeamDoc);
      const out = gradeQuestion(
        { id: gradeQid, index: gradeIndex, correctIndex: gradeQ.correctIndex, points: gradeQ.points, timeLimitSec: gradeQ.timeLimitSec, optionCount: gradeQ.options.length },
        teams.map((t) => ({ teamId: t.teamId, teamName: t.teamName, checkedIn: !!t.checkedInAt, currentAnswer: t.currentAnswer, score: t.score, totalTimeMs: t.totalTimeMs, answeredCount: t.answeredCount, correctCount: t.correctCount, rank: t.rank, previous: t.perQuestion?.[gradeQid] ?? null })),
      );
      const rankOf = new Map(out.standings.map((r) => [r.teamId, r.rank]));
      for (const d of gradeTeams.docs) {
        const u = out.updates.get(d.id);
        if (!u) continue;
        tx.update(d.ref, {
          score: u.score,
          totalTimeMs: u.totalTimeMs,
          answeredCount: u.answeredCount,
          correctCount: u.correctCount,
          rank: rankOf.get(d.id) ?? null,
          prevRank: (d.data() as TeamDoc).rank ?? null,
          lastResult: { qid: gradeQid, optionIndex: u.result.optionIndex, correct: u.result.correct, points: u.result.points, ms: u.result.ms },
          [`perQuestion.${gradeQid}`]: u.result,
        });
      }
      update.gradedThrough = Math.max(s.gradedThrough, gradeIndex);
      update.leaderboard = out.standings.slice(0, LEADERBOARD_SIZE);
      update.totalRanked = out.standings.length;
      // A question closed by End keeps its public fields; reveal the answer on it either way.
      const current = (update.current as SessionDoc["current"]) ?? s.current;
      if (current && current.id === gradeQid) update.current = { ...current, correctIndex: gradeQ.correctIndex, distribution: out.distribution };
    }

    tx.update(sRef, update);
    return { stateVersion: s.stateVersion + 1, status: next.status, phase: next.phase, currentIndex: next.currentIndex };
  });
}

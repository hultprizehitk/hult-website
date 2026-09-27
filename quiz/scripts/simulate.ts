import { performance } from "node:perf_hooks";
import { adminDb, DEMO_PROJECT_ID } from "@/lib/firebase/admin";
import { paths, type QuestionDoc, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import type { ControlAction } from "@/lib/quiz/types";

const BASE = process.env.SIM_BASE_URL ?? "http://localhost:3001";
const CODE = process.env.SIM_CODE ?? "424242";
const ADMIN = "dev.admin@heritageit.edu.in";
const DEVICE_COUNT = 200;
const TEAM_COUNT = 50;
const CLIENTS_PER_TEAM = 4;
const ELIGIBLE = Array.from({ length: 47 }, (_, i) => i + 1);
const mail = (local: string) => `${local}@heritageit.edu.in`;
const pad = (n: number) => String(n).padStart(2, "0");
const lead = (n: number) => mail(`dev.t${pad(n)}.lead`);
const device = (n: number) => `sim-device-${pad(n)}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

if (process.env.GCLOUD_PROJECT !== DEMO_PROJECT_ID || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(`Refusing to simulate outside the ${DEMO_PROJECT_ID} Firestore emulator`);
}

type ApiBody = {
  error?: string;
  message?: string;
  duplicate?: boolean;
  role?: string;
  deviceOk?: boolean;
  teamId?: string;
};
type CallResult = { status: number; data: ApiBody; ms: number };
const failures: string[] = [];
const answerTimes: number[] = [];
const propagationTimes: number[] = [];
const serverErrors: Record<string, number> = {};
let listenerReads = 0;
let joinCalls = 0;
let answerCalls = 0;
let controlCalls = 0;
let latestSession: SessionDoc | null = null;
let stopListeners = () => {};
const versionWaiters = new Map<number, (at: number) => void>();

function check(ok: boolean, label: string): void {
  if (!ok) failures.push(label);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

async function call(path: string, user: string | null, body?: unknown): Promise<CallResult> {
  if (path.endsWith("/join")) joinCalls++;
  if (path.endsWith("/answer")) answerCalls++;
  if (path.endsWith("/control")) controlCalls++;
  const started = performance.now();
  const headers: Record<string, string> = {};
  if (user) headers["x-quiz-dev-user"] = user;
  if (body !== undefined) headers["content-type"] = "application/json";
  try {
    const response = await fetch(`${BASE}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiBody;
    const ms = performance.now() - started;
    if (response.status >= 500) serverErrors[`${path} ${response.status}`] = (serverErrors[`${path} ${response.status}`] ?? 0) + 1;
    return { status: response.status, data, ms };
  } catch (err) {
    serverErrors[`${path} network`] = (serverErrors[`${path} network`] ?? 0) + 1;
    return { status: 0, data: { message: String(err) }, ms: performance.now() - started };
  }
}

function waitForVersion(version: number): Promise<number> {
  if (latestSession && latestSession.stateVersion >= version) return Promise.resolve(performance.now());
  return new Promise((resolve) => versionWaiters.set(version, resolve));
}

function quantile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function createListeners(code: string): () => void {
  const db = adminDb();
  const stops: (() => void)[] = [];
  const initialized: Promise<void>[] = [];
  const onReady = (run: (ready: () => void, fail: (error: Error) => void) => void) => new Promise<void>((resolve, reject) => {
    let readyOnce = false;
    run(() => {
      if (!readyOnce) {
        readyOnce = true;
        resolve();
      }
    }, reject);
  });

  // Model the PRD's worst-case audience: 200 phones, projector, and two admin consoles.
  for (let i = 0; i < DEVICE_COUNT + 2; i++) {
    initialized.push(onReady((ready, fail) => {
      let first = true;
      stops.push(db.doc(paths.session(code)).onSnapshot((snap) => {
        listenerReads += 1;
        if (snap.exists) {
          const data = snap.data() as SessionDoc;
          latestSession = data;
          const receivedAt = performance.now();
          for (const [version, resolve] of versionWaiters) {
            if (data.stateVersion >= version) {
              versionWaiters.delete(version);
              resolve(receivedAt);
            }
          }
        }
        if (first) { first = false; ready(); }
      }, fail));
    }));
  }

  // Four phones per eligible team listen only to their team's document.
  for (const n of ELIGIBLE) {
    for (let phone = 0; phone < CLIENTS_PER_TEAM; phone++) {
      initialized.push(onReady((ready, fail) => {
        let first = true;
        stops.push(db.doc(paths.team(code, `dev-team-${pad(n)}`)).onSnapshot(() => {
          listenerReads += 1;
          if (first) { first = false; ready(); }
        }, fail));
      }));
    }
  }

  // Projector and admin views listen to the split counters; two admins keep one live team list each.
  for (let i = 0; i < 1; i++) {
    initialized.push(onReady((ready, fail) => {
      let first = true;
      stops.push(db.collection(paths.counts(code)).onSnapshot((snap) => {
        listenerReads += first ? snap.size : snap.docChanges().length;
        if (first) { first = false; ready(); }
      }, fail));
    }));
  }
  for (let i = 0; i < 2; i++) {
    initialized.push(onReady((ready, fail) => {
      let first = true;
      stops.push(db.collection(paths.teams(code)).onSnapshot((snap) => {
        listenerReads += first ? snap.size : snap.docChanges().length;
        if (first) { first = false; ready(); }
      }, fail));
    }));
  }

  return () => { void Promise.all(initialized).then(() => stops.forEach((stop) => stop())); };
}

async function main(): Promise<void> {
  const initial = await adminDb().doc(paths.session(CODE)).get();
  if (!initial.exists) throw new Error(`Session #${CODE} is missing. Run "npm run seed" first.`);
  const session = initial.data() as SessionDoc;
  if (session.status !== "lobby") throw new Error(`Session #${CODE} is "${session.status}". Run "npm run seed" first.`);
  const questions: { id: string; data: QuestionDoc }[] = [];
  for (const plan of session.plan) {
    const snap = await adminDb().doc(paths.question(CODE, plan.id)).get();
    if (!snap.exists) throw new Error(`Missing question ${plan.id}`);
    questions.push({ id: plan.id, data: snap.data() as QuestionDoc });
  }

  const wrongTeam = await call(`/api/s/${CODE}/join`, mail("sim.stranger"), { deviceId: "sim-stranger" });
  const unsubmitted = await call(`/api/s/${CODE}/join`, lead(48), { deviceId: device(48) });
  const disqualified = await call(`/api/s/${CODE}/join`, lead(50), { deviceId: device(50) });
  check(wrongTeam.status === 404, "unregistered user is rejected");
  check(unsubmitted.status === 403 && unsubmitted.data.error === "ineligible", "unsubmitted team is rejected");
  check(disqualified.status === 403 && disqualified.data.error === "ineligible", "disqualified team is rejected");

  const joins = await Promise.all(ELIGIBLE.map((n) => call(`/api/s/${CODE}/join`, lead(n), { deviceId: device(n) })));
  const joinFailed = joins.flatMap((j, i) => j.status === 200 && j.data.role === "taker" && j.data.deviceOk ? [] : [{ team: i + 1, status: j.status, ...j.data }]);
  check(joinFailed.length === 0, "47 eligible teams join and bind their taker device");
  if (joinFailed.length) console.error("Join failures:", joinFailed.slice(0, 10));
  if (joinFailed.length) throw new Error(`Stopping load simulation: ${joinFailed.length} eligible teams failed to check in`);
  const mate = await call(`/api/s/${CODE}/join`, mail("dev.t01.m1"), { deviceId: "sim-mate-01" });
  check(mate.status === 200 && mate.data.role === "teammate", "teammate joins as read-only participant");

  stopListeners = createListeners(CODE);
  // Wait for all simulated phones/screens to receive their initial snapshots.
  while (listenerReads < DEVICE_COUNT + 2 + ELIGIBLE.length * CLIENTS_PER_TEAM + TEAM_COUNT + 2 * ELIGIBLE.length) await sleep(25);

  let writes = ELIGIBLE.length * 2; // each team check-in changes its team and private counter shard
  const random = (() => { let state = 0x51d0; return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 0x100000000); })();
  const expected = new Map(ELIGIBLE.map((n) => [n, { score: 0, answered: 0 }]));

  const control = async (action: ControlAction) => {
    const version = (latestSession?.stateVersion ?? session.stateVersion) + 1;
    const before = performance.now();
    const response = await call(`/api/admin/sessions/${CODE}/control`, ADMIN, { ...action, expectedVersion: version - 1 });
    if (response.status !== 200) throw new Error(`control ${action.type} -> ${response.status} ${JSON.stringify(response.data)}`);
    const fired = await waitForVersion(version);
    propagationTimes.push(fired - before);
    writes += 1;
  };

  await control({ type: "start" });

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const opened = latestSession?.questionOpenedAt?.toMillis();
    const closes = latestSession?.questionClosesAt?.toMillis();
    if (!opened || !closes) throw new Error(`Question ${qi + 1} did not open`);

    if (qi === 0) {
      const early = await call(`/api/s/${CODE}/answer`, lead(1), { questionId: q.id, optionIndex: q.data.correctIndex, deviceId: device(1) });
      check(early.status === 409 && early.data.error === "too_early", "answer during lead-in is rejected");
    }
    await sleep(opened + 200 - Date.now());

    const tasks = ELIGIBLE.map(async (n) => {
      if ((q.data.timeLimitSec === 5 && n === 4) || (qi !== 0 || n !== 3) && random() < 0.1) return;
      const correct = random() < 0.7;
      const optionIndex = correct ? q.data.correctIndex : (q.data.correctIndex + 1) % q.data.options.length;
      await sleep(random() * Math.min(900, q.data.timeLimitSec * 1000 - 1200));
      const result = await call(`/api/s/${CODE}/answer`, lead(n), { questionId: q.id, optionIndex, deviceId: device(n) });
      answerTimes.push(result.ms);
      if (result.status !== 200 || result.data.duplicate) {
        failures.push(`Q${qi + 1} team ${n} answer -> ${result.status} ${JSON.stringify(result.data)}`);
        return;
      }
      const tally = expected.get(n)!;
      tally.answered++;
      if (correct) tally.score += q.data.points;
      writes += 3;
    });

    if (qi === 0) {
      const mateTry = await call(`/api/s/${CODE}/answer`, mail("dev.t01.m1"), { questionId: q.id, optionIndex: 0, deviceId: "sim-mate-01" });
      const wrongDevice = await call(`/api/s/${CODE}/answer`, lead(2), { questionId: q.id, optionIndex: 0, deviceId: "sim-wrong-device" });
      check(mateTry.status === 403 && mateTry.data.error === "not_taker", "teammate cannot submit an answer");
      check(wrongDevice.status === 403 && wrongDevice.data.error === "wrong_device", "unbound device cannot submit an answer");
    }
    await Promise.all(tasks);
    if (qi === 0) {
      const duplicate = await call(`/api/s/${CODE}/answer`, lead(3), { questionId: q.id, optionIndex: 0, deviceId: device(3) });
      check(duplicate.status === 200 && duplicate.data.duplicate === true, "duplicate submit retains the first answer");
      if (duplicate.status !== 200 || duplicate.data.duplicate !== true) throw new Error(`Stopping load simulation: duplicate answer check failed (${duplicate.status})`);
    }
    await control({ type: "close_now" });

    if (q.data.timeLimitSec === 5) {
      await sleep(ANSWER_GRACE_MS + 100);
      const late = await call(`/api/s/${CODE}/answer`, lead(4), { questionId: q.id, optionIndex: q.data.correctIndex, deviceId: device(4) });
      check(late.status === 409 && late.data.error === "too_late", "answer after close plus grace is rejected");
    }

    await control({ type: "reveal" });
    writes += ELIGIBLE.length; // one grading update per checked-in team
    if (qi < questions.length - 1) {
      await control({ type: "show_leaderboard" });
      await control({ type: "next" });
    }
  }
  await control({ type: "end" });

  const teamDocs = await adminDb().collection(paths.teams(CODE)).get();
  const checkedIn = teamDocs.docs.map((d) => d.data() as TeamDoc).filter((t) => t.checkedInAt);
  const mismatches = ELIGIBLE.filter((n) => {
    const team = checkedIn.find((t) => t.teamName === `Dev Team ${pad(n)}`);
    return !team || team.score !== expected.get(n)?.score || team.answeredCount !== expected.get(n)?.answered;
  });
  check(checkedIn.length === 47, "standings include all 47 checked-in teams");
  check(mismatches.length === 0, `server scores match the simulator tally (${mismatches.length} mismatches)`);
  const ended = (await adminDb().doc(paths.session(CODE)).get()).data() as SessionDoc;
  check(ended.status === "ended" && ended.leaderboard?.length === 10, "end publishes the final top 10 leaderboard");

  const exportResponse = await fetch(`${BASE}/api/admin/sessions/${CODE}/export`, { headers: { "x-quiz-dev-user": ADMIN } });
  const csv = await exportResponse.text();
  check(exportResponse.status === 200 && csv.trim().split("\n").length === 48, "CSV export has header and 47 teams");

  // Approximate server-side Firestore reads: member lookup query + session/team docs per join or answer, session per control,
  // question+teams per reveal, questions opened, and session+teams for CSV. Listener reads use actual callback counts.
  const serverReadEstimate = joinCalls * 3 + answerCalls * 3 + controlCalls + questions.length * 49 + 48;
  const projectedReads = listenerReads + serverReadEstimate;

  // Listener reads are counted at the target audience size. Writes include check-ins, answers, grading and controls.
  check(quantile(propagationTimes, 95) < 1000, `Firestore host-action propagation p95 < 1 s (${quantile(propagationTimes, 95).toFixed(0)} ms)`);
  check(quantile(answerTimes, 95) < 1000, `answer API latency p95 < 1 s (${quantile(answerTimes, 95).toFixed(0)} ms)`);
  check(projectedReads <= 35_000, `worst-case read projection <= 35k (${projectedReads.toLocaleString()} reads)`);
  check(writes <= 10_000, `write projection <= 10k (${writes.toLocaleString()} writes)`);
  check(Object.keys(serverErrors).length === 0, `no 5xx or network errors ${JSON.stringify(serverErrors)}`);

  console.log("\nLoad summary");
  console.log(`Audience: ${DEVICE_COUNT} phones, projector, board and 2 admin consoles`);
  console.log(`Listener reads: ${listenerReads.toLocaleString()} (worst-case audience simulated directly)`);
  console.log(`Server read estimate: ${serverReadEstimate.toLocaleString()}`);
  console.log(`Projected total reads: ${projectedReads.toLocaleString()}`);
  console.log(`Estimated writes: ${writes.toLocaleString()}`);
  console.log(`Propagation p50/p95: ${quantile(propagationTimes, 50).toFixed(0)}/${quantile(propagationTimes, 95).toFixed(0)} ms`);
  console.log(`Answer p50/p95: ${quantile(answerTimes, 50).toFixed(0)}/${quantile(answerTimes, 95).toFixed(0)} ms`);
  stopListeners();
  console.log(failures.length ? `\n${failures.length} FAILURE(S)` : "\nALL CHECKS PASSED");
  for (const failure of failures) console.log(` - ${failure}`);
  process.exitCode = failures.length ? 1 : 0;
}

const ANSWER_GRACE_MS = 750;
main().catch((err) => {
  stopListeners();
  console.error(err);
  process.exitCode = 1;
});

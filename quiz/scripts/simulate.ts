import { performance } from "node:perf_hooks";
import type { AdminSessionView, ControlAction, StateResponse } from "@/lib/quiz/types";

const BASE = process.env.SIM_BASE_URL ?? "http://localhost:3001";
const CODE = process.env.SIM_CODE ?? "424242";
const ADMIN = "dev.admin@heritageit.edu.in";
const TEAM_COUNT = 50;
const ELIGIBLE = Array.from({ length: 47 }, (_, i) => i + 1);

const mail = (local: string) => `${local}@heritageit.edu.in`;
const pad = (n: number) => String(n).padStart(2, "0");
const lead = (n: number) => mail(`dev.t${pad(n)}.lead`);
const device = (n: number) => `sim-device-${pad(n)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

type Kind = "state" | "join" | "answer" | "admin";
const latency: Record<Kind, number[]> = { state: [], join: [], answer: [], admin: [] };
const serverErrors: Record<string, number> = {};
const failures: string[] = [];

function check(ok: boolean, label: string): void {
  if (!ok) failures.push(label);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

interface ApiBody {
  error?: string;
  message?: string;
  duplicate?: boolean;
  role?: string;
  deviceOk?: boolean;
}

async function call<T = ApiBody>(kind: Kind, user: string | null, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const t0 = performance.now();
  const headers: Record<string, string> = {};
  if (user) headers["x-quiz-dev-user"] = user;
  if (body !== undefined) headers["content-type"] = "application/json";
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    latency[kind].push(performance.now() - t0);
    const data = (await res.json().catch(() => ({}))) as T;
    if (res.status >= 500) serverErrors[`${kind} ${res.status}`] = (serverErrors[`${kind} ${res.status}`] ?? 0) + 1;
    return { status: res.status, data };
  } catch {
    serverErrors[`${kind} network`] = (serverErrors[`${kind} network`] ?? 0) + 1;
    return { status: 0, data: {} as T };
  }
}

let offset = 0;
const serverNow = () => Date.now() + offset;

async function adminView(): Promise<AdminSessionView> {
  const sent = Date.now();
  const { status, data } = await call<AdminSessionView & ApiBody>("admin", ADMIN, `/api/admin/sessions/${CODE}`);
  if (status !== 200) throw new Error(`admin view -> ${status} ${JSON.stringify(data)}`);
  offset = data.serverNow - (sent + Date.now()) / 2;
  return data;
}

async function control(action: ControlAction): Promise<void> {
  const r = await call("admin", ADMIN, `/api/admin/sessions/${CODE}/control`, action);
  if (r.status !== 200) throw new Error(`control ${action.type} -> ${r.status} ${JSON.stringify(r.data)}`);
}

const answer = (user: string, questionId: string, optionIndex: number, deviceId: string) =>
  call("answer", user, `/api/s/${CODE}/answer`, { questionId, optionIndex, deviceId });

function pct(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function main() {
  // Warm up dev-mode route compilation, then discard those timings.
  await call("state", null, `/api/s/${CODE}/state`);
  await call("join", mail("sim.warmup"), `/api/s/${CODE}/join`, { deviceId: "sim-warmup-1" });
  await call("answer", mail("sim.warmup"), `/api/s/${CODE}/answer`, {});
  const initial = await adminView();
  (Object.keys(latency) as Kind[]).forEach((k) => (latency[k] = []));

  if (initial.session.status !== "lobby") throw new Error(`Session #${CODE} is "${initial.session.status}". Run "npm run seed" first.`);
  const questions = initial.questions;
  const lateQ = questions.findIndex((q) => q.timeLimitSec === 5);
  const LATE_TEAM = 4;

  check((await call("join", mail("sim.stranger"), `/api/s/${CODE}/join`, { deviceId: "sim-stranger-1" })).status === 404, "unregistered user cannot join");
  check((await call("join", lead(48), `/api/s/${CODE}/join`, { deviceId: device(48) })).status === 403, "unsubmitted team is ineligible");
  check((await call("join", lead(50), `/api/s/${CODE}/join`, { deviceId: device(50) })).status === 403, "disqualified team is ineligible");

  const joins = await Promise.all(ELIGIBLE.map((n) => call("join", lead(n), `/api/s/${CODE}/join`, { deviceId: device(n) })));
  check(joins.every((j) => j.status === 200 && j.data.role === "taker" && j.data.deviceOk), "47 eligible leads check in as takers on bound devices");
  const mate = await call("join", mail("dev.t01.m1"), `/api/s/${CODE}/join`, { deviceId: "sim-mate-01" });
  check(mate.status === 200 && mate.data.role === "teammate", "teammate joins as teammate");

  let polling = true;
  const pollers = Array.from({ length: TEAM_COUNT }, (_, i) =>
    (async () => {
      await sleep(Math.random() * 1000);
      while (polling) {
        const t = Date.now();
        await call("state", lead(i + 1), `/api/s/${CODE}/state?d=${device(i + 1)}`);
        await sleep(1000 - (Date.now() - t));
      }
    })(),
  );

  const expectedScore = new Map(ELIGIBLE.map((n) => [n, 0]));
  const expectedAnswered = new Map(ELIGIBLE.map((n) => [n, 0]));

  await control({ type: "start" });

  for (let qi = 0; qi < questions.length; qi++) {
    let view = await adminView();
    const q = questions[qi];
    const openedAt = view.session.questionOpenedAt!;
    let closesAt = view.session.questionClosesAt!;
    check(view.session.currentIndex === qi && view.session.phase === "question", `Q${qi + 1} opened`);

    if (qi === 0) {
      const early = await answer(lead(1), q.id, 0, device(1));
      check(early.status === 409 && early.data.error === "too_early", "answer during lead-in is rejected");
    }

    const windowMs = Math.min(q.timeLimitSec * 1000 - 1000, 6000);
    const tasks: Promise<void>[] = ELIGIBLE.map(async (n) => {
      if (qi === lateQ && n === LATE_TEAM) return;
      if (Math.random() < 0.1 && !(qi === 0 && n === 3)) return;
      const correct = Math.random() < 0.7;
      const optionIndex = correct ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
      await sleep(openedAt + 300 + Math.random() * windowMs - serverNow());
      const r = await answer(lead(n), q.id, optionIndex, device(n));
      if (r.status === 200 && !r.data.duplicate) {
        expectedAnswered.set(n, expectedAnswered.get(n)! + 1);
        if (correct) expectedScore.set(n, expectedScore.get(n)! + q.points);
      } else {
        failures.push(`Q${qi + 1} team ${n} answer -> ${r.status} ${JSON.stringify(r.data)}`);
      }
    });

    if (qi === 0) {
      await sleep(openedAt + 200 - serverNow());
      const mateTry = await answer(mail("dev.t01.m1"), q.id, 0, "sim-mate-01");
      check(mateTry.status === 403 && mateTry.data.error === "not_taker", "teammate cannot answer");
      const wrongDevice = await answer(lead(2), q.id, 0, "sim-wrong-device");
      check(wrongDevice.status === 403 && wrongDevice.data.error === "wrong_device", "taker on another device is rejected");
      await control({ type: "extend", seconds: 5 });
      view = await adminView();
      check(view.session.questionClosesAt === closesAt + 5000, "extend adds 5s");
      closesAt = view.session.questionClosesAt!;
    }

    if (qi === lateQ) {
      tasks.push(
        (async () => {
          await sleep(closesAt + 1500 - serverNow());
          const late = await answer(lead(LATE_TEAM), q.id, q.correctIndex, device(LATE_TEAM));
          check(late.status === 409 && late.data.error === "too_late", "answer after close + grace is rejected");
        })(),
      );
    }

    await Promise.all(tasks);

    if (qi === 0) {
      const dup = await answer(lead(3), q.id, (q.correctIndex + 1) % q.options.length, device(3));
      check(dup.status === 200 && dup.data.duplicate === true, "double submit is idempotent and keeps the first answer");
    }

    if (serverNow() < closesAt - 1000) await control({ type: "close_now" });
    else await sleep(closesAt + 800 - serverNow());
    await control({ type: "reveal" });
    const pub = await call<StateResponse>("state", null, `/api/s/${CODE}/state`);
    check(pub.data.question?.correctIndex === q.correctIndex, `Q${qi + 1} reveal exposes the correct answer`);
    await sleep(400);
    await control({ type: "show_leaderboard" });
    await sleep(400);
    if (qi < questions.length - 1) await control({ type: "next" });
  }

  await control({ type: "end" });
  polling = false;
  await Promise.all(pollers);

  const final = await adminView();
  check(final.session.status === "ended", "quiz ended");
  check(final.standings.length === 47, "standings include all 47 checked-in teams");
  const byName = new Map(final.standings.map((s) => [s.teamName, s]));
  const mismatches = ELIGIBLE.filter((n) => {
    const s = byName.get(`Dev Team ${pad(n)}`);
    return !s || s.score !== expectedScore.get(n) || s.answeredCount !== expectedAnswered.get(n);
  });
  check(mismatches.length === 0, `server scores match client-side expectation (${mismatches.length} mismatches)`);
  const sorted = final.standings.every(
    (s, i, a) => i === 0 || a[i - 1].score > s.score || (a[i - 1].score === s.score && a[i - 1].totalTimeMs <= s.totalTimeMs),
  );
  check(sorted, "standings sorted by score desc, then time asc");

  const pub = await call<StateResponse>("state", null, `/api/s/${CODE}/state`);
  check(pub.data.leaderboard?.length === 10 && pub.data.leaderboard[0].teamName === final.standings[0].teamName, "public leaderboard shows top 10");

  const csvRes = await fetch(`${BASE}/api/admin/sessions/${CODE}/export`, { headers: { "x-quiz-dev-user": ADMIN } });
  const csv = await csvRes.text();
  check(csvRes.status === 200 && csv.trim().split("\n").length === 48, "CSV export has header + 47 rows");

  check(Object.keys(serverErrors).length === 0, `no 5xx or network errors ${JSON.stringify(serverErrors)}`);
  check(pct(latency.state, 95) < 500, `state p95 < 500ms (${pct(latency.state, 95).toFixed(0)}ms)`);
  check(pct(latency.answer, 95) < 1000, `answer p95 < 1000ms (${pct(latency.answer, 95).toFixed(0)}ms)`);

  console.log("\nLatency (ms)");
  for (const k of Object.keys(latency) as Kind[]) {
    const a = latency[k];
    console.log(`${k.padEnd(7)} n=${String(a.length).padStart(5)}  p50=${pct(a, 50).toFixed(0).padStart(5)}  p95=${pct(a, 95).toFixed(0).padStart(5)}  max=${pct(a, 100).toFixed(0).padStart(5)}`);
  }
  console.log(failures.length ? `\n${failures.length} FAILURE(S)` : "\nALL CHECKS PASSED");
  for (const f of failures) console.log(` - ${f}`);
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

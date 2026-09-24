# Hult Prize Live Quiz — Design Spec

**Date:** 2026-09-24
**Owner:** Aheen
**App:** `quiz/` (standalone Next.js 16.3.1 app, same MongoDB as `client-v3`)
**Source requirements:** `Hult Prize Quiz — Requirements Doc.md` (v0.2), adapted from Firebase to MongoDB.
**UX reference:** Slido (quiz mode).
**Implementation plan:** `docs/superpowers/plans/2026-09-24-quiz.md`

---

## 1. Decisions

| # | Topic | Decision | Source |
|---|---|---|---|
| D1 | Database | MongoDB, the same `MONGODB_URI` as `client-v3`. The quiz **reads** `users`, `teams`, and `events`, and **writes** only its own `quiz*` collections. | User |
| D2 | App location | `quiz/`, a standalone app. Dev port **3001**, so it can run beside `client-v3` on 3000. | User |
| D3 | UX | Slido quiz clone: join by code, one question at a time, big tappable option bars, timer, reveal with result bars, leaderboard between questions, projector view, presenter console. | User |
| D4 | UI kit | shadcn/ui (Tailwind v4) + motion-primitives (`motion` package) + lucide-react. | User |
| D5 | Theme | Hult pink and black. Background `#000000`, card `#09090b`, primary `#f20089`, accent `#a855f7`, font Google Sans (copied from `client-v3/public/fonts`). | User |
| D6 | Pacing | **Host-paced, per-question timer** (the Slido model). The host opens each question, and every team sees it at the same server instant. | Default: Slido behaviour. The PRD's "all start simultaneously" holds per question. |
| D7 | Question delivery | One question at a time from the server. A question is not sent before it opens, and its `correctIndex` is never sent before the reveal. | Default (PRD §4 safer option) |
| D8 | Timer | Per question, `timeLimitSec` (default 20, range 5–120). A 3 s lead-in countdown before each question. | Default |
| D9 | Points | Fixed `points` per question (default 100, range 1–1000). Correct gives `points`, wrong or none gives 0. No speed bonus. | PRD §5 |
| D10 | Tie-break time | `totalTimeMs` = sum over **closed** questions of the response time (`answeredAt − openedAt`, server clock). An unanswered question counts as the full `timeLimitSec × 1000`. Lower wins. | Default (PRD §5 "cleanest", adapted to per-question) |
| D11 | Exact tie | Shared rank (competition ranking: 1, 1, 3). | Default |
| D12 | Check-in | Per team. **Any** team member who opens the session link or QR while check-in is open checks the team in. | PRD §2 recommendation |
| D13 | Quiz taker | Defaults to the team **lead**. The lead can switch it to any member while the session is in `lobby`. It locks when the quiz starts. | PRD §3, simplified |
| D14 | Backup taker | An admin can reassign the taker and reset the bound device at any time. Answers already submitted stay. | Default (PRD §7) |
| D15 | Single device | The taker's first device is bound (`deviceId`). Other devices get "active on another device". Only an admin can reset it. | Default (PRD §7) |
| D16 | Answer changes | The first answer is final (same as a Slido quiz). | Default |
| D17 | Leaderboard access | `/present/[code]` is public (no login) and projectable. It shows top 10 by team name. Phones show top 10 plus a "your team" card with rank and score. | PRD §6 recommendations |
| D18 | Eligible teams | `Team.eventId == session.eventId` and `status == "confirmed"`. If `session.requireSubmitted` (default true), also `submissionStatus == "submitted"`. | Default |
| D19 | Real-time | **Polling**: `GET /api/s/[code]/state` every 1000 ms while the tab is visible. Every response carries `serverNow`, and clients correct their clock offset from it. No SSE, which is safe on serverless or multi-instance hosting. | Default |
| D24 | DB load | Each server instance caches a per-session snapshot (session, questions, quiz teams, answers, eligible count) for 750 ms, and writes invalidate it. That's about 7 queries/s regardless of client count, which is safe on an Atlas shared tier. | Default |
| D20 | Anti-cheat | Proctors plus cheap technical guards: server-side grading, a single taker, a single device, no early question delivery, and a strict close time (+750 ms network grace). No copy-paste blocking. | PRD §7 |
| D21 | Auth | NextAuth v5 (`5.0.0-beta.32`, same as `client-v3`), Google provider, `@heritageit.edu.in` only, JWT sessions. Admin = the `ADMIN_EMAILS` env var or `User.role` in `junior_admin | lead_admin | master_admin`. | Mirrors `client-v3/auth.ts` |
| D22 | Dev and test identity | When `QUIZ_DEV_LOGIN=true` **and** `NODE_ENV !== "production"`, a Credentials "dev login" provider and an `x-quiz-dev-user` header are accepted. They are used by the seed and simulation scripts. | Needed for the 50-client load test |
| D23 | Test data | `scripts/seed-dev.ts` creates a dev Event, 50 dev teams, and one session with 15 edge-case MCQs **in the database**. It refuses to run unless `ALLOW_DEV_SEED=true` **and** the database name is not `hult-website` (the live site's DB). Local dev uses the `hult-quiz-dev` database on the same cluster. | User ("random 10–20 MCQs") + "no hardcoded mock data" rule |

External dependency: the Google OAuth client must list `http://localhost:3001/api/auth/callback/google` and the production quiz URL (assumed `https://quiz.hultprizehitk.live/api/auth/callback/google`) as authorized redirect URIs. Whoever owns the Google Cloud project has to add these.

---

## 2. Architecture

```
Browser (phone / projector / admin laptop)
   │  poll GET /api/s/[code]/state (1s)      POST /api/s/[code]/{join,taker,answer}
   ▼
quiz/ Next.js 16 route handlers  ── thin: auth → validate → call service → JSON
   ▼
lib/quiz/*  services + pure logic (engine, scoring, views)   ◄── unit tested (Vitest)
   ▼
MongoDB (shared cluster)
   read-only : users, teams, events          (mirror models, same collection names)
   quiz-owned: quizsessions, quizquestions, quizteams, quizanswers
```

**Pure modules** (no I/O, fully unit-tested): `engine.ts` (state machine), `scoring.ts` (standings), `views.ts` (payload sanitizing), `clock.ts` (offset maths), `validation.ts`.
**Service modules** (Mongo I/O, tested against `mongodb-memory-server`): `sessions.ts`, `questions.ts`, `teams.ts`, `answers.ts`, `state.ts`.

---

## 3. Data model (Mongoose)

**QuizSession** (`quizsessions`)
- `code` string, 6 digits, unique
- `title` string
- `eventId` ObjectId (ref `Event`)
- `status`: `draft | lobby | live | ended`
- `checkinOpen` bool
- `requireSubmitted` bool (default true)
- `currentIndex` number (−1 before the first question)
- `phase`: `idle | question | reveal | leaderboard`
- `questionOpenedAt` Date?
- `questionClosesAt` Date?
- `startedAt` Date?
- `endedAt` Date?
- `stateVersion` number (optimistic concurrency, incremented on every transition)
- `createdBy` string
- timestamps

**QuizQuestion** (`quizquestions`)
- `sessionId`, `order`, `text` (1–300 chars)
- `options` string[2..6] (each 1–120 chars)
- `correctIndex`
- `points` (1–1000, default 100)
- `timeLimitSec` (5–120, default 20)
- Index `{sessionId, order}`

**QuizTeam** (`quizteams`): a snapshot per session and team, created at check-in
- `sessionId`, `teamId`, `teamName`, `teamCode`, `leadEmail`
- `members` {name, email}[] and `memberEmails` string[] (lead + members, lowercase)
- `checkedInAt`, `checkedInBy`
- `takerEmail`
- `deviceId`? , `deviceBoundAt`?
- Unique index `{sessionId, teamId}`

**QuizAnswer** (`quizanswers`)
- `sessionId`, `teamId`, `questionId`, `questionIndex`, `takerEmail`
- `optionIndex`, `isCorrect`, `pointsAwarded`, `responseMs`, `answeredAt`
- Unique index `{sessionId, teamId, questionId}`. This is the database-level guarantee for "one answer per team per question".

Mapping from the PRD's Firestore model: `quizEvents` → QuizSession, `checkins` → QuizTeam.checkedInAt, `quizAnswers` → QuizAnswer, `quizResults` → computed on read by `scoring.computeStandings`. At about 50 teams × 20 questions there's no need to store it. The CSV export freezes it.

---

## 4. State machine (`engine.ts`)

`LEAD_IN_MS = 3000`, `ANSWER_GRACE_MS = 750`.

| Action | Allowed from | Effect |
|---|---|---|
| `open_lobby` | draft | status=lobby, checkinOpen=true |
| `toggle_checkin` | lobby | checkinOpen = !checkinOpen |
| `start` | lobby, with ≥1 question | status=live, checkinOpen=false, startedAt=now, open question 0 |
| `next` | live, phase reveal or leaderboard, not the last question | open question currentIndex+1 |
| `close_now` | live, phase question, still open | questionClosesAt = now (and ≥ openedAt) |
| `extend` (seconds 5–60) | live, phase question, still open | questionClosesAt += seconds |
| `restart_question` | live, phase question | delete this question's answers, reopen with lead-in (the PRD's "reissue start signal") |
| `reveal` | live, phase question | if still open, close it at now; phase=reveal |
| `show_leaderboard` | live, phase reveal | phase=leaderboard |
| `end` | lobby or live | status=ended, phase=leaderboard, endedAt=now, checkinOpen=false |

"Open question i" means: currentIndex=i, phase=question, openedAt=now+LEAD_IN_MS, closesAt=openedAt+timeLimitSec×1000.
Every transition is `findOneAndUpdate({_id, stateVersion})` → `$inc stateVersion`. A stale version (a double click, or two admins) returns 409.

---

## 5. Answer rules (`answers.ts`)

An answer is rejected (4xx, with a short error code) unless **all** of these hold:
- the session is live and phase=question
- the questionId matches the current question
- `openedAt ≤ now ≤ closesAt + ANSWER_GRACE_MS`
- the user is the team's `takerEmail`
- the request's `deviceId` equals the bound `deviceId`
- `optionIndex` is in range
- there is no existing answer. A duplicate returns 200 with `duplicate: true` and the stored first answer (idempotent retries)

`responseMs = clamp(now − openedAt, 0, timeLimitMs)`. Participant-visible scores (`me.standing`, leaderboard) only count **revealed** questions, so a phone can't learn correctness before the reveal. The admin view counts every closed question.

---

## 6. Views (`views.ts`)

`GET /api/s/[code]/state` returns:
- `serverNow`, `stateVersion`, `status`, `phase`, `title`, `code`, `questionCount`, `currentIndex`, `checkinOpen`
- `question`: `{id, index, text, options, points, timeLimitSec, openedAt, closesAt, correctIndex}`. It is null before the first question. During the 3 s lead-in, `text` and `options` are null (only the index and timer are sent). `correctIndex` is null until reveal, leaderboard, or ended.
- `counts`: `{checkedIn, eligible, answered}`
- `distribution`: number[] (only in reveal)
- `leaderboard`: top 10 `{rank, teamName, score, totalTimeMs}` (only in leaderboard or ended)
- `me` (only when signed in): `{email, role: "taker" | "teammate" | "unregistered" | "ineligible", team?: {id, name, code, takerEmail, isLead, members}, checkedIn, deviceOk, answer?: {optionIndex, isCorrect?, pointsAwarded?}, standing?: {rank, score, totalTimeMs}}`. `isCorrect` and `pointsAwarded` are hidden until reveal.

---

## 7. Screens (Slido-mapped)

| Route | Who | Slido equivalent | Contents |
|---|---|---|---|
| `/` | anyone | slido.com "Enter code" | Big code input (`#` prefix, 6 digits) → `/s/[code]` |
| `/signin` | anyone | — | One Google button; the dev-login form when enabled |
| `/s/[code]` | participant | audience app | States: sign-in required, not registered, ineligible, check-in closed, **lobby** (team card, taker badge, lead's taker picker), **lead-in** (3-2-1), **question** (taker: tappable options + countdown; teammate: read-only + "X is answering"), **answered** ("Answer locked"), **reveal** (correct/incorrect, points, bars), **leaderboard** (top 10 + own card), **ended** (final rank) |
| `/present/[code]` | projector (public) | presenter view | Lobby: join code, QR, checked-in counter. Question: big text, options, countdown ring, answered x/y. Reveal: animated result bars, correct option highlighted. Leaderboard: animated top 10. Ended: podium + top 10 |
| `/admin` | admin | Slido admin event list | Session list, create session (title, event dropdown, requireSubmitted) |
| `/admin/s/[code]` | admin | Slido presenter controls | Tabs: **Live** (control bar, state, current question, answered count, live standings), **Questions** (CRUD + reorder, locked once live), **Teams** (eligible teams, checked-in, taker, device, answered current; manual check-in, reassign taker, reset device), **Export** CSV |

Copy rule: micro-labels only, no emojis, lucide icons.

---

## 8. Error handling

- Every route handler returns `{error: "<code>", message: "<short>"}` with a proper status. Codes: `unauthenticated`, `forbidden`, `not_found`, `invalid_input`, `invalid_state`, `conflict`, `not_registered`, `ineligible`, `checkin_closed`, `not_lead`, `not_taker`, `wrong_device`, `too_early`, `too_late`, `no_questions`, `last_question`, `server_error`.
- The client polling hook uses exponential backoff on failure (1s → 2s → 4s → max 8s). It shows a "Reconnecting" pill and keeps the last good state.
- An answer POST is retried once on a network error. A duplicate is a 200 success (idempotent).
- After a refresh or reconnect, the phone rebuilds entirely from `/state` (persisted server-side), so there's no local quiz state to lose.

---

## 9. Testing

- **Unit (Vitest):** engine transitions (every allowed and denied pair), scoring (ties, shared ranks, unanswered penalty), views (no leak of correctIndex), clock offset, validation.
- **Service (Vitest + mongodb-memory-server):** check-in eligibility, taker rules, device binding, answer acceptance and rejection matrix, concurrent answer race (unique index), transition concurrency (409).
- **Simulation / load (`scripts/simulate.ts`):** 50 virtual teams poll at 1 Hz, and each answers every question with a random delay and correctness, against a running dev server. It reports p50/p95 latency and error counts, and checks the final standings against a locally computed expectation.
- **Manual dry run:** checklist in `docs/quiz-runbook.md`.

---

## 10. Docs

- `docs/quiz-runbook.md`: env setup, seeding, event-day checklist, and recovery procedures for each PRD §7 edge case.
- Update `docs/README.md` (index row) and `aheen.md`.
- Every major bug solved gets a case study in `docs/` (per team guideline).

## 11. Out of scope (YAGNI)

Speed-bonus scoring, per-team custom question order, question images, multi-select questions, SSE/websockets, Firebase, editing the main site's Team or Event data, and i18n.

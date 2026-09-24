# Quiz Runbook

A live, Slido-style quiz app in `quiz/`. The design is in `docs/superpowers/specs/2026-09-24-quiz-design.md`, and the build plan is in `docs/superpowers/plans/2026-09-24-quiz.md`.

Routes:
- `/` — join by code
- `/s/<code>` — phone
- `/present/<code>` — projector (public)
- `/admin` — console (admins only)

## Environment (`quiz/.env.local`, git-ignored)

| Var | Purpose | Deployed value |
|---|---|---|
| `MONGODB_URI` | Same cluster as the site. Dev uses db `hult-quiz-dev`; event day uses `hult-website` | `.../hult-website?...` |
| `AUTH_SECRET` | NextAuth JWT secret | set |
| `AUTH_URL` | Public URL of the quiz app | e.g. `https://quiz.hultprizehitk.live` |
| `AUTH_TRUST_HOST` | Needed behind a proxy | `true` |
| `GOOGLE_CLIENT_ID/SECRET` | Same OAuth client as the site | set |
| `ADMIN_EMAILS` | Comma-separated super admins. DB roles `junior/lead/master_admin` also get in | set |
| `QUIZ_DEV_LOGIN` | Dev login box + `x-quiz-dev-user` header (development only) | **unset** |
| `ALLOW_DEV_SEED` | Allows `npm run seed` (always refused on `hult-website`) | **unset** |
| `QUIZ_UNSAFE_LOADTEST_DEV_LOGIN` | Shell-only, for load-testing a local `npm run start`. **Never** on a server | **never** |

Google Cloud Console, then the OAuth client, then Authorized redirect URIs: add `http://localhost:3001/api/auth/callback/google` and `https://<quiz-domain>/api/auth/callback/google`. Until someone does this, only dev login works locally.

## Local development

```bash
cd quiz
npm install
npm run dev        # http://localhost:3001 (webpack; see exFAT note)
npm run seed       # dev event, 50 teams (47 eligible), session #424242, 15 edge-case questions
npm test           # 84 unit + service tests (in-memory MongoDB)
```

Dev logins (the dev box on `/signin`):
- `dev.admin@heritageit.edu.in` — admin
- `dev.tNN.lead@heritageit.edu.in` — lead of team NN
- `dev.tNN.m1..m3@heritageit.edu.in` — members

**exFAT / external drive:** the repo currently lives on an exFAT SSD. Turbopack can't run there, and `next build` needs the readlink patch. Both are handled by the npm scripts. Also **stop `npm run dev` before a rebase or other large git operation**. See `docs/case-study-turbopack-exfat-junctions.md`.

## Load test (before the event)

```bash
npm run build
QUIZ_UNSAFE_LOADTEST_DEV_LOGIN=true npm run start   # production server on :3001 (PowerShell: $env:QUIZ_UNSAFE_LOADTEST_DEV_LOGIN="true"; npm run start)
npm run seed
npm run simulate                                     # 50 teams x 15 questions, correctness + latency checks
```

This runs 50 simulated teams through all 15 questions and checks correctness and latency. Result on 2026-09-24, run from a laptop about 94 ms from Atlas, against a production build: **ALL CHECKS PASSED**.

| Endpoint | p50 | p95 |
|---|---|---|
| state poll | 20 ms | 377 ms |
| answer | 281 ms | 463 ms |
| admin control | 366 ms | 809 ms |

Scores for all 47 teams matched the simulator's own tally exactly, and there were 0 server errors. Re-run on venue wifi and record the numbers here.

## Before the event

1. `/admin`, then **New session**. Pick the real event and keep "Submitted teams only" on.
2. **Questions** tab: add questions (2–6 options, points 1–1000, 5–120 s). Tap a letter to mark the answer. Questions lock at Start.
   Or use **Import CSV** to load many at once (see below).
3. **Teams** tab: check the eligible count matches the registrations.
4. Open `/present/<code>` on the projector laptop (full screen).
5. Dry run on venue wifi with 3+ real phones.

## Importing questions from CSV

Go to **Console → Questions → Import CSV** and choose a file. The dialog's **Template** button downloads a blank one. Google Sheets or Excel work fine: use File → Download → CSV.

| Column | Required | Notes |
|---|---|---|
| `question` | yes | 1–300 characters |
| `a`, `b` | yes | Options, 1–120 characters each |
| `c` … `f` | no | Fill left to right with no gaps; up to 6 options |
| `answer` | yes | A letter (`B`) **or** the exact option text (`Kolkata`, `17`). A number is read as option text, not a position |
| `points` | no | 1–1000, default 100 |
| `seconds` | no | 5–120, default 20 |

Header variants also work: `Option A`, `Correct`, `Time`, `Text`, and so on. Commas inside a cell need the cell in quotes, which spreadsheets do automatically.

The file is checked first, and the dialog shows either a preview or **row-numbered errors**. **Nothing is imported unless every row is valid.** Choose **Add to existing** or **Replace all**. You can import only before the quiz starts, and at most 200 questions per file.

## Event-day flow

| Step | Admin console | Projector | Phones |
|---|---|---|---|
| Doors open | Open lobby | QR + `#code` + check-in counter | Scan QR, sign in, auto check-in |
| Before start | Teams tab: watch check-ins | | The lead can switch the taker in the lobby |
| Go | **Start quiz** (confirm) | 3-2-1, then the question | The taker answers; teammates follow along |
| Each question | +15s or Close now, then **Reveal**, then **Leaderboard**, then **Next question** | Timer and answered x/y, then result bars, then top 10 | Result, then own rank |
| Finish | **End quiz**, then **Export CSV** | Podium + ranks 4–10 | Final rank |

## Recovery playbook (PRD section 7)

| Situation | Action |
|---|---|
| Phone refreshed / app closed | Nothing to do. State lives on the server; reopen the same link |
| Taker's phone died | Teams tab: **Reset** device. The taker signs in on any phone and continues |
| Taker unavailable | Teams tab: change **Taker** to another member (answers so far are kept) |
| Phone says "Active on another device" | Teams tab: **Reset** device for that team |
| Team missed check-in | Teams tab: **Check in** (works while live; they join from the current question) |
| Question glitch / wrong start | **Restart question** (deletes that question's answers, reopens with the lead-in) |
| Need more time | **+15s** (repeatable while open) |
| Close clicked as the timer hits 0 | Harmless. Close now is idempotent |
| Must stop now | **End quiz**. Results cover the questions revealed so far |
| Venue wifi drops | Phones show "Reconnecting" and recover; answers already sent are stored |
| Exact tie on score and time | Shared rank (1, 1, 3). Decide on stage if a single winner is needed |
| Two people answering for one team | Only the taker on the bound device is accepted |

## How it stays fast

- Phones poll `/api/s/<code>/state` every 1 s when visible and every 10 s when hidden. Each response carries `serverNow`, so timers are corrected to server time.
- Each server instance caches a per-session snapshot for 750 ms (stale-while-revalidate). Host actions invalidate it immediately. Answers only mark it stale, so answer bursts don't force every poll to reload.
- Answers are validated against fresh session data and server time, with a 750 ms network grace. Tie-break time is measured on the server.

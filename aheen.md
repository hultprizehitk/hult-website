# aheen.md — Project Orientation + Quiz Handoff

Written 2026-09-24 from a full read of the repo (all `.md` files, models, API routes, git history).
Sections 1–3 were written from a read of the code. The quiz was then **built and verified on 2026-09-24**; see §4 for its status.

---

## 1. What this project is

The website for **Hult Prize HITK** (Heritage Institute of Technology, Kolkata). It is the campus round of the Hult Prize social-entrepreneurship competition. Production domain: `hultprizehitk.live`, with admin at `admin.hultprizehitk.live`.

Students sign in with Google. **Only `@heritageit.edu.in` accounts are allowed.** They form teams, register for events, and get checked in on event day. Organizers run everything from an admin portal.

**Contributors (git):** Harsh Raj (backend, teams, email, most commits), Yogesh (hero visuals, docs), bhoomi (hero animation), Arunima Dutta (styling), "Coden-inja" (created the `quiz/` scaffold).

---

## 2. Repo layout: there are FOUR apps

| Folder | What it is | Status |
|---|---|---|
| **`client-v3/`** | **The live app.** Next.js 16.3.6, React 19, Tailwind v4, MongoDB (Mongoose), NextAuth v5 (Google). Public site, team system, and admin at `/admin` (served on the admin subdomain through `middleware.ts`). | **Active.** All commits from Sep 23–24 are here. |
| `client/` | The original full app (v1). Next 16.3.1. Has features v3 dropped: participant self check-in (`/events/checkin`), `EventRsvp` model, SSE live stream, broadcast emails, email logs. Admin lives at a "secret" slug, `/portal-hult-8f4b2c1e9a7d`. | Legacy. Useful as a **reference** for check-in and live features. |
| `client-v2/` | Frontend-only snapshot with hardcoded `data/events.ts`. | Dead (2 commits). Ignore it. |
| `quiz/` | **The live quiz app** (Slido-style): Next.js 16 (webpack), shared MongoDB, NextAuth, shadcn + motion-primitives, admin-dashboard styling. | **Built and load-tested** (2026-09-24). Your area. |

> **Heads-up:** `client-v3/README.md` is **stale**. It says v3 is "frontend-only, no backend, mock auth", but v3 now has real MongoDB models, NextAuth, admin API routes, and SMTP email. Trust the code over that README.

Other top-level files:
- `AGENTS.md` and `.agents/rules/strict_rules.md` are the **team rules** (see §6).
- `docs/` holds engineering write-ups: debug logger, the "stuck on intro page" case study, the 2.5D hero pipeline, and 3D asset prompts. All of it is about the homepage visuals, not the quiz.
- `EXTRACTED_WEBSITE_TEXTS.md` is an auto-generated dump of all UI strings from `client/`.
- `Hult Prize Quiz — Requirements Doc.md` is the quiz PRD. It is **untracked in git** and not committed yet.

---

## 3. What's implemented in `client-v3` (the live app)

**Public pages**
- `/`: cinematic "Kolkata" hero (layered parallax, WebGL gradient, cloth and water effects), about, events, and footer sections.
- `/events`: event list, plus `?event=` detail view with rounds, rules, a registration countdown, and team registration.
- `/team`, `/team/[slug]`: organizing committee. Member pages have a 3D physics lanyard (Three.js + Rapier).
- `/register`: Google sign-in portal (heritage domain only).
- `/profile`: student dashboard (profile, avatar, team management).

**Team system** (`app/api/teams`, `app/api/teams/join`, `models/Team.ts`)
- The team lead creates a team and gets a unique `teamCode`. Others join with that code.
- Team fields: `lead`/`leadEmail` (**the lead is effectively the "captain"**), `members[]`, `submissionStatus` (`forming` → `ready` → `submitted`), `status` (`confirmed` | `disqualified`), `checkedIn`, `checkedInAt`.
- Once a team is `submitted`, it is locked: no joining, leaving, removals, or renaming.
- Min/max team size comes from the Event (defaults: 3–5).

**Admin** (`app/admin/*`, gated by `lib/admin-check.ts`)
- Roles: `user`, `junior_admin`, `lead_admin`, `master_admin`. Super admins come from the `ADMIN_EMAILS` env var.
- Pages: dashboard stats, events CRUD, teams, students directory, content CMS (committee, announcements, sponsors, FAQ), admins management, **live-event manager**, **QR scanner**.
- **Check-in in v3 is admin-driven.** An organizer scans or types a team's `teamCode` in `/admin/scanner`. `PUT /api/admin/teams {action:"toggle_check_in"}` then sets `Team.checkedIn = true`. Every admin action is written to `AuditLog`.

**Email**: Google Workspace SMTP (`lib/mail.ts`, `lib/email-templates.ts`), with welcome and team-creation templates.

**Data models (Mongo):** `User`, `Team`, `Event` (still also embeds a legacy `registeredTeams[]` copy), `SiteContent`, `AuditLog`. There are **no quiz models anywhere.**

---

## 4a. Decisions made (2026-09-24)

| Decision | Choice |
|---|---|
| Database | **MongoDB**, not Firebase. The PRD's Firestore concepts map to Mongo collections, and real-time comes from polling or streaming (the choice is still open). |
| Where the code lives | **`quiz/`**, the standalone Next.js app. Not inside `client-v3`. |
| UI/UX | **A Slido clone**: join with an event code, a big single question card, tap-to-answer option bars, a live results/leaderboard screen for the projector, and a presenter/admin console. |
| Theme | **Same UI components and design theme as the admin dashboard** (`client-v3/app/admin`): black background with dots, `#0e0e12` cards, white primary buttons, emerald/rose/amber status colours. Hult pink `#f20089` is kept as the brand accent. (Updated from the original "pink + black" instruction.) |
| Test data | 10–20 random MCQs for testing edge cases. They are seeded into the DB (never hardcoded in UI code, per team rule). |

### Quiz design and plan (written and built 2026-09-24)
- **Spec:** `docs/superpowers/specs/2026-09-24-quiz-design.md` lists decisions D1–D24, the data model, the state machine, scoring, and screens. Every default I chose is marked "Default" there, so you can override any of them.
- **Plan:** `docs/superpowers/plans/2026-09-24-quiz.md` has 21 test-first tasks with full code. It runs from tooling through services, API, UI, the seed script, a 50-client simulation, and docs.
- The key defaults, all Slido-style:
  - The host moves the quiz forward one question at a time, with a timer on each question.
  - Scoring uses the fixed points per question from the PRD. Ties are broken by total response time on the server clock.
  - The lead is the default taker and can swap to another member until the quiz starts.
  - Admins can reset a taker's phone or reassign the taker at any time.
- **Dev DB:** `quiz/.env.local` points at `hult-quiz-dev` on the same cluster (not the live `hult-website` DB), so seeded test teams never show up on the real site. Switch the db name only for event day.
- **Blocker to flag to the team:** Google sign-in on the quiz needs `http://localhost:3001/api/auth/callback/google` (and the prod quiz URL) added to the Google OAuth client. Until then, use the built-in dev login.

### Working guidelines (from the team)
- Develop from `quiz/`: `cd quiz && npm install && npm run dev`.
- Git pull and push happen from the **repo root** (`hult-website/`). The quiz app is not a separate repo.
- Work on the **`main` branch only**.
- Every **major bug solved** gets a write-up in the root **`/docs`** folder (not inside `quiz/`). Follow the style of `docs/case-study-stuck-on-intro-page.md` and add a row to `docs/README.md`.
- The team rules in §6 still apply: no hardcoded mock data, minimal text, no emojis, and lucide icons only.

---

## 4. The quiz: where things actually stand

**Status (2026-09-24): implemented, tested, and pushed to `main`.**

| Route | What it does |
|---|---|
| `/` | Join by 6-digit code |
| `/s/<code>` | Phone: sign in, auto check-in, lobby with taker picker (lead), 3-2-1 lead-in, question with countdown, answer lock, reveal with result bars, leaderboard, final rank. Plus screens for "no team", "not eligible", "check-in closed", and "active on another device" |
| `/present/<code>` | Projector: QR + code + check-in counter, question + timer + answered bar, result bars, top 10, podium |
| `/admin` | Session list and create (admins only: `ADMIN_EMAILS` or DB admin role) |
| `/admin/s/<code>` | Console. **Live**: open lobby, start, +15s, close, reveal, leaderboard, next, restart question, end, CSV. **Questions**: add, edit, reorder, delete, or **import a CSV** (format in the runbook). **Teams**: check-in board, manual check-in, change taker, reset device |

Verification:
- 84 unit and service tests.
- Every screen was exercised in the browser.
- `npm run simulate` (50 teams × 15 questions against a production build) **passes all checks**:
  - scores match exactly
  - state p95 377 ms
  - answer p95 463 ms

How-to lives in `docs/quiz-runbook.md`. The major bugs solved along the way (exFAT vs Turbopack/webpack, and git on this drive) are written up in `docs/case-study-turbopack-exfat-junctions.md`.

**Still open (needs someone with access):** add the quiz's Google OAuth redirect URIs, pick the production host/domain for the quiz, and do a dry run on venue wifi.

> The two warnings below are now **resolved** (see §4a): Mongo, standalone `quiz/` app. They stay here for context.

### ⚠️ The PRD assumes a stack the project doesn't use

The PRD says **Firebase** (Firestore, `onSnapshot`, `serverTimestamp()`, Cloud Functions). The whole site runs on **MongoDB + NextAuth + Next API routes**. There is no Firebase anywhere. This has to be settled with whoever wrote the PRD before you build:

| Option | Pros | Cons |
|---|---|---|
| **A. Stay on Mongo, use polling** (clients poll `GET /api/quiz/state` every ~1–2s) | One DB, reuses auth/Team/admin as-is, no new infra. About 50 clients × 1 req/s is trivial. | Start signal lands 0–2s late. Fix: clients key off server `startTime` (with clock-offset correction), not the moment they notice. |
| **B. Stay on Mongo, use SSE** | Push-based and snappy. | v1's SSE (`lib/live-broadcaster.ts`) is an **in-memory EventEmitter**. It breaks when the host runs several server instances (serverless/Vercel). It would need Mongo change streams or Redis. |
| **C. Add Firebase just for the quiz** (the PRD as written) | Real-time for free, and the PRD maps 1:1. | Second database and second auth system. Firebase auth would need to be bridged from NextAuth (custom tokens). Team/user data lives in Mongo. |

My read: **A** is the least risky for about 50 teams. The PRD's *principles* still apply (server-authoritative start time, per-answer persistence, one locked uid per team). Only the transport changes.

### ⚠️ Second decision: separate `quiz/` app or inside `client-v3`?

- The PRD's own routes (`/quiz/checkin`, `/quiz/results`) and its reliance on "logged-in user belongs to a registered team" point to **building it inside `client-v3`**. You get the existing auth session, the `Team` model, `isAuthorizedAdmin`, the admin subdomain, and the styling.
- Keeping the standalone `quiz/` app means a separate deploy. It would also need NextAuth session sharing (same `AUTH_SECRET`, cookie domain `.hultprizehitk.live`) and its own Mongo connection and models, duplicated.
- Ask the team which they intended. Someone created `quiz/` on purpose on Sep 2, but that was before v3 became the main app.

### How the PRD maps onto what exists

| PRD concept | Existing thing to reuse | Gap |
|---|---|---|
| "Registered team" | `Team` (`eventId`, `leadEmail`, `members[].email`), `status: confirmed` | Need to decide whether `submissionStatus: "submitted"` is required to take the quiz. |
| Captain | `Team.lead` / `leadEmail` | none |
| Quiz representative | nothing | New field, e.g. `quizRepEmail` + `quizRepLockedAt` on Team or on a new quiz doc. |
| QR check-in (participant scans) | v3: admin scans the team. v1: participant scans `/events/checkin` (`client/app/events/checkin/page.tsx` + `PATCH /api/events/rsvp`). | The PRD wants participant-scan. Port v1's pattern or reuse v3's admin scanner. `Team.checkedIn` could be the flag. |
| Quiz event `status / startTime` | `Event` model (the quiz is probably an Event with a "quiz" tag) | New `QuizSession` model: `eventId`, `status`, `startTime`, `durationSec`, `endTime`, questions. |
| Per-answer audit | `AuditLog` pattern | New `QuizAttempt`: `{sessionId, teamId, takerEmail, answers[{qId, chosen, isCorrect, points, answeredAt}], submittedAt, elapsedMs, totalScore}` with a **unique index on (sessionId, teamId)**. That enforces "one taker per team". |
| Admin controls | `/admin/live-event`, `/admin/scanner` patterns, `logAdminAction` | New `/admin/quiz`: check-in board, launch, live progress, end, extend, export CSV (LiveEventManager already has a CSV export to copy). |
| Leaderboard | none | Sort by `totalScore desc, elapsedMs asc`. The PRD's "Cloud Function on end" becomes the end-quiz API handler computing ranks. |

**Security notes for quiz questions:** never send `correctIndex` to the client, and grade on the server. Compute time from the **server** `startTime` to the server-received submit time, never from client timestamps.

### Open questions (PRD §11) still unanswered
1. Per-question vs overall timer (the PRD recommends overall)
2. Point values per question
3. Exact tie-break time definition
4. Backup taker if the device dies
5. Proctor vs technical anti-cheat
6. Send all questions at once vs one at a time
7. Leaderboard public/projectable vs login-gated
8. Whether non-top-10 teams see their own rank

The two extra questions (**Firebase vs Mongo**, **`quiz/` vs `client-v3`**) are settled. See §4a.

**New questions raised by the standalone-app decision:** how people log in to `quiz/`, and whether it shares the main site's MongoDB (real `Team` records) or keeps its own team list. These are being worked through in the design session, and the answers will go into the quiz spec under `docs/superpowers/specs/`.

---

## 5. Suggested build order (adapted from PRD §10)

1. Get answers to the decisions above.
2. Models: `QuizSession` (+ questions), `QuizAttempt`. Questions are entered via admin, not hardcoded (team rule).
3. Captain designates the quiz rep on the profile/team UI (locks at check-in close).
4. Check-in page `/quiz/checkin` (QR → login → team lookup → mark present).
5. Taker screen: waiting room → synced start → questions → autosave each answer → submit. Resume on refresh.
6. Admin `/admin/quiz`: launch / monitor / end / extend / export.
7. Scoring + ranks → `/quiz/results` (projectable, auto-updating).
8. Load test with ~50 simulated clients, then a dry run on venue wifi.

---

## 6. Team rules you must follow

From `AGENTS.md` / `.agents/rules/strict_rules.md`:
- **No hardcoded mock data.** Everything comes from MongoDB via API routes. The quiz questions must be DB-backed, not a TS array.
- **No heavy text.** UI copy stays minimal and crisp.
- **No emojis** anywhere (UI, code, alerts). `lucide-react` icons are allowed, used sparingly.

From each app's `AGENTS.md`: **Next.js 16 has breaking changes.** Read `node_modules/next/dist/docs/` before writing Next code (after `npm install`).

---

## 7. Getting it running

**Quiz app (your work):**
```bash
cd quiz
npm install
npm run dev
```
Git commands run from the repo root on `main`.

**Main site (for reference):**

```bash
cd client-v3
npm install
cp .env.example .env.local   # fill MONGODB_URI, Google OAuth, AUTH_SECRET, ADMIN_EMAILS
npm run dev                  # http://localhost:3000, admin at admin.localhost:3000
```
Ask the team for a dev `MONGODB_URI` and Google OAuth credentials. Sign-in requires a `@heritageit.edu.in` Google account. Put your email in `ADMIN_EMAILS` to get admin access locally.

Git note: on this machine, git refuses to run in the repo ("dubious ownership", because the D: drive doesn't record file owners). Use `git -c safe.directory='*' <cmd>`, or run `git config --global --add safe.directory D:/College/Hult/hult-website` once.

---

## 8. Other things I noticed (not quiz-blocking)

- Three near-duplicate codebases (`client`, `client-v2`, `client-v3`) share copied models and libs. Fixes don't propagate between them.
- The `client/` (v1) admin "secret slug" is committed in the repo, so it isn't secret. v1's SSE stream endpoint (`/api/admin/live/stream`) has no auth check.
- Rate limiting (`lib/rate-limit.ts`) is in-memory, so it resets per server instance.
- The legacy `Event.registeredTeams[]` is still kept in sync with the `Team` collection (dual writes in the check-in toggle).

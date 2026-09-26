# PRD: Hult Prize Quiz on Firebase

**Date:** 2026-09-26 · **Owner:** Aheen · **Status:** Draft for review
**Replaces:** the MongoDB runtime of the quiz built on 2026-09-24 (`docs/superpowers/specs/2026-09-24-quiz-design.md`). The product, screens and rules stay the same; the backend moves to Firebase.
**Related:** `docs/quiz-runbook.md` (current ops guide), `Hult Prize Quiz — Requirements Doc.md` (original PRD, which asked for Firebase).

---

## 1. Summary

The quiz app (`quiz/`) works today on MongoDB, with phones polling the server every second. We are moving the whole quiz onto **Firebase**:

- **Firestore** stores all quiz data.
- Phones, the projector and the admin console get **real-time updates through Firestore listeners** instead of polling.
- **Login stays NextAuth (Google, @heritageit.edu.in)**. After login, the server gives the browser a **Firebase custom token**, so Firestore security rules know who the user is.
- **Hosting stays on Vercel.**
- MongoDB is only touched by the **team sync**: an admin action that copies the event's registered teams from the main site into Firestore before the quiz.

## 2. Goals and non-goals

**Goals**
1. The quiz runs with **no MongoDB dependency during a live quiz**.
2. Real-time: the gap between a host action and phones seeing it should be under 1 s, driven by Firestore rather than polling.
3. Same features, screens and rules as today (see §4), plus an **always-on leaderboard screen**.
4. It stays on the **free Firebase Spark plan** for a 50-team event (see §9).
5. The full automated test suite is rewritten against the **Firebase emulators**, plus a 50-team load test and a manual checklist (see §11).
6. A plain-language **"what is built" document** at the end (`docs/quiz-system.md`).

**Non-goals**
- Moving the main website (`client-v3`) off MongoDB.
- Firebase Hosting, App Hosting or Cloud Functions (these would need the paid Blaze plan).
- Firebase Auth's own sign-in UI. NextAuth remains the login.
- Migrating existing quiz data. Only test data exists, so it gets re-seeded.

## 3. Decisions (all confirmed)

| # | Topic | Decision |
|---|---|---|
| F1 | Scope | The whole quiz runs on Firebase. Team rosters are **copied** in; they are not read live from MongoDB. |
| F2 | Auth | **Keep NextAuth** (Google, heritage domain, and dev login for local use), **bridged** to Firebase with custom tokens. |
| F3 | Team sync | A **"Sync teams" button** in the admin console, plus an `npm run sync-teams` script. It reads the event's teams from MongoDB and upserts them into Firestore. It can be re-run any time. |
| F4 | Hosting | **Vercel** (the existing `quiz-hult-website` project). Firebase is used only for Firestore and custom-token auth, on the free **Spark** plan. |
| F5 | Firebase project | Created by Aheen, with leads added as members. Firestore region is **`asia-south1` (Mumbai)**, which cannot be changed later. |
| F6 | Dev and tests | The **Firebase Emulator Suite** (Firestore and Auth) is used for local dev and all automated tests. It needs Java 21. |
| F7 | Eligibility | Only teams that are `status: confirmed` **and** `submissionStatus: submitted` can play. |
| F8 | Check-in | The quiz keeps its **own** check-in: any team member opening the quiz link while check-in is open checks the team in. (Venue scanning on the main site is separate.) |
| F9 | Quiz rules | These are unchanged: host-paced, per-question timer, 3 s lead-in, fixed points, tie-break by total answer time (unanswered = full time limit), shared rank for exact ties. The lead answers by default and can hand over before the start. Admins can reset a phone or change the taker at any time. |
| F10 | Writes | **Browsers never write to Firestore.** All writes go through the quiz's API routes using the Firebase Admin SDK. Security rules deny all client writes. |
| F11 | Grading | Answers are **graded at Reveal** on the server, not at submit time. Correctness therefore cannot leak before the reveal, even from a team's own answer document. |
| F12 | Mongo key | A **read-write** MongoDB key will be used (per the lead). The sync code only ever calls read operations; see §10 for the guard. |
| F13 | Event | The admin picks the event when creating a session. **Which event the quiz is for is still to be confirmed by the lead**, but this is only needed on event day. |

## 4. What stays the same (product)

All screens and flows from the current build are kept:
- **Phone** `/s/<code>`: sign in, auto check-in, lobby with the lead's taker picker, 3-2-1 lead-in, question with countdown, "Answer locked", reveal (correct/incorrect, points, result bars, "Your team" card), leaderboard, final rank. It also has the no-team, not-eligible, check-in-closed and active-on-another-device screens.
- **Projector** `/present/<code>`: QR code, join code and check-in counter, then the question with timer and answered bar, result bars, top 10 and podium.
- **Admin** `/admin` and `/admin/s/<code>`:
  - Live controls: open lobby, start, +15s, close now, reveal, leaderboard, next, restart question, end, export CSV.
  - Questions: add, edit, reorder, delete, CSV import.
  - Teams: check-in board, manual check-in, change taker, reset device.
- **Design:** the admin dashboard design system, with Hult pink as the accent.
- **Tie-breaks, edge cases and the recovery playbook** from `docs/quiz-runbook.md` are unchanged.

**New:**
- **Always-on leaderboard** `/present/<code>/board`: a second-screen page that shows the live top 10 (plus podium at the end). It updates the instant each question is revealed.
- **"Sync teams"** in the admin Teams tab, showing "Last synced …" and counts of eligible, new and updated teams.

## 5. Architecture

```
Phone / Projector / Admin (browser)
   │ 1. NextAuth Google login (unchanged)
   │ 2. GET /api/firebase-token  → custom token {email, admin}
   │ 3. signInWithCustomToken()  → Firebase Auth session
   │ 4. onSnapshot(...) listeners ─────────────────────►  Firestore (read-only for clients, rules-enforced)
   │ 5. POST /api/... (join, taker, answer, admin controls, import, sync)
   ▼
Next.js route handlers on Vercel ── firebase-admin SDK ──► Firestore (all writes, transactions)
                                  └─ mongoose (sync only) ─► MongoDB `hult-website` (teams, users: read)
```

- **What stays:** the pure logic modules (`engine`, `scoring`, `views`, `clock`, `validation`, `csv-import`, `export`, `format`), all UI components, and NextAuth.
- **What is replaced:** the Mongo models and services (`models/*`, `lib/quiz/{sessions,questions,teams,answers,state,cache}.ts`) are replaced by Firestore equivalents. `usePolling` is replaced by Firestore listener hooks.
- **Server time:** Firestore listeners carry no "server now", so phones still sync their clock through a light `GET /api/time` ping every 30 s, using the existing NTP-style estimator. Timers compare against `openedAt` and `closesAt`, which are server timestamps.

## 6. Auth bridge (NextAuth → Firebase)

1. The user signs in with NextAuth as today. The admin check is the `ADMIN_EMAILS` env var **or** the email being in Firestore `quizAdmins` (§7).
2. The browser calls `GET /api/firebase-token`. The server reads the NextAuth session and calls `admin.auth().createCustomToken(uid, { email, admin })`, where `uid` = the lowercased email.
3. The browser calls `signInWithCustomToken(token)`. The Firebase SDK keeps the session and refreshes it on its own.
4. On NextAuth sign-out, the browser also calls Firebase `signOut()`.
5. Security rules use `request.auth.token.email` and `request.auth.token.admin`.
6. **Dev login** (local only) works unchanged, because it is a NextAuth provider. The emulators accept custom tokens.
7. The **projector** needs no login. It reads only the public session document.

## 7. Firestore data model

The session document ID **is** the 6-digit code, which makes lookups trivial and guarantees uniqueness.

| Path | Who can read | Contents |
|---|---|---|
| `quizSessions/{code}` | **anyone** (projector is public) | `title`, `eventId`, `eventTitle`, `status`, `phase`, `currentIndex`, `questionCount`, `checkinOpen`, `requireSubmitted`, `questionOpenedAt`, `questionClosesAt`, `stateVersion`, `current` (the current question's public fields: `id`, `index`, `text`, `options`, `points`, `timeLimitSec`, plus `correctIndex` and `distribution` **only after reveal**), `leaderboard` (top 10, set at reveal and end), `gradedThrough` |
| `quizSessions/{code}/live/counts` | admin + anyone (projector) | `checkedIn`, `eligible`, `answeredCurrent` (incremented per answer). This is split out so answer bursts don't re-send the session document to every phone (§9). |
| `quizSessions/{code}/questions/{qid}` | **admin only** | Full question including `correctIndex`, `order` |
| `quizSessions/{code}/teams/{teamId}` | the team's members + admin | Roster snapshot from sync: `teamName`, `teamCode`, `leadEmail`, `members[]`, `memberEmails[]`, `eligible`, `syncedAt`. Quiz state: `checkedInAt`, `checkedInBy`, `takerEmail`, `deviceId`. Scores, updated at reveal: `score`, `totalTimeMs`, `answeredCount`, `correctCount`, `rank`, `perQuestion{qid: {optionIndex, correct, points, ms}}` |
| `quizSessions/{code}/answers/{teamId}_{qid}` | the team's members + admin | `optionIndex`, `takerEmail`, `answeredAt`, `responseMs`. **No correctness here.** The ID format enforces one answer per team per question. |
| `quizAdmins/{email}` | admin only | Admin emails copied from MongoDB `users` roles during sync, plus manual additions |

**Security rules (summary):**
- `allow write: if false` everywhere.
- The session and counts documents are readable by anyone.
- Questions are readable by admins only.
- Team and answer documents are readable if `request.auth.token.email in resource.data.memberEmails`, or by admins. Answer documents carry a copy of `memberEmails` for this purpose.

## 8. Server flows (Admin SDK, all in transactions)

| Flow | Key behaviour |
|---|---|
| **Host control** (open lobby, start, next, close, +15s, restart, reveal, leaderboard, end) | Reads the session with `stateVersion`, runs the existing pure `engine.applyAction`, and writes the patch with `stateVersion+1`. A stale version gets a 409 (double-click or two admins). `next`/`start` copy the new question's public fields into `current` and reset `answeredCurrent`. `restart_question` deletes that question's answers. |
| **Reveal** | Closes the question if it is still open. **Grades** every answer to it and adds a time penalty for teams that didn't answer. Updates each team's score fields and sets `current.correctIndex`, `current.distribution` and the top-10 `leaderboard`. Sets `gradedThrough = currentIndex`. **End** also grades the current question if it isn't graded yet. |
| **Join / check-in** | Finds the team whose `memberEmails` contains the email. Checks `eligible` and `checkinOpen`. Sets `checkedInAt` (the first member's check-in wins, idempotently) and binds `deviceId` for the taker. Returns `teamId` so the phone can listen to its team document. |
| **Answer** | Loads the session and the team, then checks: live, phase = question, correct question ID, time window (+750 ms grace), taker, device. **Creates** `answers/{teamId}_{qid}`; if it already exists, the first answer is kept and the request is treated as a duplicate. Increments `answeredCurrent`. |
| **Team sync** | Admin only. Reads MongoDB `teams` for the session's event and `users` with admin roles. Upserts `teams/{teamId}`, **overwriting roster fields only**; check-in, taker, device and score fields are never touched. Marks teams missing from MongoDB as `eligible: false` rather than deleting them. Refreshes `quizAdmins` and `live/counts.eligible`. Records `lastSyncAt` and returns counts of new, updated and ineligible teams. |
| **CSV import, question CRUD, export** | Same behaviour as today, backed by Firestore. |

## 9. Cost and quota (Spark free plan)

Free-plan limits: **50k document reads, 20k writes per day**. Estimate for 50 teams × 4 members (about 200 phones), 15 questions:

| Source | Estimate |
|---|---|
| Session document: about 5 changes per question × 200 listeners × 15 | ~15,000 reads |
| Team documents: 1 score update per reveal × ~4 members × 47 teams × 15 | ~2,800 reads |
| Counts document (projector + admin only): 47 answers × 15 × ~3 listeners | ~2,100 reads |
| Admin console (answers, questions, teams listeners) | ~5,000 reads |
| **Total per full quiz** | **~25,000 reads, ~3,000 writes** |

- **One full quiz fits the free plan.** A dry run plus the real event on the **same day** would exceed it, so do rehearsals on a different day, or use the emulators.
- If more is needed, switching to Blaze costs about **$0.06 per 100k reads**, i.e. cents per event, but it requires a billing card.
- If answer bursts updated the session document instead of the separate counts document, the total would be about 140k reads. That is why §7 splits them.

## 10. Environment and secrets

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Vercel + `.env.local` | Web app config. These are public by design. |
| `FIREBASE_SERVICE_ACCOUNT` | Vercel + `.env.local` | Service-account JSON, base64-encoded. **Secret.** |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | `.env.local` only | `true` for local dev and tests |
| `MONGODB_URI` | Vercel + `.env.local` | **Sync only.** It is a read-write key (F12). The guard: sync code lives in a single module (`lib/sync/`), is limited to `find`/`countDocuments`, and has a unit test that fails if the module imports any write method. Swap to a read-only user whenever one becomes available. |
| `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS` | unchanged | NextAuth |
| `QUIZ_DEV_LOGIN`, `ALLOW_DEV_SEED` | `.env.local` only | Never set on Vercel |

## 11. Testing

### 11.1 Automated (run on every change: `npm test`)
- [ ] **Pure logic:** the existing tests for engine, scoring, views, clock, validation, csv-import, export and env keep passing.
- [ ] **Security rules** (`@firebase/rules-unit-testing` against the emulator):
  - [ ] Anonymous users can read the session and counts documents and **nothing else**.
  - [ ] Anonymous and signed-in users **cannot write anywhere**.
  - [ ] A member can read their own team and answer documents, and **cannot** read another team's.
  - [ ] A non-admin **cannot** read `questions` (no `correctIndex` leak).
  - [ ] Admins can read everything and still cannot write from the client.
- [ ] **Auth bridge:** `/api/firebase-token` returns 401 when signed out. The token carries `email`, and `admin` is true only for admins. A token for a non-heritage email is refused.
- [ ] **Services** (emulator), porting every current service test:
  - [ ] Session create (the code doc ID is unique and retries on collision).
  - [ ] The full lifecycle, and a stale `stateVersion` returning 409.
  - [ ] Restart deletes only the current question's answers.
  - [ ] Join rejects: not registered, ineligible, check-in closed. A checked-in member can re-join after close. Concurrent joins produce one check-in.
  - [ ] Taker rules: lead only, lobby only, members only. Changing the taker clears the device.
  - [ ] Answer checks: too early, too late (grace), not the taker, wrong device, wrong question, bad option. A duplicate keeps the first answer. A concurrent double-submit stores one answer.
  - [ ] Reveal grades correctly: points, time clamp, and the unanswered penalty. The leaderboard matches `computeStandings`, including shared ranks. End grades an ungraded current question.
  - [ ] No correctness is visible anywhere a participant can read before reveal.
  - [ ] Question CRUD, reorder, CSV import (append and replace), and everything locked while live.
  - [ ] **Team sync:**
    - [ ] It creates teams.
    - [ ] Re-sync updates roster fields and **preserves check-in, taker, device and scores**.
    - [ ] A team removed in MongoDB becomes ineligible and is not deleted.
    - [ ] Admin emails are copied to `quizAdmins`.
    - [ ] The sync module uses no MongoDB write methods (guard test).

### 11.2 Load test (`npm run simulate`, against a production build + emulator, then once against the real project)
- [ ] 50 teams join (47 eligible, 3 rejected with the correct errors).
- [ ] Each question: every team answers with a random delay, 10% don't answer, and the negative cases run (lead-in, teammate, wrong device, duplicate, late).
- [ ] **Scores for every team match** the simulator's own tally after the end.
- [ ] **Propagation:** p95 time from a host action to a simulated phone's listener firing is under **1 s**.
- [ ] Answer latency p95 is under **1 s**. There are 0 server errors.
- [ ] The Firestore usage for the run (from the console) is recorded and within the §9 estimate.

### 11.3 Manual browser checklist (3 windows: admin, projector, phone; plus an incognito teammate)
**Setup**
- [ ] `/admin` redirects to sign-in when signed out; a non-admin sees "Admins only"; an admin sees the sessions list.
- [ ] Create a session, pick the event, **Sync teams**: the counts shown match the main site's registrations.
- [ ] Import the questions CSV (a bad file shows row errors; a good file previews and then imports). Edit, reorder, delete.

**Lobby**
- [ ] The projector shows the QR code and join code; the counter starts at 0.
- [ ] Phone: join by code, sign in, auto check-in. The projector counter goes up **without refreshing**.
- [ ] The lead changes the taker; the taker badge moves on both phones.
- [ ] Teammate phone: "Your teammate answers"; no taker picker.
- [ ] Not-registered, ineligible and check-in-closed screens each appear for the right account.

**Live**
- [ ] Start: the 3-2-1 lead-in appears on the projector and phones **at the same moment**.
- [ ] The taker answers and sees "Answer locked"; the projector's "answered x/y" updates live; the teammate sees the locked answer.
- [ ] +15s moves every timer; Close now stops answering everywhere.
- [ ] Reveal: correct/incorrect and points on phones, bars on the projector, "Your team" rank.
- [ ] The leaderboard appears on the projector, phones and `/present/<code>/board`.
- [ ] Next question; Restart question clears answers and reopens.
- [ ] A phone refresh mid-question comes back to the same state (answer still locked).
- [ ] Wi-Fi off on a phone for 10 s then back on: it catches up with no error.
- [ ] Taker on a second device sees "Active on another device"; the admin **Reset device** lets them continue.
- [ ] The admin changes the taker mid-quiz, and the new taker can answer.
- [ ] A late team gets a manual check-in from the admin and answers the next question.

**End**
- [ ] End quiz: podium on the projector and final rank on phones; the CSV export matches the admin standings.
- [ ] Exact tie: both teams show the same rank.

**Deploy (Vercel)**
- [ ] Every checklist section above passes once on `quiz.hultprizehitk.live` (or the vercel.app URL) with real Google login.
- [ ] A dry run on **venue wifi** with 3+ real phones, on a different day from the event (quota, §9).

## 12. Work plan

| # | Task | Who |
|---|---|---|
| 1 | Create the Firebase project (Firestore in `asia-south1`, production mode), register a Web app, generate a service-account key, add the leads as members | **Aheen** (click-by-click steps will be provided) |
| 2 | Install Java 21 and the Firebase CLI; set up the emulators | Claude (Java approved) |
| 3 | Firebase config and the Admin SDK module; emulator wiring; security rules and rules tests | Claude |
| 4 | Auth bridge (`/api/firebase-token`, client sign-in hook, sign-out) | Claude |
| 5 | Port the services to Firestore (sessions, questions, teams, answers, grading at reveal, counts); port the service tests | Claude |
| 6 | Team sync (API + script + guard test) and the admin "Sync teams" UI | Claude |
| 7 | Replace polling with listener hooks in the phone, projector and admin UIs; add the `/api/time` clock sync | Claude |
| 8 | Always-on leaderboard page `/present/<code>/board` | Claude |
| 9 | Seed script for the emulator; simulate script with listener-propagation timing; run the load test | Claude |
| 10 | Remove Mongo runtime code (keep only `lib/sync/`); update the runbook, `aheen.md` and the case studies | Claude |
| 11 | Write `docs/quiz-system.md`, the detailed "what is built" document | Claude |
| 12 | Vercel env vars, domain and DNS; Google redirect URIs | **Leads** (messages sent 2026-09-26) |
| 13 | Deployed smoke test (§11.3 "Deploy") and the venue dry run | **Aheen** + team |

The build (tasks 2–11) needs only task 1 from you; the emulators cover everything else locally. Tasks 12–13 are needed for event day.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Quota exceeded on the rehearsal day | Rehearse with the emulators or on a different day; Blaze costs cents if needed |
| Question text is delivered with the lead-in, so a curious user could peek about 3 s early in devtools | Accepted: the UI hides it, proctors are present, and the correct answer is never sent before reveal. The alternative (a delayed server write) is unreliable on serverless |
| A read-write MongoDB key sits in Vercel | Sync is isolated to read-only calls with a guard test; swap to a read-only user when available |
| Team registrations change after sync | "Last synced" is shown in the console; re-sync is safe at any time and preserves quiz state |
| A service-account key leak | Stored only in Vercel env and `.env.local` (git-ignored); rotate from the Firebase console if exposed |
| The exFAT drive (build tooling) | The existing webpack and readlink fixes are kept; the emulators run fine from any drive |

## 14. Open items
- **Lead:** which event the quiz is for (only needed on event day).
- **Lead:** Vercel access, DNS, and Google redirect URIs (messages sent).
- **Aheen:** create the Firebase project (task 1).

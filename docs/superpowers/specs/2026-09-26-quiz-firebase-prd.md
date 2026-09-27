# PRD: Hult Prize Quiz on Firebase

**Date:** 2026-09-26 · **Owner:** Aheen · **Status:** Implementation complete; emulator-verified; live Firebase and browser acceptance pending
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
4. It stays **comfortably inside the free Firebase Spark plan** (and Vercel's free tier) for a 50-team event, including worst-case device counts, by design rules (see §9).
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
7. The **projector** needs no login. It reads the public session and public per-team counter shards.

## 7. Firestore data model

The session document ID **is** the 6-digit code, which makes lookups trivial and guarantees uniqueness.

| Path | Who can read | Contents |
|---|---|---|
| `quizSessions/{code}` | **anyone** (projector is public) | `title`, `eventId`, `eventTitle`, `status`, `phase`, `currentIndex`, `questionCount`, `checkinOpen`, `requireSubmitted`, `questionOpenedAt`, `questionClosesAt`, `stateVersion`, `current` (the current question's public fields: `id`, `index`, `text`, `options`, `points`, `timeLimitSec`, plus `correctIndex` and `distribution` **only after reveal**), `leaderboard` (top 10, set at reveal and end), `gradedThrough` |
| `quizSessions/{code}/counts/{teamId}` | anyone (projector) | One low-contention shard per team: `eligible`, `checkedIn`, `answeredFor`, `answered`. The projector sums the shards; admin counts come from its existing team listener. |
| `quizSessions/{code}/questions/{qid}` | **admin only** | Full question including `correctIndex`, `order` |
| `quizSessions/{code}/teams/{teamId}` | the team's members + admin | Roster snapshot from sync: `teamName`, `teamCode`, `leadEmail`, `members[]`, `memberEmails[]`, `eligible`, `syncedAt`. Quiz state: `checkedInAt`, `checkedInBy`, `takerEmail`, `deviceId`. **`currentAnswer {qid, optionIndex}`**, set at answer time (no correctness); this is how teammates see "Answer locked" without an extra listener. Scores, updated at reveal: `score`, `totalTimeMs`, `answeredCount`, `correctCount`, `rank`, `lastResult {qid, correct, points}`, `perQuestion{qid: {optionIndex, correct, points, ms}}` |
| `quizSessions/{code}/answers/{teamId}_{qid}` | **admin only** (audit trail, never listened to) | `optionIndex`, `takerEmail`, `answeredAt`, `responseMs`. The ID format enforces one answer per team per question. |
| `quizAdmins/{email}` | admin only | Admin emails copied from MongoDB `users` roles during sync, plus manual additions |

**Security rules (summary):**
- `allow write: if false` everywhere.
- The session and counter shards are readable by anyone.
- Questions are readable by admins only.
- Team documents are readable if `request.auth.token.email in resource.data.memberEmails`, or by admins. Answer documents are admin-only.

## 8. Server flows (Firebase Admin SDK; transactions where atomic invariants require them)

| Flow | Key behaviour |
|---|---|
| **Host control** (open lobby, start, next, close, +15s, restart, reveal, leaderboard, end) | Reads the session with `stateVersion`, runs the existing pure `engine.applyAction`, and writes the patch with `stateVersion+1`. A stale version gets a 409 (double-click or two admins). `next`/`start` copy the new question's public fields into `current`; the projector filters counter shards by the current question ID. `restart_question` deletes that question's answers and clears matching answer state/shards. |
| **Reveal** | Closes the question if it is still open. Reads the team documents once (their `currentAnswer` already holds each answer, so the answers collection isn't read). **Grades** every answer to it and adds a time penalty for teams that didn't answer. Updates each team's score fields and sets `current.correctIndex`, `current.distribution` and the top-10 `leaderboard`. Sets `gradedThrough = currentIndex`. **End** also grades the current question if it isn't graded yet. |
| **Join / check-in** | Resolves the team with one `memberEmails` query outside the transaction, then reads the session and team documents transactionally. Checks `eligible` and `checkinOpen`. Sets `checkedInAt` (the first member's check-in wins, idempotently), updates that team's counter shard, and binds `deviceId` for the taker. Returns `teamId` so the phone can listen to its team document. |
| **Answer** | Resolves the team with one `memberEmails` query outside the transaction, then reads the session and team documents transactionally. Checks live, phase = question, correct question ID, time window (+750 ms grace), taker and device. **Creates** `answers/{teamId}_{qid}`; if it already exists, the first answer is kept and the request is treated as a duplicate. Sets the team's `currentAnswer` and updates its counter shard. |
| **Team sync** | Admin only. Reads MongoDB `teams` for the session's event and `users` with admin roles. Upserts `teams/{teamId}`, **overwriting roster fields only**; check-in, taker, device and score fields are never touched. Marks teams missing from MongoDB as `eligible: false` rather than deleting them. Refreshes `quizAdmins` and per-team counter shards. Records `lastSyncAt` and returns counts of new, updated and ineligible teams. |
| **CSV import, question CRUD, export** | Same behaviour as today, backed by Firestore. |

## 9. Load, cost and quota (free plans)

### 9.1 Limits that matter
| Service | Free limit | Our use |
|---|---|---|
| Firestore (Spark) | **50k reads/day, 20k writes/day**, 1 GiB storage, 10 GiB/month egress | See 9.3. Storage and egress are negligible (KBs) |
| Firestore listeners | 1M concurrent connections per database | ~200 |
| Firebase Auth (custom tokens) | No charge on Spark (not Identity Platform) | ~200 sign-ins |
| Vercel (Hobby/Pro) | Function invocations are the only relevant metric | ~2k API calls per quiz (no polling), versus ~180k with the current polling design |

**Firestore's daily quota resets at midnight Pacific time, which is 12:30 IST.** A morning rehearsal and an afternoon event therefore count against different days.

### 9.2 Design rules that keep usage low (enforced in code review and tests)
1. **No polling anywhere.** Phones, the projector and the admin console use listeners only. The server-clock sync is `GET /api/time` every 30 s, which costs no Firestore reads.
2. **Phones listen to exactly 2 documents:** `quizSessions/{code}` and their own `teams/{teamId}`. **No collection or query listeners on phones.**
3. **The session document changes only on host actions** (about 3 per question: next, reveal, leaderboard, plus the occasional +15s or close). Timers tick on the client. Nothing per-answer or per-check-in touches the session document.
4. **Per-team counters live in `counts/{teamId}` under the session.** The projector listens to the shard collection and sums it; the admin derives counts from its existing team listener. Each check-in and answer updates only its team's shard, avoiding a shared-write hotspot. The phone lobby does **not** show a live "teams in" count (the projector does).
5. **Answers fold into the team document** (`currentAnswer`), so one team update reaches that team's phones. The `answers` collection is write-only audit data; nobody listens to it.
6. **Grading is one batch per reveal:** it reads each team document once and writes each once. The top-10 leaderboard is precomputed into the session document, so no client ever reads all teams.
7. **The admin console listens per tab.** Live listens to the session and teams. Questions listens to questions only while that tab is open. Teams listens to teams. The projector listens to the session and counter collection. Listeners are detached when the tab or page closes.
8. **Offline persistence is on** (`persistentLocalCache`). A phone refresh or short wifi drop resumes from cache, and Firestore bills only for documents that changed while disconnected (under 30 min).
9. **Server handlers never read more than they need.** Join and answer each use a member lookup query plus a small transaction over the session and that team's document. The lookup runs outside the transaction to avoid serializing concurrent teams on a shared query range.

### 9.3 Budget per full quiz (15 questions, 47 teams)
Worst case: **4 phones per team (about 200 devices)**, plus the projector, a board screen and 2 admin consoles.

| Source | Reads | Writes |
|---|---|---|
| Session document: about 4 changes per question x 15, plus about 10 in lobby/start, x 200 devices | ~14,000 | ~75 |
| Team documents: 2 changes per question (answer, grade) x 15 x 47 teams x ~4 phones | ~5,600 | ~1,400 |
| Per-team counter shards: 47 answers per question x 15 + 47 check-ins, one projector listener, plus 50 initial shard reads | ~800 | ~750 |
| Admin consoles (2): teams listener (2 updates per question x 47 x 15) plus initial loads | ~3,000 | - |
| Server: member lookups, session/team reads, grading and controls | ~2,900 | ~800 |
| Initial listener loads (devices joining, refreshes) | ~1,000 | - |
| **Total, worst case** | **~24,300 (49% of daily)** | **~2,800 (14%)** |
| Realistic (about 2 phones per team) | ~17,000 (34%) | ~2,800 |

**Headroom:** one full event leaves about half the daily read quota. A full rehearsal and event on the same quota day would use about 48.5k modeled reads, leaving little room for other project activity. Rehearse on the emulators or on another day. The emulator model is an estimate; confirm actual usage in the Firebase console after a real-project run.

**If the quota is hit**, Firestore rejects reads and the quiz stalls. Mitigations:
- (a) Check usage in the Firebase console before going live.
- (b) The simulator reports how many listener events it received per run (about the number of reads), and the load test (section 11.2) fails if the projected full-event total exceeds 35k.
- (c) Emergency fallback: upgrade the project to Blaze in the console (about 2 minutes, needs a card; this event would cost well under $0.10).

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
- [x] **Pure logic:** the existing tests for engine, scoring, views, clock, validation, csv-import, export and env keep passing.
- [x] **Security rules** (`@firebase/rules-unit-testing` against the emulator):
  - [x] Anonymous users can read the session and counter shards and **nothing else**.
  - [x] Anonymous and signed-in users **cannot write anywhere**.
- [x] A member can read their own team document, cannot read another team's document, and cannot read audit answer documents (admin-only).
  - [x] A non-admin **cannot** read `questions` (no `correctIndex` leak).
  - [x] Admins can read everything and still cannot write from the client.
- [x] **Auth bridge:** `/api/firebase-token` returns 401 when signed out. The token carries `email`, and `admin` is true only for admins. A token for a non-heritage email is refused.
- [x] **Services** (emulator), porting every current service test:
  - [x] Session create assigns a unique six-digit code. Collision retry is implemented but not forced by an automated test.
  - [x] The full lifecycle, and a stale `stateVersion` returning 409.
  - [x] Restart deletes only the current question's answers.
  - [x] Join rejects: not registered, ineligible, check-in closed. A checked-in member can re-join after close. Concurrent joins produce one check-in.
  - [x] Taker rules: lead only, lobby only, members only. Changing the taker clears the device.
  - [x] Answer checks: too early, too late (grace), not the taker, wrong device, wrong question, bad option. A duplicate keeps the first answer. A concurrent double-submit stores one answer.
  - [x] Reveal grades correctly: points, time clamp, and the unanswered penalty. The leaderboard matches `computeStandings`, including shared ranks. End grades an ungraded current question.
  - [x] No correctness is visible anywhere a participant can read before reveal.
  - [x] Question CRUD, reorder, CSV import (append and replace), and everything locked while live.
  - [x] **Team sync:**
    - [x] It creates teams.
    - [x] Re-sync updates roster fields and **preserves check-in, taker, device and scores**.
    - [x] A team removed in MongoDB becomes ineligible and is not deleted.
    - [x] Admin emails are copied to `quizAdmins`.
    - [x] The sync module uses no MongoDB write methods (guard test).

- [x] 50 teams join (47 eligible, 3 rejected with the correct errors).
- [x] Each question: teams answer with a random delay, about 10% don't answer, and negative cases run (lead-in, teammate, wrong device, duplicate, late).
- [x] **Scores for every team match** the simulator's own tally after the end.
- [x] **Propagation:** p95 time from a host action to a simulated phone's listener firing is under **1 s**.
- [x] Answer latency p95 is under **1 s**. There are 0 server errors.
- [x] The simulator counts listener events received (about the number of reads) and extrapolates to the worst case (200 devices). **It fails if the projection exceeds 35k reads or 10k writes.**
- [ ] The actual Firestore usage from the console after the real-project run is recorded and within the §9.3 budget.
- [x] A test asserts the phone app opens exactly 2 listeners and no collection listeners (design rule 9.2.2).

**Latest local verification:** `npm test` — 21 test files / 121 tests passed. `npx tsc --noEmit` passed; `npm run lint` passed with one pre-existing unused-variable warning in `components/motion-primitives/text-effect.tsx:183`; `npm run build` passed. Production build + emulator load test passed: 47 eligible check-ins, 15 questions, 0 score mismatches, 0 server errors, 201 ms p95 host propagation, 127 ms p95 answer latency, 24,241 projected reads and 2,761 estimated writes. The real Firebase project usage check and all manual/deployed checklist items are still pending.

### 11.3 Manual browser checklist (3 windows: admin, projector, phone; plus an incognito teammate)
**Setup**
- [ ] `/admin` redirects to sign-in when signed out; a non-admin sees "Admins only"; an admin sees the sessions list.
- [ ] Create a session, pick the event, **Sync teams**: the counts shown match the main site's registrations.
- [ ] Import the questions CSV (a bad file shows row errors; a good file previews and then imports). Edit, reorder, delete.

**Lobby**
- [ ] The projector shows the QR code and join code; the counter starts at 0.
- [ ] Phone: join by code, sign in, auto check-in. The projector counter goes up **without refreshing**. (The phone lobby intentionally shows no live team count.)
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
| 1 | Create the Firebase project (Firestore in `asia-south1`, production mode), register a Web app, generate a service-account key, add the leads as members | **Aheen** (pending) |
| 2 | Install Java 21 and the Firebase CLI; set up the emulators | Done locally |
| 3 | Firebase config and the Admin SDK module; emulator wiring; security rules and rules tests | Done; emulator-verified |
| 4 | Auth bridge (`/api/firebase-token`, client sign-in hook, sign-out) | Done; emulator-tested |
| 5 | Port the services to Firestore (sessions, questions, teams, answers, grading at reveal, counts); port the service tests | Done; emulator-tested |
| 6 | Team sync (API + script + guard test) and the admin "Sync teams" UI | Done; sync module tested; live Mongo credential still required |
| 7 | Replace polling with listener hooks in the phone, projector and admin UIs; add the `/api/time` clock sync | Done; phone listener contract tested |
| 8 | Always-on leaderboard page `/present/<code>/board` | Done; production build passed |
| 9 | Seed script for the emulator; simulate script with listener-propagation timing; run the load test | Done; emulator load test passed |
| 10 | Remove Mongo runtime code (keep only `lib/sync/`); update the runbook, `aheen.md` and the case studies | Done; Mongo remains only for read-only sync |
| 11 | Write `docs/quiz-system.md`, the detailed "what is built" document | Done; see also `docs/mega-quiz-report.md` |
| 12 | Vercel env vars, domain and DNS; Google redirect URIs | **Leads** (messages sent 2026-09-26) |
| 13 | Deployed smoke test (§11.3 "Deploy") and the venue dry run | **Aheen** + team |

Local implementation and emulator work are complete. Task 1 and tasks 12–13 require the project owner and event team; the Firebase emulator does not replace real Google OAuth, live Firestore quota, deployed-browser, or venue-network verification.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Quota exceeded on the rehearsal day | Budget in §9.3 (about 49% of daily reads for one worst-case run). Rehearse with the emulators or on another day. The simulator enforces a 35k projection. Blaze upgrade is a fallback |
| Question text is delivered with the lead-in, so a curious user could peek about 3 s early in devtools | Accepted: the UI hides it, proctors are present, and the correct answer is never sent before reveal. The alternative (a delayed server write) is unreliable on serverless |
| A read-write MongoDB key sits in Vercel | Sync is isolated to read-only calls with a guard test; swap to a read-only user when available |
| Team registrations change after sync | "Last synced" is shown in the console; re-sync is safe at any time and preserves quiz state |
| A service-account key leak | Stored only in Vercel env and `.env.local` (git-ignored); rotate from the Firebase console if exposed |
| The exFAT drive (build tooling) | The existing webpack and readlink fixes are kept; the emulators run fine from any drive |

## 14. Open items
- **Lead:** which event the quiz is for (only needed on event day).
- **Lead:** Vercel access, DNS, and Google redirect URIs (messages sent).
- **Aheen:** create the Firebase project (task 1).

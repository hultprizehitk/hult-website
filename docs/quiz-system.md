# Hult Prize Quiz System

The quiz is a standalone Next.js app in `quiz/`. Organizers control a host-paced multiple-choice quiz, teams join on phones, and public projector pages show check-in, question, results, and leaderboard state.

## What runs where

| Part | Responsibility |
|---|---|
| Next.js route handlers | Authenticate users, validate input, perform all writes, and enforce quiz rules |
| Firestore | Sessions, question bank, team snapshots, check-ins, answers, scores, and live counters |
| Firestore web SDK | Read-only live listeners in participant, projector, board, and admin pages |
| NextAuth | Google login for `@heritageit.edu.in`; development login for local use |
| Firebase Auth custom token | Bridges a NextAuth identity into Firebase claims used by Firestore rules |
| MongoDB | Read source event registrations and site admin roles only during event selection and team sync |
| Vercel | Hosts the Next.js application; Firebase handles the database and custom-token auth |

The live quiz does not depend on MongoDB after its roster is copied into Firestore. Firebase Hosting and Cloud Functions are not used.

## Screens

Flow and screen spec: [quiz UX overhaul](./superpowers/specs/2026-09-28-quiz-ux-overhaul.md).

- `/`: redirects to `/quiz`.
- `/quiz`: the event's phone app (session `470009`). Check-in, "Quiz is starting", 3-2-1 lead-in, question with timer, answer lock, results (verdict, time, rank with movement, top 10) and final rank. Teammates of the player see "Playing on X's phone".
- `/s/<code>`: the same phone app for any other session (emulator seed `424242`).
- `/present/<code>`: public projector view: QR and teams in, "Quiz is starting", question and answered count, results (answer bars + top 10 with time on this question), podium.
- `/present/<code>/board`: always-on second-screen leaderboard.
- `/admin`: the event console (session `470009`, created on first visit). `/admin/s/<code>` opens any other session.

## Firestore layout and access

- `quizSessions/{code}`: public session state. Correct answers and distributions appear only after reveal.
- `quizSessions/{code}/counts/{teamId}`: public per-team counter shard for eligible/check-in/answer state. The projector sums these shards; each team writes only its own shard to avoid counter contention.
- `quizSessions/{code}/questions/{qid}`: full questions, including correct answers; admin read only.
- `quizSessions/{code}/teams/{teamId}`: roster, desk-scan flag, check-in, the team's one seat (`takerEmail` + `deviceId`), current answer, and graded scores; team members and admins can read their team. Membership is checked against the Firebase uid (the lowercased email): Firebase strips an `email` custom claim from ID tokens.
- `quizSessions/{code}/answers/{teamId}_{qid}`: audit record; admin read only.
- `quizAdmins/{email}`: synced site admins and manually managed quiz admins.

Firestore security rules deny every browser write. API handlers use the Firebase Admin SDK and validate membership/admin status. Phones subscribe to only the public session and their own team document. No client subscribes to the answers collection.

## Quiz lifecycle

1. Setup (`draft`): the console auto-syncs the event's confirmed and submitted teams from MongoDB every 3 minutes (only changed teams are written), plus a manual Sync button. Questions are edited on the Questions tab.
2. Check-in (`lobby`): members must have been scanned at the venue desk (checked at sign-in and again at the team's first check-in). The first member to open `/quiz` checks the team in and takes the team's single seat (one phone per team).
3. Start: check-in closes for good (no late teams) and every screen shows "Quiz is starting". Sync is refused from here on.
4. Each question, strictly in order: Next opens it after a 3-second lead-in; the answer window closes on its own (+15s, Close early and Restart are available). Only the seat holder on the bound device can answer; the first answer counts.
5. Show results grades the question once, charges unanswered teams the full time, and publishes the answer, distribution and top 10 (with each team's time on the question and previous rank).
6. After the last question, Final results ends the quiz. End quiz (danger zone) ends early and grades a running question. Reset for event (typed confirmation) archives the run and clears scores, answers, check-ins and seats.

Scores use fixed question points. Ties are ordered by total answer time; exact ties share a rank. Admin state transitions use `stateVersion` to reject stale controls.

## Local setup and verification

Copy `quiz/.env.example` to `.env.local`. The emulator configuration uses the demo project ID and requires Java 21. The Firebase project and service account are not needed for local development.

```powershell
cd quiz
npm install
npm run emulators
```

In separate terminals, seed and run the app:

```powershell
npm run seed
npm run dev
npm test
```

`npm run seed` is hard-guarded to Firestore Emulator + project `demo-hult-quiz`. It writes one demo session, 50 teams (47 eligible), and 15 edge-case questions. `npm test` runs Vitest and Firestore rule tests in the emulator (set `SKIP_MONGO_TESTS=1` where the in-memory MongoDB binary cannot be downloaded). `npm run simulate` runs a 50-team API lifecycle and measures listener propagation and estimated usage against a production build connected to the emulator. `npm run sync-teams -- 123456` syncs the event's teams and site admins for an existing session; it needs a real MongoDB read connection and Firebase credentials (or emulator config).

## Before production

The Firebase project, `asia-south1` Firestore database, Firebase web config, service-account secret, Vercel environment, domain/DNS, and OAuth redirect URI still need owner access. The real Firebase quota and venue Wi-Fi rehearsal must be checked before event day. See [the operator runbook](./quiz-runbook.md) and [the Firebase PRD](./superpowers/specs/2026-09-26-quiz-firebase-prd.md).

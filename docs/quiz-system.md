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

- `/`: enter the six-digit join code.
- `/s/<code>`: participant check-in, lobby/taker picker, question timer, answer lock, reveal, leaderboard, and final rank.
- `/present/<code>`: public projector view with QR, check-in count, question, answer count, results, and podium.
- `/present/<code>/board`: always-on second-screen leaderboard.
- `/admin`: create a session and choose its event.
- `/admin/s/<code>`: live controls, question editor/CSV import, teams/check-in, taker/device controls, and CSV export.

## Firestore layout and access

- `quizSessions/{code}`: public session state. Correct answers and distributions appear only after reveal.
- `quizSessions/{code}/counts/{teamId}`: public per-team counter shard for eligible/check-in/answer state. The projector sums these shards; each team writes only its own shard to avoid counter contention.
- `quizSessions/{code}/questions/{qid}`: full questions, including correct answers; admin read only.
- `quizSessions/{code}/teams/{teamId}`: roster, check-in, taker/device binding, current answer, and graded scores; team members and admins can read their team.
- `quizSessions/{code}/answers/{teamId}_{qid}`: audit record; admin read only.
- `quizAdmins/{email}`: synced site admins and manually managed quiz admins.

Firestore security rules deny every browser write. API handlers use the Firebase Admin SDK and validate membership/admin status. Phones subscribe to only the public session and their own team document. No client subscribes to the answers collection.

## Quiz lifecycle

1. An admin creates a draft and syncs the selected event's eligible teams.
2. Opening the lobby lets a team member check in; its lead can select the taker.
3. Start closes check-in and schedules the first question after the three-second lead-in.
4. The taker submits one answer from the bound device. The answer is stored without correctness; repeats keep the first choice.
5. Reveal grades checked-in teams, charges unanswered teams the full question time, stores standings, and exposes correctness.
6. The host shows the leaderboard and advances questions, then ends the quiz. A team that checked in late receives the full-time tie-break penalty for questions already graded.

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

`npm run seed` is hard-guarded to Firestore Emulator + project `demo-hult-quiz`. It writes one demo session, 50 teams (47 eligible), and 15 edge-case questions. `npm test` runs Vitest and Firestore rule tests in the emulator. `npm run simulate` runs a 50-team API lifecycle and measures listener propagation and estimated usage against a production build connected to the emulator. `npm run sync-teams -- 123456` syncs the event's teams and site admins for an existing session; it needs a real MongoDB read connection and Firebase credentials (or emulator config).

## Before production

The Firebase project, `asia-south1` Firestore database, Firebase web config, service-account secret, Vercel environment, domain/DNS, and OAuth redirect URI still need owner access. The real Firebase quota and venue Wi-Fi rehearsal must be checked before event day. See [the operator runbook](./quiz-runbook.md) and [the Firebase PRD](./superpowers/specs/2026-09-26-quiz-firebase-prd.md).

# Quiz Runbook

Operator guide for the standalone app in `quiz/`. The migration design and quota assumptions are in the [Firebase PRD](./superpowers/specs/2026-09-26-quiz-firebase-prd.md); system components are described in [quiz-system.md](./quiz-system.md).

## Local emulator setup

Requirements: Node.js, Java 21, and the npm dependencies installed in `quiz/`. Copy `quiz/.env.example` to `quiz/.env.local` for local-only settings. The example targets the `demo-hult-quiz` emulator and does not need a Firebase project or service account.

Open separate terminals from `quiz/`:

```powershell
npm install
npm run emulators
```

```powershell
npm run seed
```

```powershell
npm run dev
```

Open `http://localhost:3001`. The seed command replaces emulator session `#424242` with 50 demo teams and 15 questions; 47 teams are eligible. The dev login is `dev.admin@heritageit.edu.in`; participant accounts use `dev.tNN.lead@heritageit.edu.in` and `dev.tNN.m1..m3@heritageit.edu.in`.

Run the emulator tests from another terminal:

```powershell
npm test
```

## Production build load test

Keep the emulators running. Stop the dev server, then build and start the production server:

```powershell
$env:QUIZ_UNSAFE_LOADTEST_DEV_LOGIN = "true"
npm run build
npm run start
```

In a separate terminal, reset the seed session and run the load simulation:

```powershell
npm run seed
npm run simulate
```

The unsafe dev-login override is for a local production build only. Never set it in Vercel. The simulation models 200 phones, a projector, a board, and two admin consoles; it measures host-action listener propagation, answer latency, listener reads, and estimated writes. It stops successfully only below the PRD thresholds of 1 s p95 propagation, 1 s p95 answer latency, 35k projected reads, and 10k writes.

## Live project configuration

Create the Firebase project before using the production deployment. The PRD specifies Firestore in `asia-south1`; the region cannot be changed after database creation. Configure:

- Public Firebase web config: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`.
- Server credential: `FIREBASE_SERVICE_ACCOUNT` (raw or base64 service-account JSON).
- Existing NextAuth settings: `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAILS`.
- `MONGODB_URI` for the read-only team and admin-role sync. Use a database credential restricted to reads when available.
- Do not set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`, `QUIZ_DEV_LOGIN`, or `QUIZ_UNSAFE_LOADTEST_DEV_LOGIN` in production.

Register the quiz web app in the Firebase project and add the quiz's Google OAuth callback URL to the OAuth client. Deploy only after Firebase and Vercel env values, domain, and DNS are configured. A real-project Firestore quota check and venue Wi-Fi rehearsal are still required; emulator results do not verify those external systems.

To sync teams from a terminal for an existing session, set the environment listed above in `.env.local`, then run `npm run sync-teams -- <six-digit-session-code>`. The sync script reads the session's event ID from Firestore, loads event teams and site admin emails from MongoDB, and writes the roster snapshots to Firestore. The admin console's **Sync teams** button calls the same service.

## Before the event

1. Open `/admin`, create a session, and select the correct event.
2. Use **Sync teams**. Confirm eligible/new/updated counts and the last-sync time against event registrations.
3. Add questions or import a CSV; confirm question order and answers with the quiz lead.
4. Open `/present/<code>` on the projector and `/present/<code>/board` on the second display.
5. Check Firestore daily usage before a rehearsal and event. The modeled worst case is about 24.3k reads and 2.8k writes for 15 questions and 47 teams; the production-build emulator run projected 24,241 reads and 2,761 writes. The standard Firestore free quota is 50k reads/day and 20k writes/day. A rehearsal and event on the same quota day would use almost all modeled reads, before any other project traffic.
6. Complete the manual checklist with an admin, projector, phone, and teammate phone. Repeat on venue Wi-Fi with at least three real phones.

## Event-day flow

| Step | Admin console | Projector | Phones |
|---|---|---|---|
| Doors open | Open lobby | QR, join code, live check-in count | Open link, sign in, check in |
| Before start | Verify teams and questions | Lobby screen | Lead may choose the taker |
| Each question | Start, extend/close, reveal, leaderboard, next | Timer, answered count, results, top 10 | Taker answers; team sees locked result |
| Finish | End quiz, export CSV | Podium and final leaderboard | Final team rank |

## Recovery

| Situation | Action |
|---|---|
| Phone refreshed or briefly disconnected | Reopen the same link; Firestore listeners restore current state |
| Taker's phone died | Teams tab → reset device; taker reopens the link |
| Taker unavailable | Teams tab → change taker; submitted answers remain |
| Team missed check-in | Teams tab → check in manually |
| Question needs a clean restart | Restart question; current question's answers are cleared |
| Need more time | Add 15 seconds while the question is open |
| Need to stop | End quiz; completed questions are graded and standings are published |
| Two members answer | Only the selected taker on the bound device is accepted |

## Manual acceptance checklist

- [ ] Signed-out `/admin` redirects to sign-in; a non-admin is denied; an admin can create a session.
- [ ] Sync team totals match the selected event; repeat sync preserves quiz state.
- [ ] CSV import validates all rows before adding or replacing questions.
- [ ] Projector QR/code and check-in count update without refresh.
- [ ] Lead can change the taker in the lobby; a teammate sees the read-only state.
- [ ] Lead-in, timer, answer lock, close, reveal, results, leaderboard, and next-question flow stay in sync.
- [ ] Refresh and a 10-second network disconnect recover the phone without losing a submitted answer.
- [ ] Reset device and mid-quiz taker reassignment work.
- [ ] End publishes podium and final rank; CSV export matches standings; exact ties share rank.
- [ ] Repeat the checklist on the deployed quiz with real Google login and on venue Wi-Fi.

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

Open `http://localhost:3000/admin/s/424242` (console) and `http://localhost:3000/s/424242` (phone). The seed command replaces emulator session `#424242` with 50 demo teams and 15 questions; 47 teams are eligible. The dev login is `dev.admin@heritageit.edu.in`; participant accounts use `dev.tNN.lead@heritageit.edu.in` and `dev.tNN.m1..m3@heritageit.edu.in`.

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

The unsafe dev-login override is for a local production build only. Run `npm test` with `SKIP_MONGO_TESTS=1` where the in-memory MongoDB binary cannot be downloaded. Never set it in Vercel. The simulation models 200 phones, a projector, a board, and two admin consoles; it measures host-action listener propagation, answer latency, listener reads, and estimated writes. It stops successfully only below the PRD thresholds of 1 s p95 propagation, 1 s p95 answer latency, 35k projected reads, and 10k writes.

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

1. Open `/admin` (creates session `470009` for Hult Ascend on first visit). Confirm the checklist: questions ready, teams synced, the team count matches the main site's confirmed + submitted teams.
2. Questions tab: add or import the CSV, set order, use "Set for all" for points/time. Questions lock at Start.
3. Open the projector laptop on `/present/470009` in full screen (Projector button, or copy the link). The admin laptop is never projected.
4. Check Firestore daily usage. The modeled worst case is about 21.5k reads and 2.8k writes for 15 questions and 47 teams (standard free quota: 50k reads, 20k writes per day, reset at 12:30 IST). Rehearse on a different quota day from the event.
5. Run the manual test script in [quiz-manual-test.md](./quiz-manual-test.md) on the deployed quiz with real phones, then Reset for event.

## Event-day flow

The console's one primary button (or the N key) walks the whole event.

| Step | Admin console | Projector | Phones |
|---|---|---|---|
| Doors open | Open check-in | QR, "Scan to check in", teams in | Scan, sign in (desk-scanned only), checked in; teammates see "Playing on X's phone" |
| Start | Start quiz (confirms who is locked out) | Quiz is starting | Quiz is starting; unchecked teams see "Check-in closed" |
| Each question | Question N, then Show results (confirms if the timer is still running) | 3-2-1, question, answered count, then answer bars + top 10 with time on this question | 3-2-1, question, Answer locked, then verdict, time, rank and movement, top 10 |
| Finish | Final results, CSV | Podium with times | Final rank |

## Recovery

All team fixes are in the Teams panel on the Run tab (search by team, code, member name or email; "Attention" lists teams in without a phone, teams that missed the last question, and desk-scanned teams not yet in).

| Situation | Action |
|---|---|
| Phone refreshed or briefly offline | Reopen the same link; listeners restore the state and a submitted answer stays locked |
| Player opens the quiz on another device | That device shows "Play here"; tapping it moves the seat (the old device shows "Playing on another device") |
| Player's phone died, a teammate will play | Teams panel: Switch player to that member; their phone takes over on its own |
| Nobody on the team can find the player | Teams panel: Free seat; any member taps "Play on this phone" |
| Member says "Scan your pass at the desk" | Scan them on the main-site scanner, then they tap Try again |
| Question needs a clean restart | Restart question; its answers are cleared |
| Need more time | +15s while the question is open |
| Must stop early | Danger zone: End quiz; a running question is graded |
| After the rehearsal | Danger zone: Reset for event (type RESET); the run is archived |
| Team not in when Start was pressed | Cannot join (no late teams) |

## Manual acceptance

See [quiz-manual-test.md](./quiz-manual-test.md).

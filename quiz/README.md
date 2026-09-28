# Hult Prize Quiz

Standalone Next.js quiz app. Quiz state, questions, answers, scores, and live updates use Firestore. NextAuth handles Google sign-in; a server-minted Firebase custom token gives the browser read-only Firestore access. MongoDB is used only to read event teams and site admin roles during sync.

## Local development

Use Node.js and Java 21. Copy `.env.example` to `.env.local`, then run:

```bash
npm install
npm run emulators    # keep running in its own terminal
npm run seed         # demo session #424242, 50 teams, 15 questions
npm run dev          # http://localhost:3000
npm test             # Firebase Emulator Suite + Vitest
```

Run `npm run sync-teams -- <six-digit-session-code>` to sync an existing session from the main site's MongoDB. It requires a MongoDB read connection and Firebase credentials.

Dev login is available at `/signin` when `QUIZ_DEV_LOGIN=true` and the app runs in development mode. `npm run seed` refuses to run unless both the Firestore emulator and the `demo-hult-quiz` project ID are set.

## Production load simulation

Build and start the production app against the local emulators, then run `npm run simulate`. The simulator expects session `#424242`; it exercises the API, team and answer rules, scoring, listener propagation, projected reads/writes, and CSV export. See [the quiz runbook](../docs/quiz-runbook.md) for commands and limits.

## Routes

| Route | Purpose |
|---|---|
| `/` | Redirects to `/quiz` |
| `/quiz` | Event phone app (session `470009`) |
| `/s/<code>` | Phone app for another session (seed: `424242`) |
| `/present/<code>` | Projector |
| `/present/<code>/board` | Always-on leaderboard |
| `/admin` | Event console; `/admin/s/<code>` for another session |

## Documentation

- [Flow and screens (UX overhaul spec)](../docs/superpowers/specs/2026-09-28-quiz-ux-overhaul.md)
- [Manual test script](../docs/quiz-manual-test.md)
- [What the quiz system contains](../docs/quiz-system.md)
- [Full implementation and test report](../docs/mega-quiz-report.md)
- [Operator runbook](../docs/quiz-runbook.md)
- [Firebase migration PRD](../docs/superpowers/specs/2026-09-26-quiz-firebase-prd.md)
- [Original MongoDB design spec (superseded)](../docs/superpowers/specs/2026-09-24-quiz-design.md)

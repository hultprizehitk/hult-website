# Hult Prize Website — Project Orientation

## Apps

| Folder | Role |
|---|---|
| `client-v3/` | Current main website: Next.js, MongoDB, NextAuth, teams, events, and admin portal |
| `quiz/` | Standalone live quiz app; Next.js, Firebase Auth custom-token bridge, Firestore runtime |
| `client/` | Legacy full application; reference only |
| `client-v2/` | Old frontend snapshot; inactive |

The quiz remains its own app and deployment. Its current backend requirements are in [the Firebase PRD](docs/superpowers/specs/2026-09-26-quiz-firebase-prd.md). The earlier MongoDB design and implementation plan are historical references; they do not describe the quiz's current storage or transport.

## Main site

The public Hult Prize HITK site and organizer portal run from `client-v3/`. Students authenticate with Google and form teams, register for events, and submit applications. The main app continues to use MongoDB; the quiz migration does not change it.

Quiz roster sync reads the selected event's teams and admin roles from the main site's MongoDB collections. After sync, the live quiz reads and writes only Firestore. MongoDB credentials are not used by participant, projector, board, or admin quiz screens.

## Quiz status

Implemented in `quiz/`:

- `/quiz` (and `/s/<code>`): sign in, check in, play on the team's one phone, results and final rank. `/` redirects here.
- `/present/<code>`: public projector view.
- `/present/<code>/board`: live second-screen leaderboard.
- `/admin` (and `/admin/s/<code>`): one-button run console, questions, teams help desk, auto team sync, CSV export, reset for event.

Flow, screens and the testing checklist: [quiz UX overhaul spec](docs/superpowers/specs/2026-09-28-quiz-ux-overhaul.md). Manual script for the admin team: [docs/quiz-manual-test.md](docs/quiz-manual-test.md).
- Firestore Emulator rules and service coverage, emulator-only demo seed, and a production-build API/listener load simulator.

From `quiz/`, the primary local commands are `npm run emulators`, `npm run seed`, `npm run dev`, `npm test`, `npm run build`, and `npm run simulate`. Java 21 is required for Firebase emulators. See [the system guide](docs/quiz-system.md) and [the runbook](docs/quiz-runbook.md).

## Outstanding owner setup

The emulator suite and code do not need the live Firebase project. The full implementation and emulator load results are in [the mega quiz report](docs/mega-quiz-report.md). Before the quiz can be deployed and rehearsed against production, an owner must create the Firebase project with Firestore in `asia-south1`, register its web app, provide the service-account secret, configure Vercel and the quiz domain/DNS, and add the quiz Google OAuth callback URL. The event selection and real roster sync also require a working Mongo read credential. A deployed smoke test and venue Wi-Fi rehearsal remain event-team tasks.

## Working rules

- The root `AGENTS.md` applies, with its documented `quiz/` exception: the quiz's Firebase PRD supersedes the older general MongoDB runtime direction for this app.
- Do not put demo identities or sample data into production UI. Demo teams/questions are seeded only into the hard-guarded `demo-hult-quiz` emulator.
- Keep UI copy brief, use lucide icons sparingly, and do not add emoji to code or UI.
- Work in `quiz/` for quiz changes. Root `docs/` holds shared engineering notes and runbooks.

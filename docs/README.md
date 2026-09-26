# Hult Prize Website — Engineering Docs

Docs about problems we hit, how we diagnosed them, and the reusable tooling built along the way.

| Doc | What it covers |
|---|---|
| [Debug Logger Guide](./debug-logger.md) | The categorized console logger (`lib/debug-logger.ts`): usage, enabling/disabling, how to add categories |
| [Case Study: Stuck on Intro Page](./case-study-stuck-on-intro-page.md) | Site frozen on loading screen on one laptop — full investigation from wrong hypotheses to root cause (`prefers-reduced-motion`), plus lessons for any Three.js/GSAP project |
| [Case Study: Turbopack on exFAT](./case-study-turbopack-exfat-junctions.md) | Quiz API routes all returned 500 because Turbopack cannot create junctions on the exFAT external drive; fixed by running the quiz on webpack |
| [Quiz Runbook](./quiz-runbook.md) | Setup, load test, event-day flow and recovery playbook for the live quiz app (`quiz/`) |
| [Quiz Design Spec](./superpowers/specs/2026-09-24-quiz-design.md) | Decisions, data model, state machine and scoring for the quiz |
| [Quiz Implementation Plan](./superpowers/plans/2026-09-24-quiz.md) | Task-by-task build plan for the quiz |
| [Quiz on Firebase PRD](./superpowers/specs/2026-09-26-quiz-firebase-prd.md) | Plan to move the quiz to Firestore + NextAuth custom-token bridge, with cost model and full testing checklist |

## Quick reference

- Debug logs on any page: append `?debug=intro` (or `?debug=all`) to the URL
- Disable/reset: `?debug=none`
- In-console control: `__hultDebug.enable("intro")`, `__hultDebug.categories()`

# Hult Prize Website — Engineering Docs

Docs about problems we hit, how we diagnosed them, and the reusable tooling built along the way.

| Doc | What it covers |
|---|---|
| [Debug Logger Guide](./debug-logger.md) | The categorized console logger (`lib/debug-logger.ts`): usage, enabling/disabling, how to add categories |
| [Case Study: Stuck on Intro Page](./case-study-stuck-on-intro-page.md) | Site frozen on loading screen on one laptop — full investigation from wrong hypotheses to root cause (`prefers-reduced-motion`), plus lessons for any Three.js/GSAP project |
| [Case Study: Turbopack on exFAT](./case-study-turbopack-exfat-junctions.md) | Quiz API routes all returned 500 because Turbopack cannot create junctions on the exFAT external drive; fixed by running the quiz on webpack |
| [Quiz System](./quiz-system.md) | Current architecture, screens, Firestore data model, local development, and release prerequisites |
| [Quiz Runbook](./quiz-runbook.md) | Emulator setup, quota-aware load test, event-day flow, and recovery playbook |
| [Mega Quiz Report](./mega-quiz-report.md) | Full implementation inventory, architecture, security, test results, capacity measurements, and production prerequisites |
| [Quiz UX Overhaul](./superpowers/specs/2026-09-28-quiz-ux-overhaul.md) | Current event flow, state machine, screens, fixed bugs and testing checklist |
| [Quiz Manual Test](./quiz-manual-test.md) | Step-by-step real-device test script for the admin team |
| [Quiz on Firebase PRD](./superpowers/specs/2026-09-26-quiz-firebase-prd.md) | Current product requirements, security model, cost model, and acceptance checklist |
| [Quiz Design Spec](./superpowers/specs/2026-09-24-quiz-design.md) | Original MongoDB design decisions; superseded for backend choices by the Firebase PRD |
| [Quiz Implementation Plan](./superpowers/plans/2026-09-24-quiz.md) | Original MongoDB implementation plan; retained as historical reference |

## Quick reference

- Debug logs on any page: append `?debug=intro` (or `?debug=all`) to the URL
- Disable/reset: `?debug=none`
- In-console control: `__hultDebug.enable("intro")`, `__hultDebug.categories()`

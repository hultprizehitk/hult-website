# Hult Prize Quiz

A Slido-style live quiz for Hult Prize HITK. It uses Next.js 16 (webpack), MongoDB (shared with the main site), NextAuth (Google, `@heritageit.edu.in` only), shadcn/ui, and motion-primitives, styled to match the admin dashboard.

```bash
npm install
npm run dev        # http://localhost:3001
npm run seed       # dev data: session #424242, 50 teams, 15 questions (needs ALLOW_DEV_SEED=true)
npm test           # unit + service tests
npm run build      # production build (works on exFAT via scripts/next-exfat.cjs)
npm run simulate   # 50-team load + correctness test against a running server
```

| Route | Who |
|---|---|
| `/` | join by code |
| `/s/<code>` | participant phone |
| `/present/<code>` | projector (public) |
| `/admin` | organizer console |

Code layout: pure quiz logic lives in `lib/quiz/`, Mongo models in `models/`, route handlers in `app/api/`, and UI in `components/{quiz,participant,present,admin}`.

Docs:
- `../docs/quiz-runbook.md` — setup, event day, recovery
- `../docs/superpowers/specs/2026-09-24-quiz-design.md` — design
- `../docs/case-study-turbopack-exfat-junctions.md` — why webpack, and the build launcher

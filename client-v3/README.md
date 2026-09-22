# Hult Prize HITK — Client v3

Clean, frontend-only re-organization of the live `client/` codebase using **only**
the currently-active "Kolkata" UI theme. Next.js 16 / React 19 / Tailwind v4 —
public visitor pages only. No backend.

**Visit the app**

```
npm install
npm run dev        # http://localhost:3000
```

## Pages

| Route | Description |
| --- | --- |
| `/` | Kolkata home (hero, about, events, footer, `?tweak` theme tuner) |
| `/events` | Events listing (dark Kolkata glass) + `?event=` detail & team-registration studio |
| `/team` | Organizing committee (divisions, cards, links) |
| `/team/[slug]` | Member profile with interactive 3D lanyard pass (WebGL + Rapier) |
| `/register` | **Kolkata-styled** student identity portal (was Sakura) |
| `/profile` | Student dashboard; unauthenticated users are sent to `/register` |
| `/profile/[slug]` | Legacy redirect → `/team/[slug]` |

## Scope decisions

- **Included**: home (`/`), events (`/events` + `?event=` detail/register studio),
  team (`/team`), member profile (`/team/[slug]`, 3D lanyard WebGL),
  student profile (`/profile`), and the **re-themed student identity portal
  (`/register`)** rebuilt in the Kolkata style (was the last Sakura page).
- **Excluded from v3**: admin CMS portal (`app/portal-hult-*`), QR check-in
  scanner (`app/events/checkin`), legacy Sakura pages (`test-layers`,
  `organizing-committee`), and all MongoDB/NextAuth server code
  (`models/`, `auth.ts`, `lib/mongodb.ts`, `lib/mail-logger.ts`, `app/api/admin/*`).
- FFI note: `app/profile/[slug]` is kept only as a redirect to `/team/[slug]`.

## Structure

```
app/
  api/            ← TEMPORARY frontend-only stubs (swap for client/app/api)
  events/         ← events page + EventInsideView (detail/register studio)
  profile/        ← student dashboard
  register/       ← identity portal (re-themed to Kolkata)
  team/           ← committee + [slug] SSG profile w/ 3D lanyard
  layout.tsx      ← fonts, metadata, SessionProvider, AnnouncementBanner
  globals.css     ← Tailwind v4 + Kolkata tokens/keyframes
components/
  layout/         ← SiteHeader, SiteFooter
  hero/           ← KolkataHero, GrainOverlay, HeroInterfaceOverlay
  events/         ← EventsHero, EventInsideView, TeamRegistrationWizard, TeamRosterCard, EventAuditoriumPass
  sections/       ← HeroThemeAbout, HeroThemeEvents, HeroThemeFooter (home)
  lanyard/        ← Lanyard.jsx, Lanyard.css, Lanyard.d.ts
  profile/        ← ProfileLanyardCard (WebGL)
  ui/             ← ScrollReveal, AnnouncementBanner, animated-gradient, TiltCard, button
  providers/      ← SessionProvider (auth-free mock)
  dev/            ← CardThemeDevTool (?tweak; theme tuning)
lib/
  auth-client.tsx ← mock session (SWAP POINT → next-auth)
  seed-data.ts    ← TEMPORARY event seeds (SWAP POINT → MongoDB)
  team-data.ts / profile-data.ts / heritage-parser / kolkata-layers-config / ...
hooks/
  useEventRegistration.ts
public/           ← Kolkata skyline layers, grain, Jomolhari + GoogleSans fonts,
                    lanyard card.glb, logos, team photos
```

## What's temporary (swap points)

These exist solely so the frontend works with zero backend. Each carries a
`SWAP POINT:` marker in its file header:

1. `lib/auth-client.tsx` — mock `useSession` / `signIn` / `signOut` over a
   localStorage session (mirrored to a cookie for the API stubs). Restore
   `next-auth/react` when OAuth is wired.
2. `lib/seed-data.ts` — minimal event seeds.
3. `app/api/**` — stub routes reading the seed/in-memory registries. Replace
   with the live `client/app/api` tree when MongoDB lands.

Respecting the repo rule *"NO HARDCODED MOCK DATA"*: committee members still
come from `lib/team-data.ts` / `lib/profile-data.ts` (real data), the API stubs
return empty content so the UI falls back to static data, event seeds are
clearly marked, and no fake student names exist anywhere.

## Backend swap points (when the API + auth land)

1. **Auth**: delete `lib/auth-client.tsx`, restore `next-auth/react` imports
   in `components/providers/SessionProvider.tsx`, `SiteHeader.tsx`,
   `app/events/page.tsx`, `app/profile/page.tsx`,
   `components/events/TeamRegistrationWizard.tsx`. Re-add `auth.ts`,
   `types/next-auth.d.ts`, `lib/mongodb.ts` from `client/`.
2. **Data**: delete `app/api/**` and `lib/seed-data.ts`, restore the live
   `client/app/api` tree (MongoDB models + routes).
3. **Login**: point the heritage-email form at real Google OAuth
   (`signIn("google", ...)`) and remove the demo email capture.

Registration/RSVP stubs are in-memory per request-process — lost on restart,
replaced by `models/Event`, `models/Team`, `models/EventRsvp` on swap.

## Verification

- `npm run build` — passes (static + SSG + API routes).
- `npm run lint` — same baseline findings as the live `client/` (inherited
  React-Compiler / `no-explicit-any` findings exist in the source too:
  live `client/` reports 215 problems; the new files in v3 are lint-clean).
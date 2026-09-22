/**
 * TEMPORARY frontend-only seed data for the Kolkata client v3.
 *
 * This folder ships without a backend, so the public /api routes below read
 * from this module instead of MongoDB. Every shape mirrors the live Mongo
 * models (`client/models/Event.ts`, `client/models/SiteContent.ts`) so nothing
 * on the UI changes when the backend lands.
 *
 * NOTE: Only ONE testing seed ships so the events page renders a single card
 * (card + inside/registration studio visuals). The real list comes from
 * MongoDB via the API once the backend is wired.
 *
 * SWAP POINT: delete `app/api/**` and this file, then reintroduce the live
 * `app/api` tree from `client/` once MongoDB + NextAuth are wired in.
 */

import type { PublicEvent } from "@/app/events/page";

export const SEED_EVENTS: PublicEvent[] = [
  {
    _id: "evt-kolkata-info-session",
    title: "Kickoff Info Session",
    tag: "Info Session",
    date: "2026-10-12T10:00:00.000Z",
    startDate: "2026-10-12T10:00:00.000Z",
    endDate: "2026-10-12T12:00:00.000Z",
    venue: "Heritage Auditorium, Block B",
    description: "Season briefing, theme deep-dive and judging rubric walkthrough.",
    registrationStatus: "open",
    registrationDeadline: "2026-10-10T18:30:00.000Z",
    registeredTeamsCount: 0,
    maxTeams: 60,
    minTeamMembers: 3,
    maxTeamMembers: 5,
  },
];
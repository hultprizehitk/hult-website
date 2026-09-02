/**
 * Static application configuration constants.
 * Sensitive roles and admin emails are strictly managed via MongoDB and server environment variables.
 */

export const EVENT_TAGS = [
  "Workshop",
  "Flagship",
  "Masterclass",
  "Sprint",
  "Clinic",
  "Info Session",
] as const;

export type EventTag = (typeof EVENT_TAGS)[number];

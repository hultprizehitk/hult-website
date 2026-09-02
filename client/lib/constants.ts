/**
 * Single source of truth for administrative credentials and static configuration.
 */

export const SUPER_ADMINS = [
  "harsh.raj.iotcs28@heritageit.edu.in",
  "bhoomi.ladia.aiml28@heritageit.edu.in",
] as const;

export type SuperAdminEmail = (typeof SUPER_ADMINS)[number];

/**
 * Checks if a given email belongs to the permanent Super Admin registry.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (SUPER_ADMINS as readonly string[]).includes(clean);
}

/**
 * Validates whether a user session holds Super Admin clearance,
 * checking both explicit role and permanent email list.
 */
export function isSuperAdminUser(user?: { email?: string | null; role?: string } | null): boolean {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return isSuperAdminEmail(user.email);
}

export const EVENT_TAGS = [
  "Workshop",
  "Flagship",
  "Masterclass",
  "Sprint",
  "Clinic",
  "Info Session",
] as const;

export type EventTag = (typeof EVENT_TAGS)[number];

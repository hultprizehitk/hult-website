import { adminDb } from "@/lib/firebase/admin";
import { adminEmailsFromEnv } from "@/lib/env";
import { paths } from "@/lib/quiz/fs-types";

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; admin: boolean }>();

/** Admin = listed in ADMIN_EMAILS, or mirrored from the site's admin roles into quizAdmins by team sync. */
export async function isAdminEmail(email: string): Promise<boolean> {
  const clean = email.toLowerCase().trim();
  if (adminEmailsFromEnv().includes(clean)) return true;
  const hit = cache.get(clean);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.admin;
  const snap = await adminDb().doc(paths.admin(clean)).get();
  cache.set(clean, { at: Date.now(), admin: snap.exists });
  return snap.exists;
}

export function clearAdminCache(): void {
  cache.clear();
}

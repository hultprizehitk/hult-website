import { adminDb } from "@/lib/firebase/admin";
import { SESSIONS, type SessionDoc } from "@/lib/quiz/fs-types";
import { createSession } from "@/lib/quiz/sessions";
import { readEvent, readEventTeams, readAdminEmails, HULT_ASCEND_EVENT_ID } from "@/lib/sync/mongo-read";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";

import { HULT_ASCEND_FIXED_CODE } from "./event";

export { HULT_ASCEND_FIXED_CODE };

/**
 * Returns the single dedicated session for Hult Ascend (read-only: opening the console never changes quiz state).
 * Creates it in `draft` and does a first team sync if it does not exist yet.
 */
export async function getHultAscendSession(): Promise<SessionDoc> {
  const db = adminDb();
  const byCode = await db.collection(SESSIONS).doc(HULT_ASCEND_FIXED_CODE).get();
  if (byCode.exists) return byCode.data() as SessionDoc;

  const event = await readEvent(HULT_ASCEND_EVENT_ID).catch(() => null);
  const session = await createSession(
    {
      title: "Hult Ascend Live Quiz",
      eventId: HULT_ASCEND_EVENT_ID,
      eventTitle: event?.title ?? "HULT ASCEND : The Rise Begins",
      requireSubmitted: true,
    },
    "system@heritageit.edu.in",
    HULT_ASCEND_FIXED_CODE,
  );

  try {
    const [teams, admins] = await Promise.all([readEventTeams(HULT_ASCEND_EVENT_ID), readAdminEmails()]);
    await syncTeamsToFirestore(session.code, teams, admins);
  } catch (err) {
    console.warn("[quiz] Failed to auto-sync teams during session initialization:", err);
  }

  return session;
}

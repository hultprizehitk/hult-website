import { adminDb } from "@/lib/firebase/admin";
import { SESSIONS, type SessionDoc } from "@/lib/quiz/fs-types";
import { createSession } from "@/lib/quiz/sessions";
import { readEvent, readEventTeams, readAdminEmails, HULT_ASCEND_EVENT_ID } from "@/lib/sync/mongo-read";
import { syncTeamsToFirestore } from "@/lib/sync/sync-teams";

export const HULT_ASCEND_FIXED_CODE = "470009";

/**
 * Returns the single dedicated session for Hult Ascend.
 * Auto-creates and syncs teams from MongoDB if not already initialized.
 */
export async function getHultAscendSession(): Promise<SessionDoc> {
  const db = adminDb();
  const snap = await db
    .collection(SESSIONS)
    .where("eventId", "==", HULT_ASCEND_EVENT_ID)
    .limit(1)
    .get();

  if (!snap.empty) {
    const sDoc = snap.docs[0];
    const data = sDoc.data() as SessionDoc;
    const updates: Partial<SessionDoc> = {};
    if (!data.requireSubmitted) updates.requireSubmitted = true;
    if (data.status === "draft") {
      updates.status = "lobby";
      updates.checkinOpen = true;
    } else if (data.status === "lobby" && !data.checkinOpen) {
      updates.checkinOpen = true;
    }
    if (Object.keys(updates).length > 0) {
      await sDoc.ref.update(updates);
      Object.assign(data, updates);
    }
    return data;
  }

  // Fallback: check fixed code
  const codeSnap = await db.collection(SESSIONS).doc(HULT_ASCEND_FIXED_CODE).get();
  if (codeSnap.exists) {
    const data = codeSnap.data() as SessionDoc;
    const updates: Partial<SessionDoc> = {};
    if (!data.requireSubmitted) updates.requireSubmitted = true;
    if (data.status === "draft") {
      updates.status = "lobby";
      updates.checkinOpen = true;
    } else if (data.status === "lobby" && !data.checkinOpen) {
      updates.checkinOpen = true;
    }
    if (Object.keys(updates).length > 0) {
      await codeSnap.ref.update(updates);
      Object.assign(data, updates);
    }
    return data;
  }

  // Create session for Hult Ascend
  const event = await readEvent(HULT_ASCEND_EVENT_ID);
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
    const [teams, admins] = await Promise.all([
      readEventTeams(HULT_ASCEND_EVENT_ID),
      readAdminEmails(),
    ]);
    await syncTeamsToFirestore(session.code, teams, admins);
  } catch (err) {
    console.warn("[quiz] Failed to auto-sync teams during session initialization:", err);
  }

  return session;
}

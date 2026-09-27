import { adminDb } from "@/lib/firebase/admin";
import { handle, json } from "@/lib/http";
import { SESSIONS, type SessionDoc } from "@/lib/quiz/fs-types";
import { HULT_ASCEND_EVENT_ID } from "@/lib/sync/mongo-read";

export async function GET() {
  return handle(async () => {
    const db = adminDb();
    // 1. Look for live or lobby session for Hult Ascend
    const activeSnap = await db
      .collection(SESSIONS)
      .where("eventId", "==", HULT_ASCEND_EVENT_ID)
      .where("status", "in", ["lobby", "live"])
      .limit(1)
      .get();

    if (!activeSnap.empty) {
      const doc = activeSnap.docs[0];
      const data = doc.data() as SessionDoc;
      return json({
        active: true,
        code: doc.id,
        status: data.status,
        phase: data.phase,
        title: data.title,
        eventTitle: data.eventTitle,
      });
    }

    // 2. Look for draft session for Hult Ascend
    const draftSnap = await db
      .collection(SESSIONS)
      .where("eventId", "==", HULT_ASCEND_EVENT_ID)
      .where("status", "==", "draft")
      .limit(1)
      .get();

    if (!draftSnap.empty) {
      const doc = draftSnap.docs[0];
      const data = doc.data() as SessionDoc;
      return json({
        active: true,
        code: doc.id,
        status: data.status,
        phase: data.phase,
        title: data.title,
        eventTitle: data.eventTitle,
      });
    }

    // 3. Fallback to any open session
    const anySnap = await db
      .collection(SESSIONS)
      .where("status", "in", ["lobby", "live", "draft"])
      .limit(1)
      .get();

    if (!anySnap.empty) {
      const doc = anySnap.docs[0];
      const data = doc.data() as SessionDoc;
      return json({
        active: true,
        code: doc.id,
        status: data.status,
        phase: data.phase,
        title: data.title,
        eventTitle: data.eventTitle,
      });
    }

    return json({ active: false });
  });
}

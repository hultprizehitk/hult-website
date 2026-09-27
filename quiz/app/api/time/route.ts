import { json } from "@/lib/http";

// Clock sync for timers. Firestore listeners carry no server time; this costs no Firestore reads.
export function GET() {
  return json({ serverNow: Date.now() });
}

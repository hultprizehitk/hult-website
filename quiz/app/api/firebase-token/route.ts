import { requireActor } from "@/lib/actor";
import { mintFirebaseToken } from "@/lib/firebase/token";
import { handle, json } from "@/lib/http";

// NextAuth session -> Firebase custom token (claims: email, admin) for Firestore security rules.
export async function GET(req: Request) {
  return handle(async () => {
    const actor = await requireActor(req);
    return json(await mintFirebaseToken(actor.email));
  });
}

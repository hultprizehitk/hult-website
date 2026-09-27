import { adminAuth } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/admin";
import { isHeritageEmail } from "@/lib/env";
import { QuizError } from "@/lib/quiz/errors";

export interface FirebaseTokenResult {
  token: string;
  email: string;
  admin: boolean;
}

/**
 * NextAuth -> Firebase bridge. The custom token's uid is the email; claims `email` and `admin` are what
 * firestore.rules check (token.email in memberEmails, token.admin == true).
 */
export async function mintFirebaseToken(email: string): Promise<FirebaseTokenResult> {
  const clean = email.toLowerCase().trim();
  if (!isHeritageEmail(clean)) throw new QuizError("forbidden", "College account required");
  const admin = await isAdminEmail(clean);
  const token = await adminAuth().createCustomToken(clean, { email: clean, admin });
  return { token, email: clean, admin };
}

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { isDevLoginEnabled, isHeritageEmail } from "@/lib/env";
import { QuizError } from "@/lib/quiz/errors";

export interface Actor {
  email: string;
  name: string;
}

export async function getActor(req?: Request): Promise<Actor | null> {
  if (req && isDevLoginEnabled()) {
    const devEmail = req.headers.get("x-quiz-dev-user")?.toLowerCase().trim();
    if (devEmail && isHeritageEmail(devEmail)) return { email: devEmail, name: devEmail.split("@")[0] };
  }
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return null;
  return { email, name: session?.user?.name ?? email.split("@")[0] };
}

export async function requireActor(req: Request): Promise<Actor> {
  const actor = await getActor(req);
  if (!actor) throw new QuizError("unauthenticated", "Sign in required");
  return actor;
}

export async function requireAdmin(req: Request): Promise<Actor> {
  const actor = await requireActor(req);
  if (!(await isAdminEmail(actor.email))) throw new QuizError("forbidden", "Admins only");
  return actor;
}

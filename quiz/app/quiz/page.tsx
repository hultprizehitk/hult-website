import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ParticipantApp } from "@/components/participant/ParticipantApp";
import { HULT_ASCEND_FIXED_CODE } from "@/lib/quiz/event";

export default async function QuizPage() {
  // Signed-out visitors go straight to sign-in instead of an extra "Sign in to play" screen.
  if (!(await auth())?.user?.email) redirect("/signin?callbackUrl=%2Fquiz");
  return <ParticipantApp code={HULT_ASCEND_FIXED_CODE} />;
}

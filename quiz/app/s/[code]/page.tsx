import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ParticipantApp } from "@/components/participant/ParticipantApp";
import { HULT_ASCEND_FIXED_CODE } from "@/lib/quiz/event";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code === HULT_ASCEND_FIXED_CODE) {
    redirect("/quiz");
  }
  if (!(await auth())?.user?.email) redirect(`/signin?callbackUrl=${encodeURIComponent(`/s/${code}`)}`);
  return <ParticipantApp code={code} />;
}

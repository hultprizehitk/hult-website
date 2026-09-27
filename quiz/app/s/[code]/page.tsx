import { redirect } from "next/navigation";
import { ParticipantApp } from "@/components/participant/ParticipantApp";
import { HULT_ASCEND_FIXED_CODE } from "@/lib/quiz/hult-ascend";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code === HULT_ASCEND_FIXED_CODE) {
    redirect("/quiz");
  }
  return <ParticipantApp code={code} />;
}

import { ParticipantApp } from "@/components/participant/ParticipantApp";
import { HULT_ASCEND_FIXED_CODE } from "@/lib/quiz/event";

export default function QuizPage() {
  return <ParticipantApp code={HULT_ASCEND_FIXED_CODE} />;
}

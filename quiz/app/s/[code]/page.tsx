import { ParticipantApp } from "@/components/participant/ParticipantApp";

export default async function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ParticipantApp code={code} />;
}

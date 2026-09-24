import { PresentApp } from "@/components/present/PresentApp";

export default async function PresentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PresentApp code={code} />;
}

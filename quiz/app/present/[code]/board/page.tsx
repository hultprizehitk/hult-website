import { BoardApp } from "@/components/present/BoardApp";

export default async function BoardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BoardApp code={code} />;
}

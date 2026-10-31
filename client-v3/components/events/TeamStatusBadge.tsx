import StatusBadge from "@/components/ui/StatusBadge";

export default function TeamStatusBadge({
  status,
  memberCount,
  minMembers,
  isClosed = false,
}: {
  status?: "forming" | "ready" | "submitted";
  memberCount: number;
  minMembers: number;
  isClosed?: boolean;
}) {
  if (status === "submitted") return <StatusBadge tone="success">Submitted</StatusBadge>;
  if (isClosed) return <StatusBadge tone="danger">Not submitted</StatusBadge>;
  if (memberCount >= minMembers) return <StatusBadge tone="info">Ready to submit</StatusBadge>;
  return <StatusBadge tone="warning">Forming · {minMembers - memberCount} more needed</StatusBadge>;
}

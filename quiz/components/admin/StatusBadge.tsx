import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/lib/quiz/types";

// Dot + label status style used in client-v3/app/admin/teams/page.tsx.
const STYLE: Record<SessionStatus, { dot: string; text: string; label: string }> = {
  draft: { dot: "bg-neutral-500", text: "text-neutral-400", label: "Draft" },
  lobby: { dot: "bg-amber-400", text: "text-amber-300", label: "Lobby" },
  live: { dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]", text: "text-emerald-400", label: "Live" },
  ended: { dot: "bg-sky-400", text: "text-sky-300", label: "Ended" },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const s = STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", s.text)}>
      <span className="relative flex size-1.5">
        {status === "live" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={cn("relative inline-flex size-1.5 rounded-full", s.dot)} />
      </span>
      {s.label}
    </span>
  );
}

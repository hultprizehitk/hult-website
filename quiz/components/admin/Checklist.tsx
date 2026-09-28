import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Counts } from "@/lib/quiz/types";

/** Pre-start checks shown during setup and check-in. */
export function Checklist({ questionCount, lastSyncMs, counts, attention }: { questionCount: number; lastSyncMs: number | null; counts: Counts; attention: number }) {
  const items = [
    { ok: questionCount > 0, label: questionCount > 0 ? `${questionCount} questions ready` : "No questions yet" },
    { ok: lastSyncMs !== null, label: lastSyncMs ? `Teams synced ${new Date(lastSyncMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Teams not synced" },
    { ok: counts.checkedIn > 0, label: `${counts.checkedIn} of ${counts.eligible} teams in` },
    { ok: attention === 0, label: attention === 0 ? "No teams need attention" : `${attention} ${attention === 1 ? "team needs" : "teams need"} attention` },
  ];
  return (
    <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
      <p className="mb-3 font-mono text-xs uppercase tracking-wider text-white/60">Before start</p>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.label} className={cn("flex items-center gap-2 text-sm", i.ok ? "text-white/80" : "text-amber-300")}>
            {i.ok ? <CheckCircle2 className="size-4 text-emerald-400" /> : <CircleAlert className="size-4" />}
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

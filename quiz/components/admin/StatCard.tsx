import { cn } from "@/lib/utils";

// Coloured metric tiles from client-v3/app/admin/components/LiveEventManager.tsx.
const TONES = {
  neutral: { box: "border-white/15 bg-[#0e0e12] hover:border-white/25", label: "text-white/60", value: "text-white" },
  emerald: { box: "border-emerald-500/30 bg-[#0a1f18] shadow-emerald-950/20 hover:border-emerald-400/50", label: "text-emerald-400", value: "text-emerald-300" },
  amber: { box: "border-amber-500/30 bg-[#241a08] shadow-amber-950/20 hover:border-amber-400/50", label: "text-amber-400", value: "text-amber-300" },
  sky: { box: "border-sky-500/30 bg-[#081a2e] shadow-sky-950/20 hover:border-sky-400/50", label: "text-sky-400", value: "text-sky-300" },
} as const;

export function StatCard({
  label,
  value,
  tone = "neutral",
  hint,
  progress,
}: {
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof TONES;
  hint?: React.ReactNode;
  progress?: number;
}) {
  const t = TONES[tone];
  return (
    <div className={cn("rounded-3xl border p-5 shadow-2xl transition-all", t.box)}>
      <div className={cn("mb-2 font-mono text-xs uppercase tracking-wider", t.label)}>{label}</div>
      <div className={cn("mb-1 text-2xl font-black tabular-nums sm:text-3xl", t.value)}>{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className={cn("h-full rounded-full transition-all duration-500", tone === "neutral" ? "bg-white" : `bg-current ${t.value}`)} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      {hint && <div className="mt-1 text-[11px] text-white/50">{hint}</div>}
    </div>
  );
}

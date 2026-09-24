import { cn } from "@/lib/utils";

/** Segmented control from client-v3/app/admin/teams/page.tsx. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex w-fit items-center rounded-xl border border-white/10 bg-white/[0.04] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
              active ? "bg-white font-semibold text-black shadow-sm" : "text-white/60 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <span>{o.label}</span>
            {o.count !== undefined && (
              <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] leading-none", active ? "bg-black/10 font-bold text-black" : "bg-white/10 text-white/70")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

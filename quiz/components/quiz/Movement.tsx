import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rank change since the previous question; nothing when unchanged or first ranking. */
export function Movement({ rank, prevRank, className }: { rank: number; prevRank?: number | null; className?: string }) {
  if (prevRank == null || prevRank === rank) return null;
  const up = rank < prevRank;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono text-[11px]", up ? "text-emerald-400" : "text-rose-400", className)} aria-label={up ? "Up" : "Down"}>
      <Icon className="size-3" />
      {Math.abs(prevRank - rank)}
    </span>
  );
}

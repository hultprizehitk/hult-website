"use client";

import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion-primitives/animated-number";
import { cn } from "@/lib/utils";
import { formatMs } from "@/lib/format";
import type { Standing } from "@/lib/quiz/types";

/** time = "total" (tie-break total) or "last" (time on the question just graded; "-" when unanswered). */
export function Leaderboard({
  rows,
  highlightTeamId,
  large = false,
  time = "total",
}: {
  rows: Standing[];
  highlightTeamId?: string;
  large?: boolean;
  time?: "total" | "last";
}) {
  if (rows.length === 0) return <p className="py-8 text-center font-mono text-xs text-neutral-500">No scores yet</p>;
  return (
    <ol className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <motion.li
            layout
            key={r.teamId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 shadow-2xl",
              large ? "py-4 text-2xl" : "py-3 text-sm",
              r.teamId === highlightTeamId ? "border-hult/50 bg-hult/10" : "border-white/10 bg-[#0e0e12]",
            )}
          >
            <span
              className={cn(
                "grid shrink-0 place-items-center rounded-xl font-black tabular-nums",
                large ? "size-12" : "size-8 text-sm",
                r.rank === 1
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                  : r.rank === 2
                  ? "bg-slate-300 text-black shadow-md shadow-slate-300/20"
                  : r.rank === 3
                  ? "bg-amber-700 text-white shadow-md shadow-amber-700/20"
                  : "bg-white/[0.04] text-neutral-400",
              )}
            >
              {r.rank}
            </span>
            <span className="flex-1 truncate font-semibold">{r.teamName}</span>
            {time === "last" ? (
              <span className={cn("font-mono tabular-nums", large ? "text-xl" : "text-xs", r.lastCorrect ? "text-emerald-300" : "text-neutral-500")}>
                {r.lastMs == null ? "-" : formatMs(r.lastMs)}
              </span>
            ) : (
              <span className={cn("font-mono text-neutral-400 tabular-nums", large ? "text-lg" : "text-xs")}>{formatMs(r.totalTimeMs)}</span>
            )}
            <AnimatedNumber value={r.score} className="w-20 text-right font-black" springOptions={{ bounce: 0, duration: 1200 }} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

"use client";

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { optionLetter } from "@/lib/format";
import { OPTION_BG } from "./option-colors";

export function ResultBar({
  index,
  text,
  count,
  total,
  correct,
  large = false,
}: {
  index: number;
  text: string;
  count: number;
  total: number;
  correct: boolean | null;
  large?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#0e0e12]",
        correct ? "border-emerald-500/40" : correct === false ? "border-rose-500/30 opacity-70" : "border-white/15",
      )}
    >
      <motion.div
        className={cn("absolute inset-y-0 left-0", correct ? "bg-emerald-500/20" : "bg-white/[0.07]")}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      />
      <div className={cn("relative flex items-center gap-3 px-4", large ? "py-5 text-2xl" : "py-3 text-sm")}>
        <span className={cn("grid shrink-0 place-items-center rounded-xl font-bold text-white", large ? "size-12" : "size-8 text-sm", OPTION_BG[index])}>
          {optionLetter(index)}
        </span>
        <span className={cn("flex-1 break-words font-medium", correct && "text-emerald-200")}>{text}</span>
        {correct && <CheckCircle2 className={cn("shrink-0 text-emerald-400", large ? "size-8" : "size-5")} />}
        <span className="w-14 text-right font-semibold tabular-nums">{pct}%</span>
        <span className="w-8 text-right font-mono text-xs text-neutral-400 tabular-nums">{count}</span>
      </div>
    </div>
  );
}

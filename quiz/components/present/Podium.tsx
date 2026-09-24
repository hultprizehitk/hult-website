"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Standing } from "@/lib/quiz/types";

const ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const HEIGHT = ["h-64", "h-48", "h-36"];
const DELAY = [0.6, 1.2, 0];

export function Podium({ rows }: { rows: Standing[] }) {
  const top = rows.slice(0, 3);
  return (
    <div className="flex items-end justify-center gap-6">
      {ORDER.filter((i) => top[i]).map((i) => (
        <motion.div
          key={top[i].teamId}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: DELAY[i], type: "spring", stiffness: 120, damping: 16 }}
          className="flex w-64 flex-col items-center gap-3"
        >
          <p className="line-clamp-2 text-center text-2xl font-bold tracking-tight">{top[i].teamName}</p>
          <p className="font-mono text-lg text-white/60 tabular-nums">{top[i].score} pts</p>
          <div
            className={cn(
              "grid w-full place-items-center rounded-t-3xl border border-b-0 text-6xl font-black shadow-2xl",
              HEIGHT[i],
              i === 0 ? "border-white/20 bg-white text-black shadow-white/15" : "border-white/15 bg-[#16161d] text-white",
            )}
          >
            {top[i].rank}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

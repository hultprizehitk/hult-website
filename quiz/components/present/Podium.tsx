"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatMs } from "@/lib/format";
import type { Standing } from "@/lib/quiz/types";
import { ConfettiCanvas } from "./ConfettiCanvas";

const ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const HEIGHT = ["h-64", "h-48", "h-36"];
const DELAY = [0.6, 1.2, 0];

export function Podium({
  rows,
  playerNames,
}: {
  rows: Standing[];
  playerNames?: Map<string, string>;
}) {
  const top = rows.slice(0, 3);
  return (
    <>
      <ConfettiCanvas delayMs={1300} />
      <div className="flex items-end justify-center gap-6">
      {ORDER.filter((i) => top[i]).map((i) => {
        const item = top[i];
        const player = playerNames?.get(item.teamId);
        return (
          <motion.div
            key={item.teamId}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: DELAY[i], type: "spring", stiffness: 120, damping: 16 }}
            className="flex w-64 flex-col items-center gap-2"
          >
            <div className="text-center">
              <p className="line-clamp-2 text-2xl font-bold tracking-tight">{item.teamName}</p>
              {player && (
                <p className="mt-0.5 line-clamp-1 font-mono text-sm text-emerald-400 font-semibold">{player}</p>
              )}
            </div>
            <p className="font-mono text-lg text-white/60 tabular-nums">
              {item.score} pts &middot; {formatMs(item.totalTimeMs)}
            </p>
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
      );
    })}
      </div>
    </>
  );
}

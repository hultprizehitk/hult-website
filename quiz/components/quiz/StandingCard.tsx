"use client";

import { Trophy } from "lucide-react";
import { AnimatedNumber } from "@/components/motion-primitives/animated-number";
import { formatMs } from "@/lib/format";
import type { Standing } from "@/lib/quiz/types";

export function StandingCard({ standing }: { standing: Standing | null }) {
  if (!standing) return null;
  return (
    <div className="rounded-3xl border border-hult/40 bg-[#1f0a17] p-5 shadow-2xl">
      <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-hult">
        <span>Your team</span>
        <Trophy className="size-4" />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-black tabular-nums">#{standing.rank}</p>
        <div className="text-right">
          <AnimatedNumber value={standing.score} className="block text-2xl font-black" springOptions={{ bounce: 0, duration: 1000 }} />
          <p className="font-mono text-[11px] text-white/50 tabular-nums">{formatMs(standing.totalTimeMs)}</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Trophy } from "lucide-react";
import { AnimatedNumber } from "@/components/motion-primitives/animated-number";
import { Movement } from "@/components/quiz/Movement";
import { formatMs } from "@/lib/format";
import type { Standing } from "@/lib/quiz/types";

/** The team's own rank, score and movement since the previous question. */
export function StandingCard({ standing, of }: { standing: Standing | null; of?: number }) {
  if (!standing) return null;
  return (
    <div className="rounded-3xl border border-hult/40 bg-[#1f0a17] p-5 shadow-2xl">
      <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-hult">
        <span>Your team</span>
        <Trophy className="size-4" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black tabular-nums">#{standing.rank}</p>
          {of ? <span className="font-mono text-xs text-white/40">of {of}</span> : null}
          <Movement rank={standing.rank} prevRank={standing.prevRank} />
        </div>
        <div className="text-right">
          <AnimatedNumber value={standing.score} className="block text-2xl font-black" springOptions={{ bounce: 0, duration: 1000 }} />
          <p className="font-mono text-[11px] text-white/50 tabular-nums">
            {standing.lastMs != null ? (
              <span className={standing.lastCorrect ? "text-emerald-300" : "text-neutral-400"}>
                {formatMs(standing.lastMs)} Q &middot;{" "}
              </span>
            ) : null}
            {formatMs(standing.totalTimeMs)} total
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Radio } from "lucide-react";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import type { StateResponse } from "@/lib/quiz/types";

/** After Start, before Question 1, or between questions when host triggers ready state. */
export function StartingView({ s }: { s: StateResponse }) {
  const isFirst = s.currentIndex < 0;
  const nextNo = s.currentIndex + 2;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
      <div className="relative flex size-24 items-center justify-center">
        <div className="absolute size-full animate-ping rounded-full bg-emerald-500/20" />
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-950/50">
          <Radio className="size-6 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <TextShimmer className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-400" duration={2}>
          {isFirst ? "Get ready" : "Next question coming"}
        </TextShimmer>
        <h2 className="text-3xl font-bold tracking-tight">
          {isFirst ? "Quiz is starting" : `Are you ready for Question ${nextNo}?`}
        </h2>
        <p className="font-mono text-xs text-white/50">
          {s.me?.team?.name} &middot; Watch the big screen
        </p>
      </div>
    </div>
  );
}

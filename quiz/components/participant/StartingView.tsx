"use client";

import { Radio } from "lucide-react";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import type { StateResponse } from "@/lib/quiz/types";

/** After Start, before Question 1. */
export function StartingView({ s }: { s: StateResponse }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
      <div className="relative flex size-24 items-center justify-center">
        <div className="absolute size-full animate-ping rounded-full bg-rose-500/20" />
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-xl shadow-rose-950/50">
          <Radio className="size-6" />
        </div>
      </div>
      <div className="space-y-2">
        <TextShimmer className="font-mono text-xs uppercase tracking-[0.3em]" duration={2}>
          Get ready
        </TextShimmer>
        <h2 className="text-3xl font-bold tracking-tight">Quiz is starting</h2>
        <p className="font-mono text-xs text-white/50">
          {s.me?.team?.name} &middot; {s.questionCount} questions
        </p>
      </div>
    </div>
  );
}

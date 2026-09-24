"use client";

import { TextEffect } from "@/components/motion-primitives/text-effect";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { StandingCard } from "@/components/quiz/StandingCard";
import type { StateResponse } from "@/lib/quiz/types";

export function LeaderboardView({ s, title }: { s: StateResponse; title: string }) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <TextEffect per="word" preset="fade" as="h2" className="text-center text-3xl font-bold tracking-tight">
        {title}
      </TextEffect>
      <StandingCard standing={s.me?.standing ?? null} />
      <Leaderboard rows={s.leaderboard ?? []} highlightTeamId={s.me?.team?.id} />
    </div>
  );
}

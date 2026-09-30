"use client";

import { TextEffect } from "@/components/motion-primitives/text-effect";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { StandingCard } from "@/components/quiz/StandingCard";
import type { StateResponse } from "@/lib/quiz/types";

/** Final results on the phone: own rank card, then the top 10. */
export function LeaderboardView({ s, title }: { s: StateResponse; title: string }) {
  const totalQ =
    s.status === "ended"
      ? s.questionCount
      : Math.min(s.currentIndex + 1, s.questionCount);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <TextEffect per="word" preset="fade" as="h2" className="text-center text-3xl font-bold tracking-tight">
        {title}
      </TextEffect>
      <StandingCard
        standing={s.me?.standing ?? null}
        of={s.totalRanked ?? (s.counts.checkedIn > 0 ? s.counts.checkedIn : undefined)}
        totalQuestions={totalQ}
      />
      <Leaderboard
        rows={s.leaderboard ?? []}
        highlightTeamId={s.me?.team?.id}
        userStanding={s.me?.standing}
        time="both"
        showHeader
        totalQuestions={totalQ}
      />
    </div>
  );
}

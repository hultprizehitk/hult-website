"use client";

import { motion } from "motion/react";
import { CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { StandingCard } from "@/components/quiz/StandingCard";
import { formatMs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnswerView, StateResponse } from "@/lib/quiz/types";

/** After each question (spec U7): verdict, points, time, rank with movement, top 10 leaderboard. */
export function ResultsView({ s, answer }: { s: StateResponse; answer: AnswerView | null }) {
  const q = s.question!;
  const me = s.me!;
  // The session doc (answer key) can land a moment before the team doc (this team's grade).
  const graded = me.gradedQid === q.id;
  const lastMs = graded ? (me.standing?.lastMs ?? null) : null;
  const verdict = !graded
    ? { Icon: Loader2, text: "Scoring", cls: "border-white/15 bg-[#0e0e12] text-neutral-300", spin: true }
    : !answer
      ? { Icon: MinusCircle, text: "No answer", cls: "border-white/15 bg-[#0e0e12] text-neutral-300", spin: false }
      : answer.isCorrect
        ? { Icon: CheckCircle2, text: `Correct +${answer.pointsAwarded}`, cls: "border-emerald-500/30 bg-[#0a1f18] text-emerald-300", spin: false }
        : { Icon: XCircle, text: "Incorrect", cls: "border-rose-500/30 bg-rose-950/20 text-rose-300", spin: false };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("flex flex-col items-center justify-center gap-1 rounded-3xl border px-4 py-5 shadow-2xl", verdict.cls)}
      >
        <span className="flex items-center gap-2 text-2xl font-black">
          <verdict.Icon className={cn("size-7", verdict.spin && "animate-spin")} />
          {verdict.text}
        </span>
        {lastMs !== null && <span className="font-mono text-xs opacity-80">Answered in {formatMs(lastMs)}</span>}
      </motion.div>

      {graded && (
        <StandingCard
          standing={me.standing}
          of={s.totalRanked ?? (s.counts.checkedIn > 0 ? s.counts.checkedIn : undefined)}
          totalQuestions={Math.min(s.currentIndex + 1, s.questionCount)}
        />
      )}

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/50">Top 10</p>
        <Leaderboard
          rows={s.leaderboard ?? []}
          highlightTeamId={me.team?.id}
          userStanding={me.standing}
          time="both"
          showHeader
          totalQuestions={Math.min(s.currentIndex + 1, s.questionCount)}
        />
      </div>
    </div>
  );
}

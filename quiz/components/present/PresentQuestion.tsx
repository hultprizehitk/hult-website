"use client";

import { useState } from "react";
import { User, Users } from "lucide-react";
import { CountdownRing } from "@/components/quiz/CountdownRing";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { OptionButton } from "@/components/quiz/OptionButton";
import { ResultBar } from "@/components/quiz/ResultBar";
import { cn } from "@/lib/utils";
import type { StateResponse } from "@/lib/quiz/types";

/** Open question: text, options, countdown, answered bar. */
export function PresentQuestion({ s, now }: { s: StateResponse; now: number }) {
  const q = s.question!;
  const options = q.options ?? [];
  const closed = now >= q.closesAt;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <p className="font-mono text-lg uppercase tracking-[0.3em] text-white/50 tabular-nums">
            Question {q.index + 1} of {s.questionCount} &middot; {q.points} pts
          </p>
          <h1 className="mt-4 break-words text-5xl font-black leading-tight tracking-tight">{q.text}</h1>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          {closed ? (
            <span className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-mono text-2xl font-bold uppercase tracking-widest text-white/70">
              Time up
            </span>
          ) : (
            <CountdownRing openedAt={q.openedAt} closesAt={q.closesAt} now={now} size={140} />
          )}

          {s.counts.checkedIn > 0 && (
            <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 shadow-lg backdrop-blur-md">
              <span className="relative flex size-2.5">
                <span className={cn("size-full rounded-full", closed ? "bg-white/30" : "bg-emerald-400 animate-ping opacity-75")} />
                <span className={cn("relative inline-flex size-2.5 rounded-full", closed ? "bg-white/40" : "bg-emerald-400")} />
              </span>
              <span className="font-mono text-sm font-semibold text-white/80 tabular-nums">
                <span className="text-white font-bold">{s.counts.answered}</span> / {s.counts.checkedIn} {closed ? "locked in" : "answered"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((opt, i) => (
          <OptionButton key={i} index={i} text={opt} large disabled />
        ))}
      </div>
    </div>
  );
}

/** After each question (spec U7): correct answer + distribution beside the top 10 with time on this question and total time. */
export function PresentResults({
  s,
  playerNames,
}: {
  s: StateResponse;
  playerNames?: Map<string, string>;
}) {
  const [viewMode, setViewMode] = useState<"team" | "player">("team");
  const q = s.question!;
  const options = q.options ?? [];
  const dist = s.distribution ?? options.map(() => 0);
  const total = dist.reduce((a, b) => a + b, 0);

  return (
    <div className="grid flex-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <p className="font-mono text-lg uppercase tracking-[0.3em] text-white/50 tabular-nums">
          Question {q.index + 1} of {s.questionCount}
        </p>
        <h1 className="break-words text-4xl font-black leading-tight tracking-tight">{q.text}</h1>
        <div className="flex flex-col gap-3">
          {options.map((opt, i) => (
            <ResultBar key={i} index={i} text={opt} count={dist[i] ?? 0} total={total} correct={q.correctIndex === i ? true : null} large />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between font-mono uppercase tracking-widest text-white/50">
          <span className="text-lg">Top 10</span>
          {playerNames && playerNames.size > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setViewMode("team")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider transition-all",
                  viewMode === "team" ? "bg-white/15 text-white shadow-sm" : "text-white/40 hover:text-white/70",
                )}
              >
                <Users className="size-3.5" />
                Teams
              </button>
              <button
                type="button"
                onClick={() => setViewMode("player")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider transition-all",
                  viewMode === "player" ? "bg-white/15 text-white shadow-sm" : "text-white/40 hover:text-white/70",
                )}
              >
                <User className="size-3.5" />
                Players
              </button>
            </div>
          )}
        </div>
        <Leaderboard
          rows={s.leaderboard ?? []}
          large
          time="both"
          playerNames={playerNames}
          displayMode={viewMode}
          showHeader
          totalQuestions={Math.min(s.currentIndex + 1, s.questionCount)}
        />
      </div>
    </div>
  );
}

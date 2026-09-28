"use client";

import { CountdownRing } from "@/components/quiz/CountdownRing";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { OptionButton } from "@/components/quiz/OptionButton";
import { ResultBar } from "@/components/quiz/ResultBar";
import type { StateResponse } from "@/lib/quiz/types";

/** Open question: text, options, countdown, answered bar. */
export function PresentQuestion({ s, now }: { s: StateResponse; now: number }) {
  const q = s.question!;
  const options = q.options ?? [];
  const answeredPct = s.counts.checkedIn > 0 ? (s.counts.answered / s.counts.checkedIn) * 100 : 0;
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
        {closed ? (
          <span className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-mono text-2xl font-bold uppercase tracking-widest text-white/70">Time up</span>
        ) : (
          <CountdownRing openedAt={q.openedAt} closesAt={q.closesAt} now={now} size={140} />
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((opt, i) => (
          <OptionButton key={i} index={i} text={opt} large disabled />
        ))}
      </div>
      <div className="mt-auto flex items-center gap-4">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${answeredPct}%` }} />
        </div>
        <span className="font-mono text-xl tabular-nums text-white/70">
          {s.counts.answered}/{s.counts.checkedIn} answered
        </span>
      </div>
    </div>
  );
}

/** After each question (spec U7): correct answer + distribution beside the top 10 with time on this question. */
export function PresentResults({ s }: { s: StateResponse }) {
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
        <div className="flex items-baseline justify-between font-mono uppercase tracking-widest text-white/50">
          <span className="text-lg">Top 10</span>
          <span className="text-sm">Time on this question</span>
        </div>
        <Leaderboard rows={s.leaderboard ?? []} large time="last" />
      </div>
    </div>
  );
}

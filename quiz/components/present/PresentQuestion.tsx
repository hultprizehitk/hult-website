"use client";

import { CountdownRing } from "@/components/quiz/CountdownRing";
import { OptionButton } from "@/components/quiz/OptionButton";
import { ResultBar } from "@/components/quiz/ResultBar";
import type { StateResponse } from "@/lib/quiz/types";

export function PresentQuestion({ s, now }: { s: StateResponse; now: number }) {
  const q = s.question!;
  const options = q.options ?? [];
  const revealed = s.phase === "reveal";
  const dist = s.distribution ?? options.map(() => 0);
  const total = dist.reduce((a, b) => a + b, 0);
  const answeredPct = s.counts.checkedIn > 0 ? (s.counts.answered / s.counts.checkedIn) * 100 : 0;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <p className="font-mono text-lg uppercase tracking-[0.3em] text-white/50 tabular-nums">
            Question {q.index + 1} of {s.questionCount} &middot; {q.points} pts
          </p>
          <h1 className="mt-4 break-words text-5xl font-black leading-tight tracking-tight">{q.text}</h1>
        </div>
        {!revealed && <CountdownRing openedAt={q.openedAt} closesAt={q.closesAt} now={now} size={140} />}
      </div>
      <div className={revealed ? "flex flex-col gap-3" : "grid gap-4 md:grid-cols-2"}>
        {options.map((opt, i) =>
          revealed ? (
            <ResultBar key={i} index={i} text={opt} count={dist[i] ?? 0} total={total} correct={q.correctIndex === i ? true : null} large />
          ) : (
            <OptionButton key={i} index={i} text={opt} large disabled />
          ),
        )}
      </div>
      {!revealed && (
        <div className="mt-auto flex items-center gap-4">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${answeredPct}%` }} />
          </div>
          <span className="font-mono text-xl tabular-nums text-white/70">
            {s.counts.answered}/{s.counts.checkedIn} answered
          </span>
        </div>
      )}
    </div>
  );
}

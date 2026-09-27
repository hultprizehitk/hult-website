"use client";

import { useState } from "react";
import { CheckCircle2, SendHorizontal, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownRing } from "@/components/quiz/CountdownRing";
import { OptionButton } from "@/components/quiz/OptionButton";
import { cn } from "@/lib/utils";
import type { AnswerView, StateResponse } from "@/lib/quiz/types";

export function QuestionView({
  s,
  now,
  answer,
  onAnswer,
}: {
  s: StateResponse;
  now: number;
  answer: AnswerView | null;
  onAnswer: (optionIndex: number) => void;
}) {
  const q = s.question!;
  const me = s.me!;
  const isTaker = me.role === "taker" && me.deviceOk;
  const closed = now >= q.closesAt;
  const takerName = me.team?.members.find((m) => m.email === me.team?.takerEmail)?.name ?? "Your teammate";
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (!isTaker || !!answer || closed) return;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null || !isTaker || !!answer || closed) return;
    onAnswer(selected);
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-white/80 tabular-nums">
            Q {q.index + 1}/{s.questionCount}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-white/60 tabular-nums">{q.points} pts</span>
        </div>
        <CountdownRing openedAt={q.openedAt} closesAt={q.closesAt} now={now} size={56} />
      </div>
      <h2 className="break-words text-2xl font-bold leading-snug tracking-tight">{q.text}</h2>
      <div className="flex flex-col gap-3">
        {q.options!.map((opt, i) => {
          const isSelected = answer ? answer.optionIndex === i : selected === i;
          const isOther = answer ? answer.optionIndex !== i : selected !== null && selected !== i;
          const state = isSelected ? "selected" : isOther ? "muted" : "idle";

          return (
            <OptionButton
              key={i}
              index={i}
              text={opt}
              state={state}
              disabled={!isTaker || !!answer || closed}
              onClick={() => handleSelect(i)}
            />
          );
        })}
      </div>

      {!answer && isTaker && !closed && (
        <Button
          size="lg"
          className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-rose-950/40 py-6 transition-all gap-2"
          disabled={selected === null}
          onClick={handleSubmit}
        >
          <SendHorizontal className="size-4" />
          Submit Answer
        </Button>
      )}

      {answer ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0c1611] p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="size-4" />
              Answer Submitted
            </div>
            <p className="mt-1 font-mono text-[11px] text-white/50">Answer locked. Waiting for results & next question.</p>
          </div>

          {s.leaderboard && s.leaderboard.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-4 text-left shadow-lg">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Trophy className="size-3.5 text-amber-400" />
                  Live Standings
                </span>
                <span className="font-mono text-xs text-rose-400">
                  Your Rank: {me.standing?.rank ? `#${me.standing.rank}` : "-"}
                </span>
              </div>
              <div className="space-y-1.5">
                {s.leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.teamId}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-mono transition-all",
                      entry.teamId === me.team?.id
                        ? "border border-rose-500/40 bg-rose-500/10 font-bold text-white shadow-sm"
                        : "bg-white/[0.02] text-neutral-300",
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-white/40">#{entry.rank}</span>
                      <span className="truncate">{entry.teamName}</span>
                    </div>
                    <span className="font-semibold text-rose-400 tabular-nums">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : closed ? (
        <p className="text-center font-mono text-xs text-neutral-400">Time is up</p>
      ) : !isTaker ? (
        <p className="flex items-center justify-center gap-2 text-xs text-neutral-400">
          <Users className="size-4" />
          {takerName} is answering
        </p>
      ) : null}
    </div>
  );
}

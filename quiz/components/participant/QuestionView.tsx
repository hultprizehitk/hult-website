"use client";

import { useState } from "react";
import { CheckCircle2, SendHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownRing } from "@/components/quiz/CountdownRing";
import { OptionButton } from "@/components/quiz/OptionButton";
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
          Submit answer
        </Button>
      )}

      {answer ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0c1611] p-4 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="size-4" />
            Answer locked
          </div>
          <p className="mt-1 font-mono text-[11px] text-white/50">Results after the timer</p>
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

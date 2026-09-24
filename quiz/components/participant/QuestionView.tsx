"use client";

import { Users } from "lucide-react";
import { BorderTrail } from "@/components/motion-primitives/border-trail";
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
        {q.options!.map((opt, i) => (
          <OptionButton
            key={i}
            index={i}
            text={opt}
            state={answer ? (answer.optionIndex === i ? "selected" : "muted") : "idle"}
            disabled={!isTaker || !!answer || closed}
            onClick={() => onAnswer(i)}
          />
        ))}
      </div>
      {answer ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0e0e12] p-4 text-center">
          <BorderTrail className="bg-white" size={70} />
          <p className="font-semibold">Answer locked</p>
          <p className="font-mono text-[11px] text-white/50">Waiting for results</p>
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

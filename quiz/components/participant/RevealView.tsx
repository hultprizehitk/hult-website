"use client";

import { motion } from "motion/react";
import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { ResultBar } from "@/components/quiz/ResultBar";
import { StandingCard } from "@/components/quiz/StandingCard";
import { cn } from "@/lib/utils";
import type { AnswerView, StateResponse } from "@/lib/quiz/types";

export function RevealView({ s, answer }: { s: StateResponse; answer: AnswerView | null }) {
  const q = s.question!;
  const options = q.options ?? [];
  const dist = s.distribution ?? options.map(() => 0);
  const total = dist.reduce((a, b) => a + b, 0);
  const verdict = !answer
    ? { Icon: MinusCircle, text: "No answer", cls: "border-white/15 bg-[#0e0e12] text-neutral-300" }
    : answer.isCorrect
      ? { Icon: CheckCircle2, text: `Correct +${answer.pointsAwarded}`, cls: "border-emerald-500/30 bg-[#0a1f18] text-emerald-300" }
      : { Icon: XCircle, text: "Incorrect", cls: "border-rose-500/30 bg-rose-950/20 text-rose-300" };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("flex items-center justify-center gap-2 rounded-3xl border px-4 py-5 text-2xl font-black shadow-2xl", verdict.cls)}
      >
        <verdict.Icon className="size-7" />
        {verdict.text}
      </motion.div>
      <h2 className="break-words text-base font-semibold text-neutral-300">{q.text}</h2>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <ResultBar
            key={i}
            index={i}
            text={opt}
            count={dist[i] ?? 0}
            total={total}
            correct={q.correctIndex === i ? true : answer?.optionIndex === i ? false : null}
          />
        ))}
      </div>
      <StandingCard standing={s.me?.standing ?? null} />
    </div>
  );
}

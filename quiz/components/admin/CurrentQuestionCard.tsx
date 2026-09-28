"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultBar } from "@/components/quiz/ResultBar";
import type { AdminSessionSummary, QuestionLite } from "@/lib/quiz/types";

/**
 * The running question on the admin laptop. The correct answer stays hidden until results (spec U9) unless the
 * host peeks; answer counts per option are shown live (they reveal nothing about correctness).
 */
export function CurrentQuestionCard({ session: s, question: q, distribution }: { session: AdminSessionSummary; question: QuestionLite; distribution: number[] | null }) {
  const [peek, setPeek] = useState(false);
  const revealed = s.phase === "results" || s.status === "ended";
  const showCorrect = revealed || peek;
  const total = (distribution ?? []).reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-wider text-white/60 tabular-nums">
          Q{s.currentIndex + 1} &middot; {q.points} pts &middot; {q.timeLimitSec}s
        </p>
        {!revealed && (
          <Button variant="ghost" size="xs" onClick={() => setPeek((p) => !p)} aria-pressed={peek}>
            {peek ? <EyeOff /> : <Eye />}
            {peek ? "Hide answer" : "Show answer"}
          </Button>
        )}
      </div>
      <p className="mt-2 mb-4 break-words text-lg font-semibold tracking-tight">{q.text || "Loading"}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((o, i) => (
          <ResultBar key={i} index={i} text={o} count={distribution?.[i] ?? 0} total={total} correct={showCorrect && i === q.correctIndex ? true : null} />
        ))}
      </div>
    </div>
  );
}

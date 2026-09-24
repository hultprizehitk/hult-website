"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Hash } from "lucide-react";
import { QuizShell } from "@/components/quiz/QuizShell";
import { GateCard } from "@/components/quiz/GateCard";
import { Button } from "@/components/ui/button";
import { BorderTrail } from "@/components/motion-primitives/border-trail";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const valid = /^\d{6}$/.test(code);

  return (
    <QuizShell>
      <GateCard badge="Live quiz" title="Join the quiz" subtitle="Enter the code on screen">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) router.push(`/s/${code}`);
          }}
          className="flex flex-col gap-3"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#16161d]">
            <BorderTrail className="bg-hult" size={90} />
            <div className="flex items-center gap-2 px-4">
              <Hash className="size-5 text-neutral-400" />
              <input
                aria-label="Session code"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="h-16 w-full bg-transparent font-mono text-3xl font-bold tracking-[0.35em] text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </div>
          <Button type="submit" size="xl" disabled={!valid} className="w-full rounded-2xl font-bold">
            Join
            <ArrowRight />
          </Button>
        </form>
      </GateCard>
    </QuizShell>
  );
}

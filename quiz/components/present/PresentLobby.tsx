"use client";

import { AnimatedNumber } from "@/components/motion-primitives/animated-number";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { JoinQr } from "@/components/quiz/JoinQr";
import { useOrigin } from "@/hooks/useOrigin";
import type { StateResponse } from "@/lib/quiz/types";

export function PresentLobby({ s }: { s: StateResponse }) {
  const host = useOrigin().replace(/^https?:\/\//, "");
  const pct = s.counts.eligible > 0 ? Math.round((s.counts.checkedIn / s.counts.eligible) * 100) : 0;
  return (
    <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-10">
        <TextEffect per="word" preset="fade" as="h1" className="text-6xl font-black leading-tight tracking-tight">
          {s.title}
        </TextEffect>
        <div>
          <p className="font-mono text-xl uppercase tracking-widest text-white/50">Join at {host}</p>
          <p className="font-mono text-8xl font-black tracking-widest text-white">
            <span className="text-hult">#</span>
            {s.code}
          </p>
        </div>
        <div className="max-w-xl rounded-3xl border border-emerald-500/30 bg-[#0a1f18] p-6 shadow-2xl">
          <div className="mb-2 flex items-center justify-between font-mono text-sm uppercase tracking-wider text-emerald-400">
            <span>Teams checked in</span>
            {!s.checkinOpen && s.status === "lobby" && <span className="text-rose-300">Check-in closed</span>}
          </div>
          <div className="flex items-baseline gap-3 text-emerald-300">
            <AnimatedNumber value={s.counts.checkedIn} className="text-6xl font-black" springOptions={{ bounce: 0, duration: 800 }} />
            <span className="text-2xl text-emerald-300/70">/ {s.counts.eligible}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <JoinQr code={s.code} size={320} />
    </div>
  );
}

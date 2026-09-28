"use client";

import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import type { StateResponse } from "@/lib/quiz/types";

/** Joined and holding the seat, before Start. */
export function LobbyView({ s }: { s: StateResponse }) {
  const team = s.me!.team!;
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <TextShimmer className="font-mono text-xs uppercase tracking-[0.3em]" duration={2}>
          Waiting for start
        </TextShimmer>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{s.title}</h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          Joined
        </p>
      </div>

      <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/60">Team</p>
            <p className="truncate text-xl font-bold tracking-tight">{team.name}</p>
          </div>
          <span className="font-mono text-xs font-bold text-rose-400">{team.code}</span>
        </div>
        <div className="my-4 h-px bg-white/10" />
        <ul className="flex flex-col gap-2.5">
          {team.members.map((m) => (
            <li key={m.email} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-white/90">{m.name}</span>
              {m.email === team.takerEmail && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  Playing
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-xs text-neutral-400">You play for your team. Keep this screen open.</p>
    </div>
  );
}

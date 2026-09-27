"use client";

import { Radio, Trophy, Users } from "lucide-react";
import type { StateResponse } from "@/lib/quiz/types";

export function ComingSoonView({ s }: { s: StateResponse }) {
  const me = s.me;
  const team = me?.team;
  const standing = me?.standing;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
      <div className="relative flex size-24 items-center justify-center">
        <div className="absolute size-full animate-ping rounded-full bg-rose-500/20" />
        <div className="absolute size-16 rounded-full bg-rose-500/20" />
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-xl shadow-rose-950/50">
          <Radio className="size-6 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h2 className="text-2xl font-bold tracking-tight text-white">Question is coming soon</h2>
        <p className="font-mono text-xs text-white/60">
          Get ready! The host will publish the question to your screen shortly.
        </p>
      </div>

      {team && (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e12] p-4 text-left shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 truncate">
              <Users className="size-4 text-rose-400 shrink-0" />
              <span className="truncate font-semibold text-sm">{team.name}</span>
            </div>
            <span className="font-mono text-xs font-bold text-rose-400 tabular-nums">
              {standing?.score ?? 0} pts
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-center font-mono text-xs">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
              <span className="text-white/40 block text-[10px] uppercase">Rank</span>
              <span className="font-bold text-white text-sm">
                {standing?.rank ? `#${standing.rank}` : "-"}
              </span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
              <span className="text-white/40 block text-[10px] uppercase">Correct</span>
              <span className="font-bold text-emerald-400 text-sm">
                {standing?.correctCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {s.leaderboard && s.leaderboard.length > 0 && (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e12] p-4 text-left shadow-lg">
          <div className="flex items-center gap-2 mb-2 font-mono text-xs text-white/50 uppercase tracking-wider">
            <Trophy className="size-3.5 text-amber-400" />
            Top Standings
          </div>
          <div className="space-y-1">
            {s.leaderboard.slice(0, 3).map((entry) => (
              <div
                key={entry.teamId}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-mono text-xs bg-white/[0.02]"
              >
                <span className="truncate text-white/80">
                  <span className="text-white/40 mr-2">#{entry.rank}</span>
                  {entry.teamName}
                </span>
                <span className="font-bold text-rose-400 tabular-nums">{entry.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

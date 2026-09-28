"use client";

import { useMemo } from "react";
import { Smartphone, UserCheck } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { JoinQr } from "@/components/quiz/JoinQr";
import type { CounterDoc } from "@/lib/quiz/fs-types";
import type { StateResponse } from "@/lib/quiz/types";

interface PresentLobbyProps {
  s: StateResponse;
  joinedCounters?: CounterDoc[];
}

export function PresentLobby({ s, joinedCounters = [] }: PresentLobbyProps) {

  // Filter only eligible teams that have checked into the quiz
  const joinedTeams = useMemo(() => {
    return joinedCounters
      .filter((c) => c.eligible && c.checkedIn)
      .sort((a, b) => (a.teamName || "").localeCompare(b.teamName || ""));
  }, [joinedCounters]);

  return (
    <div className="flex flex-1 flex-col gap-8">
      {/* Top Hero Section: Title & QR Code */}
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <TextEffect per="word" preset="fade" as="h1" className="text-5xl lg:text-6xl font-black leading-tight tracking-tight">
            {s.title}
          </TextEffect>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-lg uppercase tracking-widest text-white/50">One player per team</span>
            <span className="text-white/20">&bull;</span>
            <span className="font-mono text-lg text-emerald-400 font-bold uppercase tracking-wider">Scan to enter lobby</span>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl shrink-0">
          <JoinQr code={s.code} size={240} />
          <p className="font-mono text-xs text-white/50 text-center">Scan with mobile camera to take seat</p>
        </div>
      </div>

      {/* Bottom Section: Live Joined Teams & Players Roster Grid */}
      <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Joined Teams & Players ({joinedTeams.length} / {s.counts.eligible})
            </h2>
          </div>
          <span className="font-mono text-xs text-white/40">Real-time room synchronization</span>
        </div>

        {joinedTeams.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-white/40">
            <div className="rounded-full bg-white/5 p-4 border border-white/10 animate-pulse">
              <Smartphone className="size-8 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-white/60">Waiting for teams to join the lobby...</p>
            <p className="font-mono text-xs text-white/40">Scan the QR code above from your phone to take your seat</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {joinedTeams.map((team, idx) => (
              <div
                key={team.teamId || idx}
                className="group relative flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-[#16161d] p-3.5 transition-all hover:border-emerald-500/50 hover:bg-[#1a1a24] shadow-md"
              >
                {/* Team Name and Code */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white tracking-tight">
                      {team.teamName || "Unnamed Team"}
                    </p>
                    {team.teamCode && (
                      <span className="font-mono text-[10px] font-bold text-rose-400">
                        {team.teamCode}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>In</span>
                  </span>
                </div>

                {/* Player Name */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 font-sans text-xs">
                  {team.playerName ? (
                    <>
                      <UserCheck className="size-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate font-semibold text-emerald-200">
                        {team.playerName}
                      </span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="size-3.5 text-amber-400 shrink-0" />
                      <span className="truncate text-white/50 text-[11px] font-mono">
                        Connecting phone...
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

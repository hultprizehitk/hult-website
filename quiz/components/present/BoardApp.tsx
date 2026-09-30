"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, SearchX, Trophy, User, Users } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { StateMessage } from "@/components/quiz/StateMessage";
import { useCollectionData, useDocData } from "@/hooks/useFirestore";
import { paths, type CounterDoc, type SessionDoc } from "@/lib/quiz/fs-types";
import { cn } from "@/lib/utils";
import { Podium } from "./Podium";

/** Always-on second screen: top 10 after every reveal, podium at the end. Reads the public session doc and counter shards. */
export function BoardApp({ code }: { code: string }) {
  const [liveView, setLiveView] = useState<"team" | "player">("team");
  const [endedView, setEndedView] = useState<"side" | "team" | "player">("side");
  const valid = /^\d{6}$/.test(code);
  const live = useDocData<SessionDoc>(valid ? paths.session(code) : null);
  const countsLive = useCollectionData<CounterDoc>(valid ? paths.counts(code) : null, "teamId");
  const s = live.data;
  const rows = s?.leaderboard ?? [];
  const questionLabel = s && s.gradedThrough >= 0 ? `After question ${s.gradedThrough + 1} of ${s.plan.length}` : "Scores appear after the first reveal";
  const totalQ = s ? (s.status === "ended" ? s.plan.length : Math.max(s.gradedThrough + 1, 1)) : 1;

  const playerMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of countsLive.data) {
      if (c.playerName) {
        m.set(c.teamId, c.playerName);
      } else if (c.playerEmail) {
        m.set(c.teamId, c.playerEmail.split("@")[0]);
      }
    }
    return m;
  }, [countsLive.data]);

  let body: React.ReactNode;
  if (!valid || (!live.loading && !s)) body = <StateMessage icon={SearchX} title="Session not found" />;
  else if (!s) body = <StateMessage icon={Loader2} spin title="Connecting" />;
  else if (s.status === "ended") {
    body = (
      <div className={cn("mx-auto flex w-full flex-1 flex-col gap-8 pb-12", endedView === "side" ? "max-w-7xl" : "max-w-5xl")}>
        <div className="text-center">
          <TextEffect per="word" preset="fade" as="h1" className="text-5xl lg:text-6xl font-black tracking-tight">
            Final results
          </TextEffect>
          <p className="mt-2 font-mono text-sm uppercase tracking-[0.25em] text-emerald-400">
            Top 10 Teams &amp; Players
          </p>
        </div>
        {rows.length > 0 && <Podium rows={rows} playerNames={playerMap} />}

        {/* View Switcher Controls */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0c0c10]/90 p-1.5 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setEndedView("side")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all",
                endedView === "side" ? "bg-white/20 text-white shadow-md" : "text-white/45 hover:text-white/70",
              )}
            >
              <Trophy className="size-4" />
              Side by Side
            </button>
            <button
              type="button"
              onClick={() => setEndedView("team")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all",
                endedView === "team" ? "bg-white/20 text-white shadow-md" : "text-white/45 hover:text-white/70",
              )}
            >
              <Users className="size-4" />
              Teams
            </button>
            <button
              type="button"
              onClick={() => setEndedView("player")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all",
                endedView === "player" ? "bg-white/20 text-white shadow-md" : "text-white/45 hover:text-white/70",
              )}
            >
              <User className="size-4" />
              Players
            </button>
          </div>
        </div>

        {/* Leaderboards Display */}
        {endedView === "side" ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Team Leaderboard */}
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                  <Users className="size-4 text-hult" />
                  <span>Team Leaderboard</span>
                </div>
                <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Ans &bull; Score</span>
              </div>
              <Leaderboard rows={rows} large time="both" playerNames={playerMap} displayMode="team" showHeader totalQuestions={totalQ} />
            </div>

            {/* Player Leaderboard */}
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                  <User className="size-4 text-emerald-400" />
                  <span>Player Leaderboard</span>
                </div>
                <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Ans &bull; Score</span>
              </div>
              <Leaderboard rows={rows} large time="both" playerNames={playerMap} displayMode="player" showHeader totalQuestions={totalQ} />
            </div>
          </div>
        ) : endedView === "team" ? (
          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                <Users className="size-4 text-hult" />
                <span>Team Leaderboard</span>
              </div>
              <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Ans &bull; Score</span>
            </div>
            <Leaderboard rows={rows} large time="both" playerNames={playerMap} displayMode="team" showHeader totalQuestions={totalQ} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                <User className="size-4 text-emerald-400" />
                <span>Player Leaderboard</span>
              </div>
              <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Ans &bull; Score</span>
            </div>
            <Leaderboard rows={rows} large time="both" playerNames={playerMap} displayMode="player" showHeader totalQuestions={totalQ} />
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight">Leaderboard</h1>
            <p className="mt-2 font-mono text-base uppercase tracking-widest text-white/50">{questionLabel}</p>
          </div>
          {playerMap.size > 0 && (
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0c0c10]/90 p-1 shadow-xl">
              <button
                type="button"
                onClick={() => setLiveView("team")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all",
                  liveView === "team" ? "bg-white/20 text-white shadow-sm" : "text-white/40 hover:text-white/70",
                )}
              >
                <Users className="size-3.5" />
                Teams
              </button>
              <button
                type="button"
                onClick={() => setLiveView("player")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all",
                  liveView === "player" ? "bg-white/20 text-white shadow-sm" : "text-white/40 hover:text-white/70",
                )}
              >
                <User className="size-3.5" />
                Players
              </button>
            </div>
          )}
        </div>
        <Leaderboard
          rows={rows}
          large
          time="both"
          playerNames={playerMap}
          displayMode={liveView}
          showHeader
          totalQuestions={totalQ}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <DotPattern width={32} height={32} cx={1} cy={1} cr={0.8} className="fill-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#08080a] px-12 py-5 shadow-md">
        <div className="flex items-center gap-4">
          <span className="relative aspect-[1080/659] h-11">
            <Image src="/Hult-Prize.png" alt="Hult Prize" fill sizes="80px" className="object-contain" priority />
          </span>
          <span className="h-7 w-px bg-white/20" />
          <span className="text-xl font-extrabold tracking-wider">
            QUIZ <span className="text-neutral-400">BOARD</span>
          </span>
        </div>
        {s && <p className="max-w-[40%] truncate font-mono text-xl text-white/60">{s.title}</p>}
      </header>
      <main className="relative z-10 flex flex-1 flex-col px-12 py-10">{body}</main>
      <ReconnectingPill show={live.offline} />
    </div>
  );
}


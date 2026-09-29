"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, SearchX, Trophy, User, Users } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { DotPattern } from "@/components/ui/dot-pattern";
import { LeadIn } from "@/components/quiz/LeadIn";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { StateMessage } from "@/components/quiz/StateMessage";
import { useCollectionData, useDocData } from "@/hooks/useFirestore";
import { useServerClock } from "@/hooks/useServerClock";
import { useServerNow } from "@/hooks/useServerNow";
import { toStateResponse } from "@/lib/quiz/client-state";
import { paths, type CounterDoc, type CountsDoc, type SessionDoc } from "@/lib/quiz/fs-types";
import { cn } from "@/lib/utils";
import { PresentLobby } from "./PresentLobby";
import { PresentQuestion, PresentResults } from "./PresentQuestion";
import { Podium } from "./Podium";

export function PresentApp({ code }: { code: string }) {
  const [endedView, setEndedView] = useState<"side" | "team" | "player">("side");
  const valid = /^\d{6}$/.test(code);
  // Public docs only (no login): the session and the live counters.
  const sessionLive = useDocData<SessionDoc>(valid ? paths.session(code) : null);
  const countsLive = useCollectionData<CounterDoc>(valid ? paths.counts(code) : null, "teamId");
  const now = useServerNow(useServerClock());

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

  const counts: CountsDoc | null = sessionLive.data
    ? {
        checkedIn: countsLive.data.filter((c) => c.eligible && c.checkedIn).length,
        eligible: countsLive.data.filter((c) => c.eligible).length,
        answeredFor: sessionLive.data.current?.id ?? null,
        answeredCurrent: countsLive.data.filter((c) => c.eligible && c.answered && c.answeredFor === sessionLive.data?.current?.id).length,
      }
    : null;
  const s = sessionLive.data
    ? toStateResponse({ session: sessionLive.data, counts, team: null, email: null, deviceId: null, nowMs: now })
    : null;

  let body: React.ReactNode;
  if (!valid || (!sessionLive.loading && !sessionLive.data)) body = <StateMessage icon={SearchX} title="Quiz not set up yet" />;
  else if (!s) body = <StateMessage icon={Loader2} spin title="Connecting" />;
  else if (s.status === "draft" || s.status === "lobby") body = <PresentLobby s={s} joinedCounters={countsLive.data} />;
  else if (s.status === "ended") {
    const board = s.leaderboard ?? [];
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
        {board.length > 0 && <Podium rows={board} playerNames={playerMap} />}

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
                <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Score</span>
              </div>
              <Leaderboard rows={board} large time="both" playerNames={playerMap} displayMode="team" showHeader />
            </div>

            {/* Player Leaderboard */}
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                  <User className="size-4 text-emerald-400" />
                  <span>Player Leaderboard</span>
                </div>
                <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Score</span>
              </div>
              <Leaderboard rows={board} large time="both" playerNames={playerMap} displayMode="player" showHeader />
            </div>
          </div>
        ) : endedView === "team" ? (
          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                <Users className="size-4 text-hult" />
                <span>Team Leaderboard</span>
              </div>
              <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Score</span>
            </div>
            <Leaderboard rows={board} large time="both" playerNames={playerMap} displayMode="team" showHeader />
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-white/70">
                <User className="size-4 text-emerald-400" />
                <span>Player Leaderboard</span>
              </div>
              <span className="font-mono text-xs text-white/40">Rank &bull; Q Time &bull; Total &bull; Score</span>
            </div>
            <Leaderboard rows={board} large time="both" playerNames={playerMap} displayMode="player" showHeader />
          </div>
        )}
      </div>
    );
  } else if (s.phase === "question" && s.question && (now < s.question.openedAt || !s.question.text)) {
    body = <LeadIn openedAt={s.question.openedAt} now={now} label={`Question ${s.question.index + 1} of ${s.questionCount}`} big />;
  } else if (s.phase === "question" && s.question) {
    body = <PresentQuestion s={s} now={now} />;
  } else if (s.phase === "results" && s.question) {
    body = <PresentResults s={s} playerNames={playerMap} />;
  } else {
    const isFirst = s.currentIndex < 0;
    const targetNo = isFirst ? 1 : s.currentIndex + 2;
    body = (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {isFirst && (
          <p className="font-mono text-2xl uppercase tracking-[0.3em] text-white/50">{s.questionCount} questions</p>
        )}
        <TextEffect per="word" preset="fade" as="h1" className="text-6xl lg:text-8xl font-black tracking-tight">
          {`Are you ready for Question ${targetNo}?`}
        </TextEffect>
        <p className="font-mono text-xl text-white/50 animate-pulse">
          Keep your device ready &middot; Question {targetNo} is launching next
        </p>
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
            QUIZ <span className="text-neutral-400">LIVE</span>
          </span>
        </div>
        {s && s.status === "live" && s.currentIndex >= 0 && (
          <p className="font-mono text-xl text-white/60 tabular-nums">
            Q{s.currentIndex + 1}/{s.questionCount}
          </p>
        )}
      </header>
      <main className="relative z-10 flex flex-1 flex-col px-12 py-10">{body}</main>
      <ReconnectingPill show={sessionLive.offline} />
    </div>
  );
}

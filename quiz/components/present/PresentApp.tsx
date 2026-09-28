"use client";

import Image from "next/image";
import { Loader2, SearchX } from "lucide-react";
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
import { PresentLobby } from "./PresentLobby";
import { PresentQuestion, PresentResults } from "./PresentQuestion";
import { Podium } from "./Podium";

export function PresentApp({ code }: { code: string }) {
  const valid = /^\d{6}$/.test(code);
  // Public docs only (no login): the session and the live counters.
  const sessionLive = useDocData<SessionDoc>(valid ? paths.session(code) : null);
  const countsLive = useCollectionData<CounterDoc>(valid ? paths.counts(code) : null, "teamId");
  const now = useServerNow(useServerClock());
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
  else if (s.status === "draft" || s.status === "lobby") body = <PresentLobby s={s} />;
  else if (s.status === "ended") {
    body = (
      <div className="flex flex-1 flex-col gap-10">
        <TextEffect per="word" preset="fade" as="h1" className="text-center text-6xl font-black tracking-tight">
          Final results
        </TextEffect>
        <Podium rows={s.leaderboard ?? []} />
        {(s.leaderboard?.length ?? 0) > 3 && (
          <div className="mx-auto w-full max-w-4xl">
            <Leaderboard rows={s.leaderboard!.slice(3)} large />
          </div>
        )}
      </div>
    );
  } else if (s.phase === "question" && s.question && (now < s.question.openedAt || !s.question.text)) {
    body = <LeadIn openedAt={s.question.openedAt} now={now} label={`Question ${s.question.index + 1} of ${s.questionCount}`} big />;
  } else if (s.phase === "question" && s.question) {
    body = <PresentQuestion s={s} now={now} />;
  } else if (s.phase === "results" && s.question) {
    body = <PresentResults s={s} />;
  } else {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="font-mono text-2xl uppercase tracking-[0.3em] text-white/50">{s.questionCount} questions</p>
        <TextEffect per="word" preset="fade" as="h1" className="text-8xl font-black tracking-tight">
          Quiz is starting
        </TextEffect>
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

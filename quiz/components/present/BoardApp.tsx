"use client";

import Image from "next/image";
import { Loader2, SearchX } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { StateMessage } from "@/components/quiz/StateMessage";
import { useDocData } from "@/hooks/useFirestore";
import { paths, type SessionDoc } from "@/lib/quiz/fs-types";
import { Podium } from "./Podium";

/** Always-on second screen: top 10 after every reveal, podium at the end. Reads only the public session doc. */
export function BoardApp({ code }: { code: string }) {
  const valid = /^\d{6}$/.test(code);
  const live = useDocData<SessionDoc>(valid ? paths.session(code) : null);
  const s = live.data;
  const rows = s?.leaderboard ?? [];
  const questionLabel = s && s.gradedThrough >= 0 ? `After question ${s.gradedThrough + 1} of ${s.plan.length}` : "Scores appear after the first reveal";

  let body: React.ReactNode;
  if (!valid || (!live.loading && !s)) body = <StateMessage icon={SearchX} title="Session not found" />;
  else if (!s) body = <StateMessage icon={Loader2} spin title="Connecting" />;
  else if (s.status === "ended") {
    body = (
      <div className="flex flex-1 flex-col gap-10">
        <TextEffect per="word" preset="fade" as="h1" className="text-center text-6xl font-black tracking-tight">
          Final results
        </TextEffect>
        <Podium rows={rows} />
        {rows.length > 3 && (
          <div className="mx-auto w-full max-w-4xl">
            <Leaderboard rows={rows.slice(3)} large />
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="text-center">
          <h1 className="text-6xl font-black tracking-tight">Leaderboard</h1>
          <p className="mt-2 font-mono text-lg uppercase tracking-widest text-white/50">{questionLabel}</p>
        </div>
        <Leaderboard rows={rows} large />
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

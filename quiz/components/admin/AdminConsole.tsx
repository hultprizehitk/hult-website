"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ListChecks, Loader2, MonitorPlay, Radio, SearchX, ShieldAlert, Trophy, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { StateMessage } from "@/components/quiz/StateMessage";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { useCollectionData, useDocData } from "@/hooks/useFirestore";
import { useServerClock } from "@/hooks/useServerClock";
import { useServerNow } from "@/hooks/useServerNow";
import { cn } from "@/lib/utils";
import { adminSummary, liveDistribution, standingsFromTeams, teamBoardRows } from "@/lib/quiz/client-state";
import { paths, type QuestionDoc, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import type { AdminSessionView, QuestionLite } from "@/lib/quiz/types";
import { LivePanel } from "./LivePanel";
import { PageHeader } from "./PageHeader";
import { QuestionsPanel } from "./QuestionsPanel";
import { StatusBadge } from "./StatusBadge";
import { TeamsPanel } from "./TeamsPanel";

type Tab = "live" | "questions" | "teams";

// Pill tabs from client-v3/app/admin/components/DashboardNav.tsx.
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-5 py-2 text-xs font-bold tracking-wide transition-all sm:text-sm",
        active ? "bg-white text-black shadow-lg shadow-white/15" : "border border-white/10 bg-[#16161d] text-white/70 hover:bg-[#202028] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

const noop = async () => {};

/**
 * Organizer console. Live listeners (PRD 9.2.7): session, counts and teams while open; the current question
 * doc (for its correct answer); the full question list only while the Questions tab is open.
 */
export function AdminConsole({ code }: { code: string }) {
  const fb = useFirebaseUser();
  const ready = fb.status === "signed-in" && fb.admin;
  const [tab, setTab] = useState<Tab>("live");
  const now = useServerNow(useServerClock());

  const sessionLive = useDocData<SessionDoc>(paths.session(code));
  const teamsLive = useCollectionData<TeamDoc>(ready ? paths.teams(code) : null, "teamName");
  const s = sessionLive.data;
  const currentId = s?.current?.id ?? null;
  const currentLive = useDocData<QuestionDoc>(ready && currentId ? paths.question(code, currentId) : null);
  const questionsLive = useCollectionData<QuestionDoc & { id: string }>(ready && tab === "questions" ? paths.questions(code) : null, "order");

  const view: AdminSessionView | null = useMemo(() => {
    if (!s) return null;
    const cq = currentLive.data;
    const questions: QuestionLite[] =
      tab === "questions"
        ? questionsLive.data.map((q) => ({ id: q.id, order: q.order, text: q.text, options: q.options, correctIndex: q.correctIndex, points: q.points, timeLimitSec: q.timeLimitSec }))
        : s.plan.map((p, i) =>
            i === s.currentIndex && cq && currentId === p.id
              ? { id: p.id, order: i, text: cq.text, options: cq.options, correctIndex: cq.correctIndex, points: cq.points, timeLimitSec: cq.timeLimitSec }
              : { id: p.id, order: i, text: "", options: [], correctIndex: -1, points: 0, timeLimitSec: p.timeLimitSec },
          );
    return {
      serverNow: now,
      session: adminSummary(s),
      questions,
      counts: {
        checkedIn: teamsLive.data.filter((t) => !!t.checkedInAt).length,
        eligible: teamsLive.data.filter((t) => t.eligible).length,
        answered: teamsLive.data.filter((t) => !!currentId && t.currentAnswer?.qid === currentId).length,
      },
      distribution: cq ? liveDistribution(teamsLive.data, currentId, cq.options.length) : null,
      standings: standingsFromTeams(teamsLive.data),
    };
  }, [s, currentLive.data, currentId, tab, questionsLive.data, teamsLive.data, now]);

  const nav = (
    <>
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full text-xs" })}>
        <ArrowLeft className="size-3.5" />
        Home
      </Link>
      <Link href={`/present/${code}/board`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full text-xs" })}>
        <Trophy />
        Board
      </Link>
      <Link href={`/present/${code}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full text-xs" })}>
        <MonitorPlay />
        Present
      </Link>
    </>
  );

  if (fb.status === "loading" || sessionLive.loading) return <StateMessage icon={Loader2} spin title="Loading" />;
  if (!ready) return <StateMessage icon={ShieldAlert} title="Admin access needed" subtitle={fb.error ?? fb.email ?? undefined} />;
  if (!s || !view) return <StateMessage icon={SearchX} title="Session not found" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.title}
        subtitle={
          <span className="flex items-center gap-2">
            <span className="font-mono font-bold text-rose-400">#{code}</span>
            <span className="text-white/20">&bull;</span>
            <StatusBadge status={s.status} />
            <span className="text-white/20">&bull;</span>
            <span className="truncate text-white/50">{s.eventTitle}</span>
          </span>
        }
        right={nav}
      />

      <nav aria-label="Console tabs" className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-4">
        <TabButton active={tab === "live"} onClick={() => setTab("live")}>
          <span className="relative flex size-2">
            {s.status === "live" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </TabButton>
        <TabButton active={tab === "questions"} onClick={() => setTab("questions")}>
          <ListChecks className="size-3.5" />
          Questions ({s.plan.length})
        </TabButton>
        <TabButton active={tab === "teams"} onClick={() => setTab("teams")}>
          <Users className="size-3.5" />
          Teams
        </TabButton>
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[11px] text-white/40 sm:flex">
          <Radio className="size-3" />v{s.stateVersion}
        </span>
      </nav>

      {tab === "live" && <LivePanel code={code} view={view} now={now} onNavigateQuestions={() => setTab("questions")} />}
      {tab === "questions" && <QuestionsPanel code={code} view={view} onChanged={noop} onNavigateLive={() => setTab("live")} />}
      {tab === "teams" && <TeamsPanel code={code} session={s} rows={teamBoardRows(teamsLive.data, currentId)} loading={teamsLive.loading} />}

      <ReconnectingPill show={sessionLive.offline} />
    </div>
  );
}

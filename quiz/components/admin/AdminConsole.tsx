"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Copy, Database, Download, ListChecks, Loader2, MonitorPlay, Radio, SearchX, ShieldAlert, Smartphone, Trophy, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { saveQuizData } from "@/lib/client/control";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { StateMessage } from "@/components/quiz/StateMessage";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { useCollectionData, useDocData } from "@/hooks/useFirestore";
import { useOrigin } from "@/hooks/useOrigin";
import { useServerClock } from "@/hooks/useServerClock";
import { cn } from "@/lib/utils";
import { adminSummary, liveDistribution, standingsFromTeams, teamBoardRows } from "@/lib/quiz/client-state";
import { paths, type QuestionDoc, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import type { Counts, QuestionLite } from "@/lib/quiz/types";
import { Checklist } from "./Checklist";
import { CurrentQuestionCard } from "./CurrentQuestionCard";
import { DangerZone } from "./DangerZone";
import { HostControls } from "./HostControls";
import { PageHeader } from "./PageHeader";
import { QuestionsPanel } from "./QuestionsPanel";
import { StandingsTable } from "./StandingsTable";
import { StatusBadge } from "./StatusBadge";
import { TeamsPanel } from "./TeamsPanel";

type Tab = "run" | "questions";

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

/**
 * Organizer console (spec 2026-09-28 §4). Everything needed during the quiz is on the Run tab: controls, the
 * current question, standings and the teams help desk. Listeners: session, teams, the current question doc,
 * and the question list only while the Questions tab is open.
 */
export function AdminConsole({ code }: { code: string }) {
  const fb = useFirebaseUser();
  const ready = fb.status === "signed-in" && fb.admin;
  const [tab, setTab] = useState<Tab>("run");
  const [isSaving, setIsSaving] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);
  const clock = useServerClock();
  const origin = useOrigin();

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await saveQuizData(code);
    setIsSaving(false);
    if (ok) {
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 4000);
    }
  };

  const sessionLive = useDocData<SessionDoc>(paths.session(code));
  const teamsLive = useCollectionData<TeamDoc>(ready ? paths.teams(code) : null, "teamName");
  const s = sessionLive.data;
  const currentId = s?.current?.id ?? null;
  const currentLive = useDocData<QuestionDoc>(ready && currentId ? paths.question(code, currentId) : null);
  const questionsLive = useCollectionData<QuestionDoc & { id: string }>(ready && tab === "questions" ? paths.questions(code) : null, "order");
  useAutoSync(code, ready ? (s?.status ?? null) : null, s?.lastSyncAt?.toMillis() ?? null);

  const teams = teamsLive.data;
  const counts: Counts = useMemo(
    () => ({
      checkedIn: teams.filter((t) => t.eligible && !!t.checkedInAt).length,
      eligible: teams.filter((t) => t.eligible).length,
      answered: teams.filter((t) => !!currentId && t.currentAnswer?.qid === currentId).length,
    }),
    [teams, currentId],
  );
  const playingCount = useMemo(() => teams.filter((t) => t.eligible && !!t.deviceId).length, [teams]);
  const rows = useMemo(() => teamBoardRows(teams, currentId), [teams, currentId]);
  const standings = useMemo(() => standingsFromTeams(teams), [teams]);
  const attention = useMemo(
    () => rows.filter((r) => r.eligible && ((r.checkedIn && !r.deviceBound) || (s?.status === "lobby" && !r.checkedIn && r.deskScanned))).length,
    [rows, s?.status],
  );
  const cq = currentLive.data;
  const currentQuestion: QuestionLite | null =
    s && cq && currentId ? { id: currentId, order: s.currentIndex, text: cq.text, options: cq.options, correctIndex: cq.correctIndex, points: cq.points, timeLimitSec: cq.timeLimitSec } : null;
  const distribution = useMemo(() => (cq ? liveDistribution(teams, currentId, cq.options.length) : null), [cq, teams, currentId]);
  const questionList: QuestionLite[] = questionsLive.data.map((q) => ({ id: q.id, order: q.order, text: q.text, options: q.options, correctIndex: q.correctIndex, points: q.points, timeLimitSec: q.timeLimitSec }));

  const presentUrl = `${origin}/present/${code}`;
  const copyProjector = async () => {
    try {
      await navigator.clipboard.writeText(presentUrl);
      toast.success("Projector link copied");
    } catch {
      toast.error(presentUrl);
    }
  };

  if (fb.status === "loading" || sessionLive.loading) return <StateMessage icon={Loader2} spin title="Loading" />;
  if (!ready) return <StateMessage icon={ShieldAlert} title="Admin access needed" subtitle={fb.error ?? fb.email ?? undefined} />;
  if (!s) return <StateMessage icon={SearchX} title="Session not found" />;
  const summary = adminSummary(s);
  const setupPhase = s.status === "draft" || s.status === "lobby";

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.title}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={s.status} />
            <span className="text-white/20">&bull;</span>
            <span className="truncate text-white/50">{s.eventTitle}</span>
          </span>
        }
        right={
          <>
            <Link href={`/present/${code}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full text-xs" })}>
              <MonitorPlay />
              Projector
            </Link>
            <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => void copyProjector()} aria-label="Copy projector link">
              <Copy />
            </Button>
            <Link href={`/present/${code}/board`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full text-xs" })}>
              <Trophy />
              Board
            </Link>
            {(s.status === "live" || s.status === "ended") && (
              <a href={`/api/admin/sessions/${code}/export`} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full text-xs" })}>
                <Download />
                CSV
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full text-xs font-semibold gap-1.5 transition-all",
                savedJustNow
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
              )}
              disabled={isSaving}
              onClick={() => void handleSave()}
              title="Save all questions, answers, teams, and standings permanently to Firebase DB"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : savedJustNow ? (
                <CheckCircle2 className="size-3.5 text-emerald-400" />
              ) : (
                <Database className="size-3.5 text-sky-400" />
              )}
              <span>{isSaving ? "Saving..." : savedJustNow ? "Saved to DB" : "Save to DB"}</span>
            </Button>
          </>
        }
      />

      <nav aria-label="Console tabs" className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-4">
        <TabButton active={tab === "run"} onClick={() => setTab("run")}>
          <span className="relative flex size-2">
            {s.status === "live" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Run
        </TabButton>
        <TabButton active={tab === "questions"} onClick={() => setTab("questions")}>
          <ListChecks className="size-3.5" />
          Questions ({s.plan.length})
        </TabButton>

        {/* Live Audience & Participation Counters */}
        <div className="flex items-center gap-1.5 pl-2 shrink-0">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#16161d] px-2.5 py-1 text-xs font-medium text-white/70 shadow-sm"
            title="Eligible confirmed teams registered for this quiz"
          >
            <Users className="size-3 text-white/40" />
            <span className="font-mono text-white font-semibold">{counts.eligible}</span>
            <span className="hidden sm:inline text-white/50 text-[11px]">Eligible</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 shadow-sm"
            title="Teams checked into the quiz room"
          >
            <CheckCircle2 className="size-3 text-emerald-400" />
            <span className="font-mono font-bold">{counts.checkedIn}</span>
            <span className="hidden sm:inline text-[11px]">Checked In</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300 shadow-sm"
            title="Teams actively connected with a device ready to answer"
          >
            <Smartphone className="size-3 text-sky-400" />
            <span className="font-mono font-bold">{playingCount}</span>
            <span className="hidden sm:inline text-[11px]">Playing</span>
          </div>
        </div>

        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[11px] text-white/40 sm:flex">
          <Radio className="size-3" />v{s.stateVersion}
        </span>
      </nav>

      {tab === "run" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="flex min-w-0 flex-col gap-6">
            <HostControls code={code} session={summary} questionCount={s.plan.length} counts={counts} clock={clock} />
            {setupPhase && <Checklist questionCount={s.plan.length} lastSyncMs={s.lastSyncAt?.toMillis() ?? null} counts={counts} attention={attention} />}
            {s.status === "live" && s.phase === "question" && (
              <p className="font-mono text-xs text-white/60 tabular-nums">
                Answered {counts.answered}/{counts.checkedIn}
              </p>
            )}
            {currentQuestion && s.phase !== "idle" && (
              <CurrentQuestionCard
                key={`${currentId}-${s.questionOpenedAt?.toMillis()}`}
                session={summary}
                question={currentQuestion}
                distribution={distribution}
                teams={teams}
              />
            )}
            {!setupPhase && (
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] shadow-2xl">
                <div className="border-b border-white/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-white/60">Standings</div>
                <StandingsTable rows={standings} />
              </div>
            )}
            <DangerZone code={code} session={summary} />
          </div>
          <TeamsPanel code={code} session={s} rows={rows} loading={teamsLive.loading} />
        </div>
      )}
      {tab === "questions" && (
        <QuestionsPanel
          code={code}
          status={s.status}
          stateVersion={s.stateVersion}
          currentIndex={s.status === "live" ? s.currentIndex : -1}
          questions={questionList}
          loading={questionsLive.loading}
          session={summary}
          counts={counts}
          clock={clock}
        />
      )}

      <ReconnectingPill show={sessionLive.offline} />
    </div>
  );
}

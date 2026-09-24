"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ListChecks, Loader2, MonitorPlay, Radio, SearchX, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { StateMessage } from "@/components/quiz/StateMessage";
import { usePolling } from "@/hooks/usePolling";
import { useServerNow } from "@/hooks/useServerNow";
import { cn } from "@/lib/utils";
import type { AdminSessionView } from "@/lib/quiz/types";
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

export function AdminConsole({ code }: { code: string }) {
  const poll = usePolling<AdminSessionView>(`/api/admin/sessions/${code}`);
  const now = useServerNow(poll.serverNow);
  const [tab, setTab] = useState<Tab>("live");
  const v = poll.data;

  if (!v) {
    return poll.error ? <StateMessage icon={SearchX} title={poll.error.message} /> : <StateMessage icon={Loader2} spin title="Loading" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={v.session.title}
        subtitle={
          <span className="flex items-center gap-2">
            <span className="font-mono font-bold text-rose-400">#{code}</span>
            <span className="text-white/20">•</span>
            <StatusBadge status={v.session.status} />
          </span>
        }
        right={
          <>
            <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full text-xs" })}>
              <ArrowLeft />
              Sessions
            </Link>
            <Link href={`/present/${code}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full text-xs" })}>
              <MonitorPlay />
              Present
            </Link>
          </>
        }
      />

      <nav aria-label="Console tabs" className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-4">
        <TabButton active={tab === "live"} onClick={() => setTab("live")}>
          <span className="relative flex size-2">
            {v.session.status === "live" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </TabButton>
        <TabButton active={tab === "questions"} onClick={() => setTab("questions")}>
          <ListChecks className="size-3.5" />
          Questions ({v.questions.length})
        </TabButton>
        <TabButton active={tab === "teams"} onClick={() => setTab("teams")}>
          <Users className="size-3.5" />
          Teams
        </TabButton>
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[11px] text-white/40 sm:flex">
          <Radio className="size-3" />
          v{v.session.stateVersion}
        </span>
      </nav>

      {tab === "live" && <LivePanel code={code} view={v} now={now} onChanged={poll.refresh} />}
      {tab === "questions" && <QuestionsPanel code={code} view={v} onChanged={poll.refresh} />}
      {tab === "teams" && <TeamsPanel code={code} view={v} />}

      <ReconnectingPill show={poll.reconnecting} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DoorOpen, Download, Eye, Flag, ListOrdered, Play, RotateCcw, SkipForward, Square, TimerReset } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CountdownRing } from "@/components/quiz/CountdownRing";
import { ResultBar } from "@/components/quiz/ResultBar";
import { api, type ApiError } from "@/lib/client/api";
import type { AdminSessionView, ControlAction } from "@/lib/quiz/types";
import { ConfirmButton } from "./ConfirmButton";
import { StandingsTable } from "./StandingsTable";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";

export function LivePanel({
  code,
  view,
  now,
  onChanged,
}: {
  code: string;
  view: AdminSessionView;
  now: number;
  onChanged: () => Promise<void>;
}) {
  const { session: s, questions, counts, distribution: dist, standings } = view;
  const [busy, setBusy] = useState(false);

  const control = async (action: ControlAction) => {
    setBusy(true);
    try {
      await api(`/api/admin/sessions/${code}/control`, { body: action });
      await onChanged();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const q = s.currentIndex >= 0 ? questions[s.currentIndex] : undefined;
  const isLast = s.currentIndex >= questions.length - 1;
  const inQuestion = s.status === "live" && s.phase === "question";
  const open = inQuestion && s.questionClosesAt !== null && now < s.questionClosesAt;
  const inLeadIn = inQuestion && s.questionOpenedAt !== null && now < s.questionOpenedAt;
  const afterQuestion = s.status === "live" && (s.phase === "reveal" || s.phase === "leaderboard");
  const total = (dist ?? []).reduce((a, b) => a + b, 0);
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Status" value={<StatusBadge status={s.status} />} hint={<span className="font-mono uppercase">{s.phase}</span>} />
        <StatCard tone="sky" label="Question" value={`${q ? s.currentIndex + 1 : 0}/${questions.length}`} progress={pct(q ? s.currentIndex + 1 : 0, questions.length)} />
        <StatCard tone="emerald" label="Checked in" value={`${counts.checkedIn}/${counts.eligible}`} progress={pct(counts.checkedIn, counts.eligible)} />
        <StatCard tone="amber" label="Answered" value={`${counts.answered}/${counts.checkedIn}`} progress={pct(counts.answered, counts.checkedIn)} />
      </div>

      <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider text-white/60">Controls</div>
        <div className="flex flex-wrap items-center gap-2">
          {s.status === "draft" && (
            <Button loading={busy} onClick={() => control({ type: "open_lobby" })}>
              <DoorOpen />
              Open lobby
            </Button>
          )}
          {s.status === "lobby" && (
            <>
              <ConfirmButton
                variant="emerald"
                label="Start quiz"
                title="Start the quiz?"
                description="Check-in closes and question 1 opens for everyone."
                disabled={busy || questions.length === 0}
                icon={<Play />}
                onConfirm={() => control({ type: "start" })}
              />
              <Button variant="outline" disabled={busy} onClick={() => control({ type: "toggle_checkin" })}>
                {s.checkinOpen ? "Close check-in" : "Open check-in"}
              </Button>
            </>
          )}
          {inQuestion && (
            <>
              <Button variant="outline" disabled={busy || !open} onClick={() => control({ type: "extend", seconds: 15 })}>
                <TimerReset />
                +15s
              </Button>
              <Button variant="outline" disabled={busy || !open} onClick={() => control({ type: "close_now" })}>
                <Square />
                Close now
              </Button>
              <Button disabled={busy} onClick={() => control({ type: "reveal" })}>
                <Eye />
                Reveal
              </Button>
              <ConfirmButton
                variant="outline"
                label="Restart question"
                title="Restart this question?"
                description="Deletes its answers and reopens it for everyone."
                disabled={busy}
                icon={<RotateCcw />}
                onConfirm={() => control({ type: "restart_question" })}
              />
            </>
          )}
          {s.status === "live" && s.phase === "reveal" && (
            <Button disabled={busy} onClick={() => control({ type: "show_leaderboard" })}>
              <ListOrdered />
              Leaderboard
            </Button>
          )}
          {afterQuestion && !isLast && (
            <Button variant="emerald" disabled={busy} onClick={() => control({ type: "next" })}>
              <SkipForward />
              Next question
            </Button>
          )}
          {(s.status === "live" || s.status === "lobby") && (
            <ConfirmButton
              variant="destructive-outline"
              label="End quiz"
              title="End the quiz?"
              description="Final results become visible to everyone."
              disabled={busy}
              icon={<Flag />}
              onConfirm={() => control({ type: "end" })}
            />
          )}
          {(s.status === "live" || s.status === "ended") && (
            <a href={`/api/admin/sessions/${code}/export`} className={buttonVariants({ variant: "outline" })}>
              <Download />
              Export CSV
            </a>
          )}
          {inQuestion && s.questionOpenedAt !== null && s.questionClosesAt !== null && (
            <div className="ml-auto">
              {inLeadIn ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Starting
                </span>
              ) : (
                <CountdownRing openedAt={s.questionOpenedAt} closesAt={s.questionClosesAt} now={now} size={52} />
              )}
            </div>
          )}
        </div>
        {afterQuestion && isLast && <p className="mt-3 text-xs text-amber-300/80">Last question. End the quiz to publish results.</p>}
        {s.status === "lobby" && questions.length === 0 && <p className="mt-3 text-xs text-amber-300/80">Add questions before starting.</p>}
      </div>

      {q && (
        <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-white/60 tabular-nums">
            Q{s.currentIndex + 1} &middot; {q.points} pts &middot; {q.timeLimitSec}s
          </p>
          <p className="mt-2 mb-4 break-words text-lg font-semibold tracking-tight">{q.text}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((o, i) => (
              <ResultBar key={i} index={i} text={o} count={dist?.[i] ?? 0} total={total} correct={i === q.correctIndex ? true : null} />
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0e0e12] shadow-2xl">
        <div className="border-b border-white/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-white/60">Standings</div>
        <StandingsTable rows={standings} />
      </div>
    </div>
  );
}

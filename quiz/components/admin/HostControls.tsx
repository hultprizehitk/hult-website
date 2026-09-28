"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, DoorOpen, Flag, Pause, Play, RotateCcw, Square, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CountdownRing } from "@/components/quiz/CountdownRing";
import { ConfirmButton } from "./ConfirmButton";
import { useServerNow } from "@/hooks/useServerNow";
import { sendControl } from "@/lib/client/control";
import { cn } from "@/lib/utils";
import type { AdminSessionSummary, ControlAction, Counts } from "@/lib/quiz/types";

interface Step {
  label: string;
  action: ControlAction;
  icon: React.ReactNode;
  disabled?: boolean;
  confirm?: { title: string; description: string };
}

/** The one primary action for each moment of the quiz (spec §3). */
function primaryStep(s: AdminSessionSummary, questionCount: number, counts: Counts, now: number): Step | null {
  const nextNo = s.currentIndex + 2;
  const teams = (n: number) => `${n} ${n === 1 ? "team" : "teams"}`;
  const isLast = s.currentIndex >= questionCount - 1;
  if (s.status === "draft") return { label: "Open check-in", action: { type: "open_lobby" }, icon: <DoorOpen />, disabled: questionCount === 0 };
  if (s.status === "lobby") {
    const out = counts.eligible - counts.checkedIn;
    return {
      label: "Start quiz",
      action: { type: "start" },
      icon: <Play />,
      disabled: questionCount === 0 || counts.checkedIn === 0,
      confirm: {
        title: "Start the quiz?",
        description: `${teams(counts.checkedIn)} in.${out > 0 ? ` ${teams(out)} not in will be locked out.` : ""} Check-in closes now.`,
      },
    };
  }
  if (s.status !== "live") return null;
  if (s.phase === "idle") return { label: "Question 1", action: { type: "next" }, icon: <ArrowRight /> };
  if (s.phase === "question") {
    const inLeadIn = s.questionOpenedAt !== null && now < s.questionOpenedAt;
    const open = s.questionClosesAt !== null && now < s.questionClosesAt;
    const waiting = counts.checkedIn - counts.answered;
    return {
      label: "Show results",
      action: { type: "show_results" },
      icon: <ArrowRight />,
      disabled: inLeadIn,
      confirm: open && waiting > 0 ? { title: "Timer still running", description: `${teams(waiting)} not answered yet. Close the question and show results?` } : undefined,
    };
  }
  if (isLast) {
    return { label: "Final results", action: { type: "end" }, icon: <Flag />, confirm: { title: "Show final results?", description: "Ends the quiz and shows the podium." } };
  }
  return { label: `Question ${nextNo}`, action: { type: "next" }, icon: <ArrowRight /> };
}

function stageLabel(s: AdminSessionSummary, questionCount: number, now: number): string {
  if (s.status === "draft") return "Setup";
  if (s.status === "lobby") return s.checkinOpen ? "Check-in open" : "Check-in paused";
  if (s.status === "ended") return "Ended";
  if (s.phase === "idle") return "Quiz is starting";
  const q = `Question ${s.currentIndex + 1} of ${questionCount}`;
  if (s.phase === "results") return `${q} · Results`;
  if (s.questionOpenedAt !== null && now < s.questionOpenedAt) return `${q} · Starting`;
  if (s.questionClosesAt !== null && now < s.questionClosesAt) return `${q} · Answering`;
  return `${q} · Time up`;
}

export function HostControls({
  code,
  session: s,
  questionCount,
  counts,
  clock,
}: {
  code: string;
  session: AdminSessionSummary;
  questionCount: number;
  counts: Counts;
  clock: () => number;
}) {
  const now = useServerNow(clock);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<Step | null>(null);
  const step = primaryStep(s, questionCount, counts, now);

  const run = useCallback(
    async (action: ControlAction) => {
      setBusy(true);
      await sendControl(code, action, s.stateVersion);
      setBusy(false);
    },
    [code, s.stateVersion],
  );

  const trigger = useCallback(() => {
    if (!step || step.disabled || busy) return;
    if (step.confirm) setConfirming(step);
    else void run(step.action);
  }, [step, busy, run]);

  // "N" = primary action (with its confirmation if any). Ignored while typing or when a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      e.preventDefault();
      trigger();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger]);

  const inQuestion = s.status === "live" && s.phase === "question";
  const open = inQuestion && s.questionClosesAt !== null && now < s.questionClosesAt;
  const inLeadIn = inQuestion && s.questionOpenedAt !== null && now < s.questionOpenedAt;
  const total = Math.max(questionCount, 1);

  return (
    <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-white/50">Now</p>
          <p className="mt-1 truncate text-xl font-bold tracking-tight">{stageLabel(s, questionCount, now)}</p>
        </div>
        {inQuestion && s.questionOpenedAt !== null && s.questionClosesAt !== null && !inLeadIn && (
          <CountdownRing openedAt={s.questionOpenedAt} closesAt={s.questionClosesAt} now={now} size={56} />
        )}
      </div>

      {questionCount > 0 && (
        <div className="mt-4 flex gap-1" aria-label="Question progress">
          {Array.from({ length: questionCount }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < s.currentIndex || (i === s.currentIndex && (s.phase === "results" || s.status === "ended"))
                  ? "bg-emerald-400"
                  : i === s.currentIndex
                    ? "bg-amber-300"
                    : "bg-white/10",
              )}
              style={{ maxWidth: `${100 / total}%` }}
            />
          ))}
        </div>
      )}

      {step && (
        <div className="mt-5 flex flex-col gap-2">
          <Button size="xl" variant={s.status === "lobby" ? "emerald" : "default"} className="h-14 w-full rounded-2xl text-lg font-bold" loading={busy} disabled={step.disabled} onClick={trigger}>
            {step.icon}
            {step.label}
          </Button>
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-white/35">Press N</p>
        </div>
      )}

      {(inQuestion || s.status === "lobby") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.status === "lobby" && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void run({ type: "toggle_checkin" })}>
              {s.checkinOpen ? <Pause /> : <Play />}
              {s.checkinOpen ? "Pause check-in" : "Resume check-in"}
            </Button>
          )}
          {inQuestion && (
            <>
              <Button variant="outline" size="sm" disabled={busy || !open} onClick={() => void run({ type: "extend", seconds: 15 })}>
                <TimerReset />
                +15s
              </Button>
              <Button variant="outline" size="sm" disabled={busy || !open || inLeadIn} onClick={() => void run({ type: "close_now" })}>
                <Square />
                Close early
              </Button>
              <ConfirmButton
                variant="outline"
                size="sm"
                label="Restart question"
                title="Restart this question?"
                description="Clears its answers and reopens it for everyone."
                disabled={busy}
                icon={<RotateCcw />}
                onConfirm={() => run({ type: "restart_question" })}
              />
            </>
          )}
        </div>
      )}

      {s.status === "draft" && questionCount === 0 && <p className="mt-3 text-xs text-amber-300/80">Add questions first</p>}
      {s.status === "lobby" && counts.checkedIn === 0 && <p className="mt-3 text-xs text-amber-300/80">Waiting for the first team</p>}

      <Dialog open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirming?.confirm?.title}</DialogTitle>
            <DialogDescription>{confirming?.confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              autoFocus
              onClick={() => {
                const c = confirming;
                setConfirming(null);
                if (c) void run(c.action);
              }}
            >
              {confirming?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

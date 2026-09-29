"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Flag, Play, RotateCcw, Sparkles, Square, TimerReset } from "lucide-react";
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
  const currentNo = s.currentIndex + 1;
  const nextNo = s.currentIndex + 2;
  const teams = (n: number) => `${n} ${n === 1 ? "team" : "teams"}`;
  const isLast = s.currentIndex >= questionCount - 1;
  // No quiz check-in: players scanned at the desk join on their own, before or after Start.
  if (s.status === "draft" || s.status === "lobby") {
    return {
      label: "Start quiz",
      action: { type: "start" },
      icon: <Play />,
      disabled: questionCount === 0,
      confirm: {
        title: "Are you sure you want to start the quiz?",
        description: `${teams(counts.checkedIn)} joined so far. Once started, the live quiz room will begin.`,
      },
    };
  }
  if (s.status !== "live") return null;

  if (s.phase === "idle") {
    const targetQ = s.currentIndex < 0 ? 1 : nextNo;
    return {
      label: `Question ${targetQ}`,
      action: { type: "next" },
      icon: <ArrowRight />,
      confirm: {
        title: `Are you sure you want to start Question ${targetQ}?`,
        description: `This will immediately reveal Question ${targetQ} on the projector and start the live countdown for all teams.`,
      },
    };
  }

  if (s.phase === "question") {
    const inLeadIn = s.questionOpenedAt !== null && now < s.questionOpenedAt;
    const open = s.questionClosesAt !== null && now < s.questionClosesAt;
    const waiting = counts.checkedIn - counts.answered;
    return {
      label: "Show results",
      action: { type: "show_results" },
      icon: <ArrowRight />,
      disabled: inLeadIn,
      confirm: {
        title: `Are you sure you want to show results for Question ${currentNo}?`,
        description:
          open && waiting > 0
            ? `The timer is still running and ${teams(waiting)} have not answered yet. Showing results will stop answers and reveal the correct choice.`
            : "This will reveal the correct answer and leaderboard on the big screen.",
      },
    };
  }

  if (s.phase === "results") {
    if (isLast) {
      return {
        label: "Final results",
        action: { type: "end" },
        icon: <Flag />,
        confirm: {
          title: "Are you sure you want to end the quiz and show final results?",
          description: "This will officially end the quiz session and present the winner podium on the big screen.",
        },
      };
    }

    return {
      label: `Ready Question ${nextNo}`,
      action: { type: "ready_next" },
      icon: <Sparkles className="size-5 text-amber-300" />,
      confirm: {
        title: `Show "Are you ready for Question ${nextNo}?"`,
        description: `This will dismiss the leaderboard on the projector and student devices, showing "Are you ready for Question ${nextNo}?" so you can get everyone ready before launching.`,
      },
    };
  }

  return null;
}

function stageLabel(s: AdminSessionSummary, questionCount: number, now: number): string {
  if (s.status === "draft" || s.status === "lobby") return "Setup";
  if (s.status === "ended") return "Ended";
  if (s.phase === "idle") {
    return s.currentIndex < 0 ? "Quiz is starting" : `Ready for Question ${s.currentIndex + 2}`;
  }
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
    const confirmInfo = step.confirm ?? {
      title: `Are you sure you want to proceed with "${step.label}"?`,
      description: "Please confirm to continue.",
    };
    setConfirming({ ...step, confirm: confirmInfo });
  }, [step, busy]);

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
  // +15s and Restart work on the current question whether it is open, timed out, in results or after the end.
  const hasCurrent = (s.status === "live" || s.status === "ended") && s.currentIndex >= 0;
  const isLast = s.currentIndex >= questionCount - 1;
  const nextNo = s.currentIndex + 2;
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
          <Button size="xl" variant={s.status === "draft" || s.status === "lobby" ? "emerald" : "default"} className="h-14 w-full rounded-2xl text-lg font-bold" loading={busy} disabled={step.disabled} onClick={trigger}>
            {step.icon}
            {step.label}
          </Button>
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-white/35">Press N</p>
        </div>
      )}

      {hasCurrent && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hasCurrent && (
            <>
              <Button variant="outline" size="sm" disabled={busy || inLeadIn} onClick={() => void run({ type: "extend", seconds: 15 })}>
                <TimerReset />
                {open ? "+15s" : "Reopen +15s"}
              </Button>
              {inQuestion && (
                <ConfirmButton
                  variant="outline"
                  size="sm"
                  label="Close early"
                  title="Close question early?"
                  description="Are you sure you want to stop the timer now? No more answers will be accepted."
                  disabled={busy || !open || inLeadIn}
                  icon={<Square />}
                  onConfirm={() => run({ type: "close_now" })}
                />
              )}
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
              {s.phase === "results" && !isLast && (
                <ConfirmButton
                  variant="outline"
                  size="sm"
                  label={`Skip to Question ${nextNo}`}
                  title={`Start Question ${nextNo} directly?`}
                  description={`Launches Question ${nextNo} immediately without showing the "Are you ready?" announcement screen.`}
                  disabled={busy}
                  icon={<ArrowRight />}
                  onConfirm={() => run({ type: "next" })}
                />
              )}
            </>
          )}
        </div>
      )}

      {s.status === "draft" && questionCount === 0 && <p className="mt-3 text-xs text-amber-300/80">Add questions first</p>}

      <Dialog open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirming?.confirm?.title}</DialogTitle>
            <DialogDescription>{confirming?.confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              autoFocus
              variant="default"
              onClick={() => {
                const c = confirming;
                setConfirming(null);
                if (c) void run(c.action);
              }}
            >
              Yes, proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

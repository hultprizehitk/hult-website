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
  // In draft: open the lobby. In lobby: ready the first question.
  if (s.status === "draft") {
    return {
      label: "Open lobby",
      action: { type: "open_lobby" },
      icon: <Play />,
      disabled: questionCount === 0,
      confirm: {
        title: "Open the quiz lobby?",
        description: "This allows teams to scan the QR code and join the live lobby.",
      },
    };
  }

  if (s.status === "lobby") {
    return {
      label: "Ready Question 1",
      action: { type: "start" },
      icon: <Sparkles className="size-5 text-amber-300" />,
      disabled: questionCount === 0,
      confirm: {
        title: `Show "Are you ready for Question 1?"`,
        description: `${teams(counts.checkedIn)} joined so far. This will show "Are you ready for Question 1?" on the projector and student devices so you can get everyone ready before launching.`,
      },
    };
  }

  if (s.status !== "live") return null;

  if (s.phase === "idle") {
    const targetQ = s.currentIndex < 0 ? 1 : nextNo;
    const isTargetLast = targetQ >= questionCount;
    return {
      label: isTargetLast ? `Launch Final Question ${targetQ}` : `Launch Question ${targetQ}`,
      action: { type: "next" },
      icon: <ArrowRight />,
      confirm: {
        title: isTargetLast
          ? `Launch Final Question ${targetQ} of ${questionCount}?`
          : `Are you sure you want to launch Question ${targetQ}?`,
        description: isTargetLast
          ? `This is the final question of the quiz. It will reveal Question ${targetQ} on the projector and start the live countdown for all teams.`
          : `This will immediately reveal Question ${targetQ} on the projector and start the live countdown for all teams.`,
      },
    };
  }

  if (s.phase === "question") {
    const inLeadIn = s.questionOpenedAt !== null && now < s.questionOpenedAt;
    const open = s.questionClosesAt !== null && now < s.questionClosesAt;
    const waiting = counts.checkedIn - counts.answered;

    if (isLast) {
      return {
        label: "Direct Final Results",
        action: { type: "end" },
        icon: <Flag className="size-5 text-amber-300" />,
        disabled: inLeadIn,
        confirm: {
          title: "End quiz and show direct final results?",
          description:
            open && waiting > 0
              ? `This is the final question (${currentNo} of ${questionCount}). The timer is running and ${teams(waiting)} have not answered yet. This will close the question, grade all teams, and immediately present the Final Results and winner podium on the big screen.`
              : `This is the final question (${currentNo} of ${questionCount}). This will grade all teams, compute final rankings, and immediately present the Final Results and winner podium on the big screen.`,
        },
      };
    }

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
        label: "Direct Final Results",
        action: { type: "end" },
        icon: <Flag className="size-5 text-amber-300" />,
        confirm: {
          title: "Show Direct Final Results & End Quiz?",
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
  const isLast = s.currentIndex >= questionCount - 1;
  if (s.phase === "idle") {
    const nextQ = s.currentIndex < 0 ? 1 : s.currentIndex + 2;
    const isNextLast = nextQ >= questionCount;
    return isNextLast ? `Ready for Final Question ${nextQ}` : `Ready for Question ${nextQ}`;
  }
  const qPrefix = isLast ? `Final Question (${s.currentIndex + 1} of ${questionCount})` : `Question ${s.currentIndex + 1} of ${questionCount}`;
  if (s.phase === "results") return `${qPrefix} · Results`;
  if (s.questionOpenedAt !== null && now < s.questionOpenedAt) return `${qPrefix} · Starting`;
  if (s.questionClosesAt !== null && now < s.questionClosesAt) return `${qPrefix} · Answering`;
  return `${qPrefix} · Time up`;
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

  // Advance hotkey: "N", "PageDown", or clicker right-arrow. Ignored while typing or when a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const isNextKey = e.key.toLowerCase() === "n" || e.key === "PageDown" || e.key === "ArrowRight";
      if (!isNextKey) return;
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
          <Button
            size="xl"
            variant={s.status === "draft" || s.status === "lobby" ? "emerald" : "default"}
            className={cn(
              "h-14 w-full rounded-2xl text-lg font-bold transition-all",
              step.action.type === "end" && "border-none bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/25 hover:opacity-95",
            )}
            loading={busy}
            disabled={step.disabled}
            onClick={trigger}
          >
            {step.icon}
            {step.label}
          </Button>
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-white/35">Press N or Clicker &rarr;</p>
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
              {inQuestion && isLast && (
                <ConfirmButton
                  variant="outline"
                  size="sm"
                  label="Show Q results only"
                  title={`Show Question ${s.currentIndex + 1} results only?`}
                  description="This will reveal this question's answer and interim standings without ending the quiz yet."
                  disabled={busy || inLeadIn}
                  icon={<ArrowRight />}
                  onConfirm={() => run({ type: "show_results" })}
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

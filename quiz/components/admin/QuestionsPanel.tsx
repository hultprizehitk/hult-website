"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Lock, Pencil, Plus, Radio, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type ApiError } from "@/lib/client/api";
import { optionLetter } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminSessionView, QuestionLite } from "@/lib/quiz/types";
import { ConfirmButton } from "./ConfirmButton";
import { ImportCsvDialog } from "./ImportCsvDialog";
import { QuestionForm } from "./QuestionForm";

export function QuestionsPanel({
  code,
  view,
  onChanged,
  onNavigateLive,
}: {
  code: string;
  view: AdminSessionView;
  onChanged: () => Promise<void>;
  onNavigateLive?: () => void;
}) {
  const editable = view.session.status === "draft" || view.session.status === "lobby";
  const qs = view.questions;
  const [editing, setEditing] = useState<QuestionLite | "new" | null>(null);
  const [publishingIndex, setPublishingIndex] = useState<number | null>(null);

  const publishQuestion = async (i: number) => {
    setPublishingIndex(i);
    try {
      await api(`/api/admin/sessions/${code}/control`, {
        body: { type: "publish_question", index: i, expectedVersion: view.session.stateVersion },
      });
      toast.success(`Question ${i + 1} published to live player console`);
      await onChanged();
      if (onNavigateLive) {
        onNavigateLive();
      }
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setPublishingIndex(null);
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await onChanged();
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const ids = qs.map((q) => q.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void run(() => api(`/api/admin/sessions/${code}/questions`, { method: "PUT", body: { ids } }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-xs text-white/50">
          {editable ? (
            <>
              <span className="font-sans font-semibold text-white">{qs.length}</span> questions
            </>
          ) : (
            <>
              <Lock className="size-3.5" /> Locked while live
            </>
          )}
        </p>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <ImportCsvDialog code={code} existingCount={qs.length} onImported={() => void onChanged()} />
            <Button className="rounded-xl" onClick={() => setEditing("new")}>
              <Plus />
              Add question
            </Button>
          </div>
        )}
      </div>

      {qs.length === 0 && (
        <div className="rounded-2xl border border-white/15 bg-[#0e0e12] py-16 text-center font-mono text-xs text-neutral-400">No questions yet</div>
      )}

      {qs.map((q, i) => {
        const isCurrentQuestion = view.session.status === "live" && view.session.currentIndex === i;
        const isLiveQuestion = isCurrentQuestion && view.session.phase === "question";

        return (
          <div
            key={q.id}
            className={cn(
              "rounded-3xl border p-5 shadow-2xl transition-all",
              isLiveQuestion
                ? "border-emerald-500/50 bg-[#0c1611] shadow-emerald-950/20"
                : isCurrentQuestion
                ? "border-amber-500/40 bg-[#14120e]"
                : "border-white/15 bg-[#0e0e12] hover:border-white/25",
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-xl border font-mono text-xs font-bold tabular-nums",
                    isLiveQuestion
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.04]",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold tracking-tight">{q.text}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/50 tabular-nums">
                    {q.points} pts &middot; {q.timeLimitSec}s
                  </p>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {q.options.map((o, oi) => (
                      <li
                        key={oi}
                        className={cn(
                          "flex items-center gap-2 text-xs",
                          oi === q.correctIndex ? "text-emerald-400 font-medium" : "text-neutral-400",
                        )}
                      >
                        <span className="font-mono font-bold">{optionLetter(oi)}</span>
                        <span className="break-words">{o}</span>
                        {oi === q.correctIndex && <Check className="size-3.5 shrink-0" />}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 pt-3 sm:border-0 sm:pt-0 sm:justify-end">
                {isLiveQuestion ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-300">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                    </span>
                    Live Now
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-xl font-semibold text-xs shadow-md transition-all gap-1.5",
                      isCurrentQuestion
                        ? "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40",
                    )}
                    disabled={publishingIndex !== null}
                    loading={publishingIndex === i}
                    onClick={() => void publishQuestion(i)}
                  >
                    <Radio className="size-3.5" />
                    {isCurrentQuestion ? "Re-publish" : "Publish"}
                  </Button>
                )}

                {editable && (
                  <div className="flex items-center gap-1 sm:border-l sm:border-white/10 sm:pl-2">
                    <Button size="icon-sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Move down" disabled={i === qs.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(q)}>
                      <Pencil />
                    </Button>
                    <ConfirmButton
                      size="icon-sm"
                      variant="ghost"
                      iconOnly
                      label="Delete"
                      title="Delete question?"
                      icon={<Trash2 className="text-rose-400" />}
                      onConfirm={() => run(() => api(`/api/admin/sessions/${code}/questions/${q.id}`, { method: "DELETE" }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {editing !== null && (
        <QuestionForm
          key={editing === "new" ? "new" : editing.id}
          code={code}
          initial={editing === "new" ? null : editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSaved={() => void onChanged()}
        />
      )}
    </div>
  );
}

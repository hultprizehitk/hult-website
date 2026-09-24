"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type ApiError } from "@/lib/client/api";
import { optionLetter } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminSessionView, QuestionLite } from "@/lib/quiz/types";
import { ConfirmButton } from "./ConfirmButton";
import { QuestionForm } from "./QuestionForm";

export function QuestionsPanel({
  code,
  view,
  onChanged,
}: {
  code: string;
  view: AdminSessionView;
  onChanged: () => Promise<void>;
}) {
  const editable = view.session.status === "draft" || view.session.status === "lobby";
  const qs = view.questions;
  const [editing, setEditing] = useState<QuestionLite | "new" | null>(null);

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
          <Button className="rounded-xl" onClick={() => setEditing("new")}>
            <Plus />
            Add question
          </Button>
        )}
      </div>

      {qs.length === 0 && (
        <div className="rounded-2xl border border-white/15 bg-[#0e0e12] py-16 text-center font-mono text-xs text-neutral-400">No questions yet</div>
      )}

      {qs.map((q, i) => (
        <div key={q.id} className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl transition-all hover:border-white/25">
          <div className="flex items-start gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] font-mono text-xs font-bold tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold tracking-tight">{q.text}</p>
              <p className="mt-0.5 font-mono text-[11px] text-white/50 tabular-nums">
                {q.points} pts &middot; {q.timeLimitSec}s
              </p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <li key={oi} className={cn("flex items-center gap-2 text-xs", oi === q.correctIndex ? "text-emerald-400" : "text-neutral-400")}>
                    <span className="font-mono font-bold">{optionLetter(oi)}</span>
                    <span className="break-words">{o}</span>
                    {oi === q.correctIndex && <Check className="size-3.5 shrink-0" />}
                  </li>
                ))}
              </ul>
            </div>
            {editable && (
              <div className="flex shrink-0 items-center gap-1">
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
      ))}

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

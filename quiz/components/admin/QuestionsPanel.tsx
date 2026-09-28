"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type ApiError } from "@/lib/client/api";
import { optionLetter } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuestionLite, SessionStatus } from "@/lib/quiz/types";
import { ConfirmButton } from "./ConfirmButton";
import { ImportCsvDialog } from "./ImportCsvDialog";
import { QuestionForm } from "./QuestionForm";

/** "Set for all": one points value and/or one time limit for every question. */
function BulkSet({ code, count }: { code: string; count: number }) {
  const [points, setPoints] = useState("");
  const [seconds, setSeconds] = useState("");
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    const body: { points?: number; timeLimitSec?: number } = {};
    if (points) body.points = Number(points);
    if (seconds) body.timeLimitSec = Number(seconds);
    setBusy(true);
    try {
      await api(`/api/admin/sessions/${code}/questions`, { method: "PATCH", body });
      toast.success(`Updated ${count} questions`);
      setPoints("");
      setSeconds("");
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0e0e12] px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">Set for all</span>
      <Input type="number" min={1} max={1000} placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} className="h-8 w-24" aria-label="Points for all" />
      <Input type="number" min={5} max={120} placeholder="Seconds" value={seconds} onChange={(e) => setSeconds(e.target.value)} className="h-8 w-24" aria-label="Seconds for all" />
      <Button size="sm" variant="outline" loading={busy} disabled={!points && !seconds} onClick={() => void apply()}>
        Apply
      </Button>
    </div>
  );
}

export function QuestionsPanel({ code, status, questions: qs, loading }: { code: string; status: SessionStatus; questions: QuestionLite[]; loading: boolean }) {
  const editable = status === "draft" || status === "lobby";
  const [editing, setEditing] = useState<QuestionLite | "new" | null>(null);
  // Once the quiz runs, answers stay hidden unless asked for (the admin laptop may be seen by others).
  const [showAnswers, setShowAnswers] = useState(false);
  const answersVisible = editable || showAnswers;

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-xs text-white/50">
          {editable ? (
            <>
              <span className="font-sans font-semibold text-white">{qs.length}</span> questions, asked in this order
            </>
          ) : (
            <>
              <Lock className="size-3.5" /> Locked after start
            </>
          )}
        </p>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <ImportCsvDialog code={code} existingCount={qs.length} onImported={() => {}} />
            <Button className="rounded-xl" onClick={() => setEditing("new")}>
              <Plus />
              Add question
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowAnswers((v) => !v)}>
            {showAnswers ? <EyeOff /> : <Eye />}
            {showAnswers ? "Hide answers" : "Show answers"}
          </Button>
        )}
      </div>

      {editable && qs.length > 1 && <BulkSet code={code} count={qs.length} />}

      {loading && qs.length === 0 && <div className="py-16 text-center font-mono text-xs text-neutral-500">Loading</div>}
      {!loading && qs.length === 0 && (
        <div className="rounded-2xl border border-white/15 bg-[#0e0e12] py-16 text-center font-mono text-xs text-neutral-400">No questions yet</div>
      )}

      {qs.map((q, i) => (
        <div key={q.id} className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] font-mono text-xs font-bold tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold tracking-tight">{q.text}</p>
                <p className="mt-0.5 font-mono text-[11px] text-white/50 tabular-nums">
                  {q.points} pts &middot; {q.timeLimitSec}s
                </p>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const correct = answersVisible && oi === q.correctIndex;
                    return (
                      <li key={oi} className={cn("flex items-center gap-2 text-xs", correct ? "font-medium text-emerald-400" : "text-neutral-400")}>
                        <span className="font-mono font-bold">{optionLetter(oi)}</span>
                        <span className="break-words">{o}</span>
                        {correct && <Check className="size-3.5 shrink-0" />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            {editable && (
              <div className="flex shrink-0 items-center gap-1 border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
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
          onSaved={() => {}}
        />
      )}
    </div>
  );
}

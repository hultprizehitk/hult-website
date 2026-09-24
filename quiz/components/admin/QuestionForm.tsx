"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type ApiError } from "@/lib/client/api";
import { optionLetter } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuestionLite } from "@/lib/quiz/types";

const LABEL = "font-mono text-[11px] uppercase tracking-wider text-white/60";

export function QuestionForm({
  code,
  initial,
  open,
  onOpenChange,
  onSaved,
}: {
  code: string;
  initial: QuestionLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState(initial?.correctIndex ?? 0);
  const [points, setPoints] = useState(initial?.points ?? 100);
  const [seconds, setSeconds] = useState(initial?.timeLimitSec ?? 20);
  const [busy, setBusy] = useState(false);

  const setOption = (i: number, value: string) => setOptions((o) => o.map((x, j) => (j === i ? value : x)));
  const removeOption = (i: number) => {
    setOptions((o) => o.filter((_, j) => j !== i));
    setCorrect((c) => (c === i ? 0 : c > i ? c - 1 : c));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const body = { text, options: options.map((o) => o.trim()), correctIndex: correct, points, timeLimitSec: seconds };
    try {
      if (initial) await api(`/api/admin/sessions/${code}/questions/${initial.id}`, { method: "PATCH", body });
      else await api(`/api/admin/sessions/${code}/questions`, { body });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Edit question" : "New question"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="qtext" className={LABEL}>
              Question
            </Label>
            <Textarea id="qtext" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} required />
            <p className="text-right font-mono text-[10px] text-white/40 tabular-nums">{text.length}/300</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label className={LABEL}>Options</Label>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Mark ${optionLetter(i)} correct`}
                  onClick={() => setCorrect(i)}
                  className={cn(
                    "grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border text-sm font-bold transition-colors",
                    correct === i ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" : "border-white/15 bg-[#16161d] text-white/60 hover:text-white",
                  )}
                >
                  {optionLetter(i)}
                </button>
                <Input value={o} onChange={(e) => setOption(i, e.target.value)} maxLength={120} required />
                <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove option" disabled={options.length <= 2} onClick={() => removeOption(i)}>
                  <X />
                </Button>
              </div>
            ))}
            {options.length < 6 && (
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setOptions((o) => [...o, ""])}>
                <Plus />
                Option
              </Button>
            )}
            <p className="text-[11px] text-white/50">Tap a letter to mark the answer</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pts" className={LABEL}>
                Points
              </Label>
              <Input id="pts" type="number" min={1} max={1000} value={points} onChange={(e) => setPoints(Number(e.target.value))} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="secs" className={LABEL}>
                Seconds
              </Label>
              <Input id="secs" type="number" min={5} max={120} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" loading={busy}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

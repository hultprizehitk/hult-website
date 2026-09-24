"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type ApiError } from "@/lib/client/api";
import { CSV_TEMPLATE, type ImportRowError } from "@/lib/quiz/csv-import";
import { optionLetter } from "@/lib/format";
import type { QuestionInput } from "@/lib/quiz/validation";
import { SegmentedControl } from "./SegmentedControl";

type Mode = "append" | "replace";
interface ImportResponse {
  imported: number;
  preview?: QuestionInput[];
  errors: ImportRowError[];
}

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "quiz-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportCsvDialog({ code, existingCount, onImported }: { code: string; existingCount: number; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("append");
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFileName("");
    setCsv("");
    setResult(null);
    setMode("append");
  };

  const send = (dryRun: boolean, text = csv) =>
    api<ImportResponse>(`/api/admin/sessions/${code}/questions/import`, { body: { csv: text, mode, dryRun } });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      setFileName(file.name);
      setCsv(text);
      setResult(await send(true, text));
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    setBusy(true);
    try {
      const r = await send(false);
      if (r.errors.length > 0) {
        setResult(r);
        return;
      }
      toast.success(`Imported ${r.imported} questions`);
      onImported();
      setOpen(false);
      reset();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const preview = result?.preview ?? [];
  const errors = result?.errors ?? [];
  const ready = preview.length > 0 && errors.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>
        <FileUp />
        Import CSV
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import questions</DialogTitle>
          <DialogDescription className="font-mono text-[11px]">
            Columns: question, a-f, answer (letter or option text), points, seconds
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-[#16161d] px-4 py-5 text-sm transition-colors hover:border-white/40 hover:bg-[#202028]">
              <FileUp className="size-4 text-white/60" />
              <span className="truncate">{fileName || "Choose CSV file"}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download />
              Template
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { value: "append", label: "Add to existing" },
                { value: "replace", label: "Replace all", count: existingCount },
              ]}
            />
            {mode === "replace" && existingCount > 0 && (
              <span className="text-xs text-rose-300">Deletes the {existingCount} current questions</span>
            )}
          </div>

          {errors.length > 0 && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-300">
                <TriangleAlert className="size-4" />
                {errors.length} {errors.length === 1 ? "problem" : "problems"} - nothing imported
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto font-mono text-[11px] text-rose-200/90">
                {errors.map((e, i) => (
                  <li key={i}>
                    <span className="text-rose-400">Row {e.row}</span> &middot; {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ready && (
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0a1f18] p-4">
              <p className="mb-2 font-mono text-xs uppercase tracking-wider text-emerald-400">{preview.length} questions ready</p>
              <ol className="max-h-64 space-y-1.5 overflow-y-auto text-xs">
                {preview.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-6 shrink-0 font-mono text-white/40 tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-white/90">{q.text}</span>
                    <span className="shrink-0 font-mono text-emerald-300">
                      {optionLetter(q.correctIndex)} {q.options[q.correctIndex]}
                    </span>
                    <span className="w-24 shrink-0 text-right font-mono text-white/40 tabular-nums">
                      {q.points} pts &middot; {q.timeLimitSec}s
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!ready} onClick={() => void doImport()}>
            Import {ready ? preview.length : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

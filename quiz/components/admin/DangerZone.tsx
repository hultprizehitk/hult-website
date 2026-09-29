"use client";

import { useState } from "react";
import { ChevronDown, Flag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmButton } from "./ConfirmButton";
import { sendControl } from "@/lib/client/control";
import type { AdminSessionSummary } from "@/lib/quiz/types";

/** Irreversible actions, kept away from the run controls (spec §4). */
export function DangerZone({ code, session: s }: { code: string; session: AdminSessionSummary }) {
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const canEnd = s.status === "lobby" || s.status === "live";

  return (
    <div className="rounded-3xl border border-rose-500/20 bg-[#0e0e12] shadow-2xl">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left" aria-expanded={open}>
        <span className="font-mono text-xs uppercase tracking-wider text-rose-300/80">Danger zone</span>
        <ChevronDown className={`size-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4">
          {canEnd && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/60">End now. Grades the current question.</p>
              <ConfirmButton
                variant="destructive-outline"
                size="sm"
                label="End quiz"
                title="End the quiz now?"
                description="Remaining questions are skipped. Final results go to every screen."
                icon={<Flag />}
                onConfirm={() => sendControl(code, { type: "end" }, s.stateVersion)}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/60">After the rehearsal. Clears scores, answers, joined teams and devices.</p>
            <Button variant="destructive-outline" size="sm" onClick={() => setResetOpen(true)}>
              <RotateCcw />
              Reset for event
            </Button>
          </div>
        </div>
      )}
      <Dialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o);
          if (!o) setTyped("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset for event?</DialogTitle>
            <DialogDescription>Back to setup. This run is archived. Type RESET to confirm.</DialogDescription>
          </DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="RESET" autoFocus aria-label="Type RESET" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={typed !== "RESET"}
              onClick={async () => {
                setResetOpen(false);
                setTyped("");
                await sendControl(code, { type: "reset_event", confirm: "RESET" }, s.stateVersion);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

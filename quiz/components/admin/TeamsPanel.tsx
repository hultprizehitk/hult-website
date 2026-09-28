"use client";

import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, RefreshCw, Search, Smartphone, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type ApiError } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import type { SessionDoc, SyncSummary } from "@/lib/quiz/fs-types";
import type { SessionStatus, TeamBoardRow } from "@/lib/quiz/types";
import type { TeamAdminInput } from "@/lib/quiz/validation";
import { ConfirmButton } from "./ConfirmButton";
import { SegmentedControl } from "./SegmentedControl";

type Filter = "all" | "in" | "out" | "attention";

function ago(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SyncBar({ code, session }: { code: string; session: SessionDoc }) {
  const [busy, setBusy] = useState(false);
  const canSync = session.status === "draft" || session.status === "lobby";
  const sync = async () => {
    setBusy(true);
    try {
      const { summary } = await api<{ summary: SyncSummary }>(`/api/admin/sessions/${code}/sync`, { body: {} });
      toast.success(`Synced: ${summary.eligible} eligible, ${summary.added} new, ${summary.updated} changed`);
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };
  const last = session.lastSyncAt?.toMillis() ?? null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <p className="min-w-0 truncate text-xs text-white/60">
        {last ? <>Synced {ago(last)}</> : <span className="text-amber-300">Not synced</span>}
        {canSync ? <span className="text-white/35"> · auto every 3 min</span> : <span className="text-white/35"> · locked after start</span>}
      </p>
      {canSync && (
        <Button variant="outline" size="xs" loading={busy} onClick={() => void sync()}>
          <RefreshCw />
          Sync
        </Button>
      )}
    </div>
  );
}

/** Teams that need an organizer: in without a phone, missed the last question, or scanned at the desk but not in. */
function needsAttention(r: TeamBoardRow, status: SessionStatus): boolean {
  if (r.checkedIn && !r.deviceBound) return true;
  if (status === "live" && r.checkedIn && r.missedLast) return true;
  return status === "lobby" && !r.checkedIn && r.deskScanned;
}

function PlayerCell({ code, row, status }: { code: string; row: TeamBoardRow; status: SessionStatus }) {
  const [pending, setPending] = useState<string | null>(null);
  const act = async (body: TeamAdminInput) => {
    try {
      await api(`/api/admin/sessions/${code}/teams`, { body });
      toast.success("Updated");
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };
  if (!row.checkedIn) return <span className="text-white/30">{status === "lobby" && row.deskScanned ? "Scanned at desk" : "-"}</span>;
  const nameOf = (email: string | null) => row.members.find((m) => m.email === email)?.name ?? email ?? "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={row.takerEmail ?? ""} onValueChange={(email) => setPending(email)} disabled={status === "ended"}>
        <SelectTrigger size="sm" className="w-44 text-xs" aria-label={`Player for ${row.teamName}`}>
          <SelectValue placeholder="No player" />
        </SelectTrigger>
        <SelectContent>
          {row.members.map((m) => (
            <SelectItem key={m.email} value={m.email}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span
        className={cn("inline-flex items-center gap-1 font-mono text-[10px] uppercase", row.deviceBound ? "text-emerald-400" : "text-amber-300")}
        title={row.deviceBound ? "Phone connected" : "No phone"}
      >
        <Smartphone className="size-3.5" />
        {row.deviceBound ? "On" : "None"}
      </span>
      {(row.takerEmail || row.deviceBound) && status !== "ended" && (
        <ConfirmButton
          size="xs"
          variant="ghost"
          label="Free seat"
          title={`Free ${row.teamName}'s seat?`}
          description="The current phone stops playing. Any member can then tap Play on this phone."
          icon={<UserRoundX />}
          onConfirm={() => act({ action: "free_seat", teamId: row.teamId })}
        />
      )}
      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch player to {nameOf(pending)}?</DialogTitle>
            <DialogDescription>Their phone takes over on its own. Answers already given stay.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const email = pending;
                setPending(null);
                if (email) void act({ action: "reassign_taker", teamId: row.teamId, email });
              }}
            >
              Switch player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Help desk: find a team fast and fix its seat without leaving the Run view. */
export const TeamsPanel = memo(function TeamsPanel({ code, session, rows: all, loading }: { code: string; session: SessionDoc; rows: TeamBoardRow[]; loading: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const live = session.status === "live";

  const eligible = useMemo(() => all.filter((r) => r.eligible), [all]);
  const needle = query.trim().toLowerCase();
  const rows = eligible
    .filter((r) =>
      filter === "all" ? true : filter === "in" ? r.checkedIn : filter === "out" ? !r.checkedIn : needsAttention(r, session.status),
    )
    .filter((r) => !needle || `${r.teamName} ${r.teamCode} ${r.members.map((m) => `${m.name} ${m.email}`).join(" ")}`.toLowerCase().includes(needle));
  const inCount = eligible.filter((r) => r.checkedIn).length;
  const attention = eligible.filter((r) => needsAttention(r, session.status)).length;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] shadow-2xl">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="font-mono text-xs uppercase tracking-wider text-white/60">Teams</p>
        <p className="font-mono text-xs text-white/50 tabular-nums">
          {inCount}/{eligible.length} in
        </p>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Team, code, member name or email"
            className="w-full rounded-2xl border border-white/15 bg-[#16161d] py-2.5 pr-4 pl-10 text-xs text-white shadow-inner placeholder:text-white/40 focus:border-white/50 focus:ring-1 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: eligible.length },
            { value: "in", label: "In", count: inCount },
            { value: "out", label: "Not in", count: eligible.length - inCount },
            { value: "attention", label: "Attention", count: attention },
          ]}
        />
      </div>
      <SyncBar code={code} session={session} />

      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-500">Loading teams</div>
      ) : eligible.length === 0 ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-400">No teams yet. Sync.</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-400">No teams match</div>
      ) : (
        <ul className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.teamId} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">{r.teamName}</p>
                  <p className="font-mono text-[11px] text-white/40">
                    <span className="font-bold text-rose-400">{r.teamCode}</span>
                    {live && r.rank !== null && <span> · #{r.rank} · {r.score} pts</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {live && r.checkedIn && (r.answeredCurrent ? <CheckCircle2 className="size-4 text-emerald-400" aria-label="Answered" /> : <Circle className="size-4 text-white/20" aria-label="Not answered" />)}
                  <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase", r.checkedIn ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/40")}>
                    {r.checkedIn ? "In" : "Not in"}
                  </span>
                </div>
              </div>
              <PlayerCell code={code} row={r} status={session.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

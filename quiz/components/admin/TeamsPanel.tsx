"use client";

import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpDown, CheckCircle2, Circle, RefreshCw, Search, Smartphone, Trophy, UserRoundX, Users } from "lucide-react";
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

type Filter = "all" | "in" | "playing" | "out" | "attention";
type TeamSort = "default" | "rank" | "score" | "name";

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
    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("size-2 rounded-full", canSync ? "bg-emerald-400 animate-pulse" : "bg-white/30")} />
        <p className="min-w-0 truncate text-xs text-white/70">
          {last ? <>Synced {ago(last)}</> : <span className="text-amber-300">Not synced</span>}
          {canSync ? <span className="text-white/40"> · Live sync active (20s)</span> : <span className="text-white/40"> · Locked after start</span>}
        </p>
      </div>
      {canSync && (
        <Button variant="outline" size="xs" loading={busy} onClick={() => void sync()} className="h-7 border-white/15 bg-white/5 text-xs text-white hover:bg-white/10">
          <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
          Sync MongoDB
        </Button>
      )}
    </div>
  );
}

/** Teams that need an organizer: in without a phone, missed the last question, or scanned at the desk but not in. */
function needsAttention(r: TeamBoardRow, status: SessionStatus): boolean {
  if (r.checkedIn && !r.deviceBound) return true;
  if (status === "live" && r.checkedIn && r.missedLast) return true;
  return (status === "draft" || status === "lobby") && !r.checkedIn && r.deskScanned;
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

  if (!row.checkedIn) {
    return (
      <div className="text-[11px] font-mono">
        {row.deskScanned ? (
          <span className="text-emerald-400/90 font-medium">✓ Pass scanned at desk · Awaiting player to open quiz and join</span>
        ) : (
          <span className="text-white/35">Pass not scanned yet · Must scan QR pass at auditorium desk before joining</span>
        )}
      </div>
    );
  }

  const nameOf = (email: string | null) => row.members.find((m) => m.email.toLowerCase() === email?.toLowerCase())?.name ?? email ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2 pt-0.5">
      <span className="text-[11px] font-mono text-white/50">Active Player:</span>
      <Select value={row.takerEmail ?? ""} onValueChange={(email) => setPending(email)} disabled={status === "ended"}>
        <SelectTrigger size="sm" className="h-7 w-48 text-xs border-white/15 bg-[#16161d]" aria-label={`Player for ${row.teamName}`}>
          <SelectValue placeholder="No player assigned" />
        </SelectTrigger>
        <SelectContent className="border-white/15 bg-[#16161d] text-white">
          {row.members.map((m) => (
            <SelectItem key={m.email} value={m.email}>
              {m.name} {m.email.toLowerCase() === row.leadEmail.toLowerCase() ? "(Lead)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
          row.deviceBound ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border border-amber-500/30 bg-amber-500/15 text-amber-300"
        )}
        title={row.deviceBound ? "Device connected" : "No device connected"}
      >
        <Smartphone className="size-3" />
        {row.deviceBound ? "Phone Active" : "No Phone"}
      </span>
      {(row.takerEmail || row.deviceBound) && status !== "ended" && (
        <ConfirmButton
          size="xs"
          variant="ghost"
          label="Free seat"
          title={`Free ${row.teamName}'s seat?`}
          description="The current device stops playing. Any checked-in team member can then tap 'Play on this device'."
          icon={<UserRoundX className="size-3.5" />}
          onConfirm={() => act({ action: "free_seat", teamId: row.teamId })}
        />
      )}
      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="border-white/15 bg-[#16161d] text-white">
          <DialogHeader>
            <DialogTitle>Switch player to {nameOf(pending)}?</DialogTitle>
            <DialogDescription className="text-white/60">
              Only one device can play per team. Their phone will take over the seat immediately.
            </DialogDescription>
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

/** Help desk: find a team fast, view member roster, and fix its seat in real time. */
export const TeamsPanel = memo(function TeamsPanel({ code, session, rows: all, loading }: { code: string; session: SessionDoc; rows: TeamBoardRow[]; loading: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<TeamSort>("default");
  const [query, setQuery] = useState("");
  const live = session.status === "live";
  const hasStarted = session.status === "live" || session.status === "ended";

  const eligible = useMemo(() => all.filter((r) => r.eligible), [all]);
  const needle = query.trim().toLowerCase();
  const inCount = eligible.filter((r) => r.checkedIn).length;
  const playingCount = eligible.filter((r) => r.checkedIn && r.deviceBound).length;
  const attention = eligible.filter((r) => needsAttention(r, session.status)).length;

  const rows = useMemo(() => {
    const list = eligible
      .filter((r) =>
        filter === "all"
          ? true
          : filter === "in"
          ? r.checkedIn
          : filter === "playing"
          ? r.checkedIn && r.deviceBound
          : filter === "out"
          ? !r.checkedIn
          : needsAttention(r, session.status),
      )
      .filter((r) => !needle || `${r.teamName} ${r.teamCode} ${r.members.map((m) => `${m.name} ${m.email}`).join(" ")}`.toLowerCase().includes(needle));

    const sorted = [...list];
    if (sort === "rank") {
      sorted.sort((a, b) => {
        if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
        if (a.rank !== null) return -1;
        if (b.rank !== null) return 1;
        return a.teamName.localeCompare(b.teamName);
      });
    } else if (sort === "score") {
      sorted.sort((a, b) => b.score - a.score || a.teamName.localeCompare(b.teamName));
    } else if (sort === "name") {
      sorted.sort((a, b) => a.teamName.localeCompare(b.teamName));
    }
    return sorted;
  }, [eligible, filter, needle, sort, session.status]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] shadow-2xl">
      {/* Header with live summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-white/60" />
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-white/80">Teams Roster</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <strong className="font-bold">{inCount}</strong> in quiz
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-sky-300">
            <Smartphone className="size-3" />
            <strong className="font-bold">{playingCount}</strong> playing
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-white/60">
            <strong className="font-bold text-white/90">{eligible.length}</strong> eligible
          </span>
          {attention > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-bold text-amber-300 animate-pulse">
              {attention} needs help
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by team name, code, member name, or email..."
            className="w-full rounded-2xl border border-white/15 bg-[#16161d] py-2.5 pr-4 pl-10 text-xs text-white shadow-inner placeholder:text-white/40 focus:border-white/50 focus:ring-1 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: eligible.length },
              { value: "in", label: "In Quiz", count: inCount },
              { value: "playing", label: "Playing", count: playingCount },
              { value: "out", label: "Not In", count: eligible.length - inCount },
              { value: "attention", label: "Attention", count: attention },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          <span className="font-mono text-[11px] text-white/40">Showing {rows.length} teams</span>
          <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#16161d] px-2 py-1 text-xs text-white/60">
            <ArrowUpDown className="size-3 text-white/40" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as TeamSort)}
              className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer"
            >
              <option value="default" className="bg-[#16161d]">Sort: Status</option>
              <option value="rank" className="bg-[#16161d]">Sort: Rank (1 &rarr; N)</option>
              <option value="score" className="bg-[#16161d]">Sort: Score (High &rarr; Low)</option>
              <option value="name" className="bg-[#16161d]">Sort: Name (A &rarr; Z)</option>
            </select>
          </div>
        </div>
      </div>

      <SyncBar code={code} session={session} />

      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-500">Loading live teams...</div>
      ) : eligible.length === 0 ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-400">No teams synced yet. Click &quot;Sync MongoDB&quot;.</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-400">No teams match your search or filter</div>
      ) : (
        <ul className="max-h-[68vh] divide-y divide-white/5 overflow-y-auto px-2">
          {rows.map((r) => (
            <li key={r.teamId} className="flex flex-col gap-2 rounded-xl p-3 transition-colors hover:bg-white/[0.02]">
              {/* Row Header: Name, Code, Status Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight text-white">{r.teamName}</p>
                  <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-rose-400">
                    {r.teamCode}
                  </span>
                  {hasStarted && r.rank !== null && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                      <Trophy className="size-2.5 text-amber-400" />
                      #{r.rank} &middot; {r.score} pts
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {live && r.checkedIn && (
                    r.answeredCurrent ? (
                      <CheckCircle2 className="size-4 text-emerald-400" aria-label="Answered current question" />
                    ) : (
                      <Circle className="size-4 text-white/20" aria-label="Not answered yet" />
                    )
                  )}

                  {/* Desk check-in badge */}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold",
                      r.deskScanned
                        ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                        : "border border-white/10 bg-white/5 text-white/40"
                    )}
                    title={r.deskScanned ? "Pass scanned at SV Auditorium registration desk" : "Desk pass pending"}
                  >
                    {r.deskScanned ? "Desk: Scanned" : "Desk: Pending"}
                  </span>

                  {/* Quiz check-in badge */}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                      r.checkedIn
                        ? "border border-emerald-500/40 bg-emerald-500/25 text-emerald-200"
                        : "border border-white/10 bg-white/5 text-white/40"
                    )}
                  >
                    {r.checkedIn ? "In Quiz" : "Not In"}
                  </span>
                </div>
              </div>

              {/* Members Roster List */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-mono text-white/40">Members:</span>
                {r.members.length === 0 ? (
                  <span className="text-xs text-white/40 italic">No members listed</span>
                ) : (
                  r.members.map((m) => {
                    const isLead = m.email.toLowerCase() === r.leadEmail.toLowerCase();
                    const isTaker = r.takerEmail && m.email.toLowerCase() === r.takerEmail.toLowerCase();
                    return (
                      <span
                        key={m.email}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors",
                          isTaker
                            ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 font-semibold shadow-sm"
                            : isLead
                            ? "border border-white/20 bg-white/10 text-white/90 font-medium"
                            : "border border-white/5 bg-white/5 text-white/60"
                        )}
                        title={m.email}
                      >
                        <span>{m.name || m.email.split("@")[0]}</span>
                        {isLead && (
                          <span className="rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300">
                            Lead
                          </span>
                        )}
                        {isTaker && (
                          <span className="rounded bg-emerald-400/25 px-1 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-200">
                            Playing
                          </span>
                        )}
                      </span>
                    );
                  })
                )}
              </div>

              {/* Active Player Controls or Check-in Guidance */}
              <PlayerCell code={code} row={r} status={session.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});


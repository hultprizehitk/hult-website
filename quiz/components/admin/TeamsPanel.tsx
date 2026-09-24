"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePolling } from "@/hooks/usePolling";
import { api, type ApiError } from "@/lib/client/api";
import type { AdminSessionView, TeamBoardRow } from "@/lib/quiz/types";
import type { TeamAdminInput } from "@/lib/quiz/validation";
import { ConfirmButton } from "./ConfirmButton";
import { SegmentedControl } from "./SegmentedControl";

type Filter = "all" | "in" | "out";

export function TeamsPanel({ code, view }: { code: string; view: AdminSessionView }) {
  const poll = usePolling<{ serverNow: number; teams: TeamBoardRow[] }>(`/api/admin/sessions/${code}/teams`, 3000);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const live = view.session.status === "live";

  const act = async (body: TeamAdminInput) => {
    try {
      await api(`/api/admin/sessions/${code}/teams`, { body });
      toast.success("Updated");
      await poll.refresh();
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  const all = poll.data?.teams ?? [];
  const needle = query.trim().toLowerCase();
  const rows = all
    .filter((r) => filter === "all" || (filter === "in" ? r.checkedIn : !r.checkedIn))
    .filter((r) => !needle || `${r.teamName} ${r.teamCode} ${r.leadEmail}`.toLowerCase().includes(needle));
  const inCount = all.filter((r) => r.checkedIn).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team, code, lead"
            className="w-full rounded-2xl border border-white/15 bg-[#16161d] py-2.5 pr-4 pl-10 text-xs text-white shadow-inner placeholder:text-white/40 focus:border-white/50 focus:ring-1 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: all.length },
            { value: "in", label: "Checked in", count: inCount },
            { value: "out", label: "Not in", count: all.length - inCount },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0e0e12] shadow-2xl">
        {!poll.data ? (
          <div className="py-20 text-center font-mono text-xs text-neutral-500">Loading teams...</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-neutral-400">No teams match</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3.5 font-medium">Team & Code</th>
                  <th className="px-4 py-3.5 font-medium">Eligible</th>
                  <th className="px-4 py-3.5 font-medium">Check-in</th>
                  <th className="px-4 py-3.5 font-medium">Taker</th>
                  <th className="px-4 py-3.5 font-medium">Device</th>
                  {live && <th className="px-4 py-3.5 font-medium">Answered</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.teamId} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold tracking-tight">{r.teamName}</div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-rose-400">{r.teamCode}</span>
                        <span className="truncate text-[11px] text-white/40">• {r.leadEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.eligible ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-amber-300/90">
                          <span className="size-1.5 rounded-full bg-amber-400" />
                          Not eligible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.checkedIn && r.checkedInAt !== null ? (
                        <span className="font-mono text-[11px] text-emerald-400 tabular-nums">{new Date(r.checkedInAt).toLocaleTimeString()}</span>
                      ) : (
                        <ConfirmButton
                          size="xs"
                          variant="outline"
                          label="Check in"
                          title={`Check in ${r.teamName}?`}
                          description="Manual check-in by an organizer."
                          onConfirm={() => act({ action: "checkin", teamId: r.teamId })}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.checkedIn ? (
                        <Select value={r.takerEmail ?? undefined} onValueChange={(email) => act({ action: "reassign_taker", teamId: r.teamId, email })}>
                          <SelectTrigger size="sm" className="w-52 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {r.members.map((m) => (
                              <SelectItem key={m.email} value={m.email}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-white/30">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.deviceBound ? (
                        <div className="flex items-center gap-2">
                          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white/70">Bound</span>
                          <ConfirmButton
                            size="xs"
                            variant="ghost"
                            label="Reset"
                            title="Reset device?"
                            description="The taker can continue on a new device."
                            onConfirm={() => act({ action: "reset_device", teamId: r.teamId })}
                          />
                        </div>
                      ) : (
                        <span className="text-white/30">N/A</span>
                      )}
                    </td>
                    {live && (
                      <td className="px-4 py-3">
                        {r.answeredCurrent ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Circle className="size-4 text-white/20" />}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

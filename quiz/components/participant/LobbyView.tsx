"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import { api, type ApiError } from "@/lib/client/api";
import type { StateResponse } from "@/lib/quiz/types";

export function LobbyView({ s, code, onChanged }: { s: StateResponse; code: string; onChanged: () => void }) {
  const me = s.me!;
  const team = me.team!;
  const [saving, setSaving] = useState(false);
  const canPick = team.isLead && s.status === "lobby";

  const pick = async (email: string) => {
    setSaving(true);
    try {
      await api(`/api/s/${code}/taker`, { body: { email } });
      toast.success("Taker updated");
      onChanged();
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <TextShimmer className="font-mono text-xs uppercase tracking-[0.3em]" duration={2}>
          Waiting for host
        </TextShimmer>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{s.title}</h1>
        <p className="mt-1 font-mono text-xs text-white/50 tabular-nums">
          <span className="font-sans font-semibold text-emerald-400">{s.counts.checkedIn}</span> of {s.counts.eligible} teams in
        </p>
      </div>

      <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/60">Team</p>
            <p className="truncate text-xl font-bold tracking-tight">{team.name}</p>
          </div>
          <span className="font-mono text-xs font-bold text-rose-400">{team.code}</span>
        </div>
        <div className="my-4 h-px bg-white/10" />
        <ul className="flex flex-col gap-2.5">
          {team.members.map((m) => (
            <li key={m.email} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-white/90">{m.name}</span>
              {m.email === team.takerEmail && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  Answering
                </span>
              )}
            </li>
          ))}
        </ul>
        {canPick && (
          <div className="mt-5 flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/60">Quiz taker</p>
            <Select value={team.takerEmail ?? undefined} onValueChange={pick} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {team.members.map((m) => (
                  <SelectItem key={m.email} value={m.email}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-400">
        {me.role === "taker" ? "You answer for your team" : "Your teammate answers"}
      </p>
    </div>
  );
}

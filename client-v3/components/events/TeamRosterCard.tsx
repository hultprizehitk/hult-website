"use client";

import React from "react";
import { Check, Copy, RefreshCw, Crown } from "lucide-react";

interface TeamRosterCardProps {
  registeredTeam: any;
  onRefreshRoster: () => void;
  refreshing: boolean;
  isTeamCriteriaMet: boolean;
  totalJoined: number;
  minMembers: number;
  targetCount: number;
  openSlotsCount: number;
  currentMembersList: any[];
  copiedCode: boolean;
  onCopyCode: (code: string) => void;
  whatsAppShareUrl: string;
}

export default function TeamRosterCard({
  registeredTeam,
  onRefreshRoster,
  refreshing,
  isTeamCriteriaMet,
  totalJoined,
  minMembers,
  targetCount,
  openSlotsCount,
  currentMembersList,
  copiedCode,
  onCopyCode,
}: TeamRosterCardProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* ── Team Header & Status ─────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/12 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {registeredTeam.teamName}
            </h2>
            {isTeamCriteriaMet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {totalJoined}/{minMembers} Required
              </span>
            )}
          </div>
          {registeredTeam.ventureName && (
            <p className="text-xs text-white/60 mt-0.5">
              Pitch: {registeredTeam.ventureName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRefreshRoster}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-xl"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin text-white" : ""} />
          <span>{refreshing ? "Syncing..." : "Sync"}</span>
        </button>
      </div>

      {/* ── Team Code Bar ─────────────────────────────────────────── */}
      {registeredTeam.teamCode && (
        <div className="flex items-center justify-between bg-white/[0.05] border border-white/15 rounded-2xl p-3 backdrop-blur-xl flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Invite Code:
            </span>
            <span className="font-mono text-base font-bold text-white tracking-widest bg-white/[0.1] px-2.5 py-0.5 rounded-lg border border-white/25">
              {registeredTeam.teamCode}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onCopyCode(registeredTeam.teamCode)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 px-3.5 py-1 text-xs font-bold text-neutral-950 shadow-md shadow-black/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            {copiedCode ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedCode ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}

      {/* ── Members List ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider block">
          Roster ({totalJoined}/{targetCount} Members)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Leader */}
          <div className="rounded-xl bg-white/[0.06] border border-white/15 p-3 flex items-center justify-between gap-2 shadow-lg backdrop-blur-xl">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Crown size={13} className="text-amber-400 shrink-0" />
                <span className="font-bold text-xs text-white truncate">
                  {registeredTeam.leadName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-rose-200 bg-rose-400/15 border border-rose-300/40 px-1.5 py-0.2 rounded">
                  Leader
                </span>
              </div>
              <span className="text-[11px] text-white/50 block truncate font-mono mt-0.5">
                {registeredTeam.leadEmail}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-200 bg-emerald-500/15 border border-emerald-400/40 px-2 py-0.5 rounded-full shrink-0">
              Confirmed
            </span>
          </div>

          {/* Members */}
          {currentMembersList.map((mate: any, idx: number) => (
            <div
              key={idx}
              className="rounded-xl bg-white/[0.06] border border-white/15 p-3 flex items-center justify-between gap-2 shadow-lg backdrop-blur-xl"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white truncate">
                    {mate.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white/70 bg-white/[0.12] border border-white/20 px-1.5 py-0.2 rounded">
                    Member
                  </span>
                </div>
                <span className="text-[11px] text-white/50 block truncate font-mono mt-0.5">
                  {mate.email}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-200 bg-emerald-500/15 border border-emerald-400/40 px-2 py-0.5 rounded-full shrink-0">
                Confirmed
              </span>
            </div>
          ))}

          {/* Open Slots */}
          {Array.from({ length: openSlotsCount }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="rounded-xl border border-dashed border-white/25 bg-white/[0.03] p-3 flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-[11px] text-white/50 font-medium">
                Slot #{totalJoined + idx + 1} Open
              </span>
              <span className="text-[10px] font-mono text-white/60 font-semibold">
                Share code to invite
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
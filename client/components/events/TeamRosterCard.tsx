"use client";

import React from "react";
import { Check, Copy, RefreshCw, Users, Shield, Crown, Building2, Phone } from "lucide-react";

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
      <div className="flex items-center justify-between pb-3 border-b border-pink-200/50 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1a0812] tracking-tight">
              {registeredTeam.teamName}
            </h2>
            {isTeamCriteriaMet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 border border-amber-300/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                {totalJoined}/{minMembers} Required
              </span>
            )}
          </div>
          {registeredTeam.ventureName && (
            <p className="text-xs text-[#7a4658] mt-0.5">
              Pitch: {registeredTeam.ventureName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRefreshRoster}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/80 hover:bg-white border border-pink-200/70 px-3 py-1 text-xs font-semibold text-[#5a3040] hover:text-[#e60067] transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin text-[#e60067]" : ""} />
          <span>{refreshing ? "Syncing..." : "Sync"}</span>
        </button>
      </div>

      {/* ── Team Code Bar ─────────────────────────────────────────── */}
      {registeredTeam.teamCode && (
        <div className="flex items-center justify-between bg-white/75 border border-pink-200/60 rounded-2xl p-3 shadow-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#7a4658] uppercase tracking-wider">
              Invite Code:
            </span>
            <span className="font-mono text-base font-bold text-[#e60067] tracking-widest bg-pink-50/80 px-2.5 py-0.5 rounded-lg border border-pink-200/60">
              {registeredTeam.teamCode}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onCopyCode(registeredTeam.teamCode)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#e60067] hover:bg-[#d4005e] px-3.5 py-1 text-xs font-bold text-white shadow-sm shadow-[#e60067]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            {copiedCode ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedCode ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}

      {/* ── Members List ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#7a4658] uppercase tracking-wider block">
          Roster ({totalJoined}/{targetCount} Members)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Leader */}
          <div className="rounded-xl bg-white/80 border border-white/90 p-3 flex items-center justify-between gap-2 shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Crown size={13} className="text-amber-500 shrink-0" />
                <span className="font-bold text-xs text-[#1a0812] truncate">
                  {registeredTeam.leadName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#e60067] bg-pink-100/60 px-1.5 py-0.2 rounded">
                  Leader
                </span>
              </div>
              <span className="text-[11px] text-[#7a4658] block truncate font-mono mt-0.5">
                {registeredTeam.leadEmail}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
              Confirmed
            </span>
          </div>

          {/* Members */}
          {currentMembersList.map((mate: any, idx: number) => (
            <div
              key={idx}
              className="rounded-xl bg-white/80 border border-white/90 p-3 flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#1a0812] truncate">
                    {mate.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-purple-700 bg-purple-100/60 px-1.5 py-0.2 rounded">
                    Member
                  </span>
                </div>
                <span className="text-[11px] text-[#7a4658] block truncate font-mono mt-0.5">
                  {mate.email}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                Confirmed
              </span>
            </div>
          ))}

          {/* Open Slots */}
          {Array.from({ length: openSlotsCount }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="rounded-xl border border-dashed border-pink-300/60 bg-white/40 p-3 flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-[11px] text-[#7a4658] font-medium">
                Slot #{totalJoined + idx + 1} Open
              </span>
              <span className="text-[10px] font-mono text-[#e60067] font-semibold">
                Share code to invite
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

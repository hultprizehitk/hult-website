"use client";

import React from "react";
import { RefreshSVG, CheckSVG, UsersSVG, PhoneSVG, LeaderCrownSVG, BuildingSVG, UserSVG, SparklesSVG } from "@/components/ui/CustomSvgIcons";

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
  whatsAppShareUrl,
}: TeamRosterCardProps) {
  return (
    <div className="space-y-6">
      {/* Header Status with Dynamic SVG Clan Flag */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#f20089] to-purple-600 border border-white/20 flex items-center justify-center font-mono font-black text-white text-xl shadow-lg shadow-[#f20089]/20 shrink-0">
            {registeredTeam.teamName ? registeredTeam.teamName.charAt(0).toUpperCase() : "T"}
          </div>
          <div>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Confirmed Team Registration Studio
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5 font-[family-name:var(--font-google-sans)]">
              Team {registeredTeam.teamName}
            </h2>
            {registeredTeam.ventureName && (
              <p className="text-xs text-[#f20089] font-medium mt-0.5">
                Venture Pitch: {registeredTeam.ventureName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshRoster}
            disabled={refreshing}
            className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Click to refresh roster if a teammate just joined"
          >
            <RefreshSVG className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-pink-400" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Refresh Roster"}</span>
          </button>
          {isTeamCriteriaMet ? (
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pass Status: Unlocked & Verified</span>
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Incomplete Roster ({totalJoined}/{minMembers} Min Required)</span>
            </span>
          )}
        </div>
      </div>

      {/* ROSTER PROGRESS TRACKER & INVITE CODE BANNER */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-7 space-y-4 font-sans shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
              Roster Progress
            </h3>
          </div>

          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
            isTeamCriteriaMet
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "bg-amber-500/20 border-amber-500/40 text-amber-300"
          }`}>
            {totalJoined} / {targetCount} Confirmed Members ({Math.min(100, Math.round((totalJoined / minMembers) * 100))}% Eligible)
          </span>
        </div>

        {/* Dynamic Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-white/10 rounded-full h-3 p-0.5 overflow-hidden border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-md ${
                isTeamCriteriaMet
                  ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-emerald-500/50"
                  : "bg-gradient-to-r from-amber-500 via-pink-500 to-[#f20089]"
              }`}
              style={{ width: `${Math.min(100, (totalJoined / targetCount) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60 font-mono">
            <span>0 Members</span>
            <span className="text-amber-300 font-bold">Min Requirement: {minMembers} Members</span>
            <span>Max Capacity: {targetCount}</span>
          </div>
        </div>

        {/* Invite Code & Instant Share Strip */}
        {registeredTeam.teamCode && (
          <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#f20089] uppercase tracking-wider">
                Team Invite Code:
              </span>
              <span className="font-mono text-2xl font-black text-white tracking-widest px-3 py-1 rounded-xl bg-white/[0.08] border border-[#f20089]/50 shadow-inner">
                {registeredTeam.teamCode}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onCopyCode(registeredTeam.teamCode)}
                className="rounded-xl bg-white hover:bg-neutral-100 px-3.5 py-1.5 text-xs font-bold text-black shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                {copiedCode ? <CheckSVG className="h-3.5 w-3.5 text-emerald-600" /> : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>}
                <span>{copiedCode ? "Code Copied!" : "Copy Code"}</span>
              </button>

              <a
                href={whatsAppShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#25D366] hover:bg-[#20bd5a] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#25D366]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.237a9.96 9.96 0 004.779 1.221h.004c5.505 0 9.988-4.478 9.989-9.985A9.965 9.965 0 0012.012 2z"/></svg>
                <span>Share via WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* LIVE TEAM ROSTER MEMBER SLOTS */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-7 space-y-4 font-sans shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
          <span className="text-sm font-bold text-white font-[family-name:var(--font-google-sans)] flex items-center gap-2">
            <UsersSVG className="h-4 w-4 text-pink-400" />
            <span>Team Co-Founders ({totalJoined} of {targetCount} Slots Occupied)</span>
          </span>
        </div>

        {/* Member Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Slot 1: Team Leader */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 flex items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LeaderCrownSVG size={16} />
                <span className="font-bold text-white text-sm">
                  {registeredTeam.leadName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f20089] bg-[#f20089]/20 border border-[#f20089]/40 px-2 py-0.2 rounded-full">
                  Leader
                </span>
              </div>
              <span className="text-white/60 font-mono block truncate text-[11px]">
                {registeredTeam.leadEmail}
              </span>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-white/50">
                <span className="flex items-center gap-1">
                  <BuildingSVG className="h-3 w-3 text-sky-400" />
                  <span>{registeredTeam.department}</span>
                </span>
                {registeredTeam.leadPhone && (
                  <span className="flex items-center gap-1">
                    <PhoneSVG className="h-3 w-3 text-emerald-400" />
                    <span>{registeredTeam.leadPhone}</span>
                  </span>
                )}
              </div>
            </div>
            <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Confirmed
            </span>
          </div>

          {/* Slots 2..N: Joined Co-Founders */}
          {currentMembersList.map((mate: any, idx: number) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserSVG className="h-4 w-4 text-sky-400" />
                  <span className="font-bold text-white text-sm">{mate.name}</span>
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.2 rounded-full">
                    Co-Founder #{idx + 2}
                  </span>
                </div>
                <span className="text-white/60 font-mono block truncate text-[11px]">
                  {mate.email}
                </span>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-white/50">
                  <span className="flex items-center gap-1">
                    <BuildingSVG className="h-3 w-3 text-sky-400" />
                    <span>{mate.department || "Heritage IT"}</span>
                  </span>
                  {mate.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneSVG className="h-3 w-3 text-emerald-400" />
                      <span>{mate.phone}</span>
                    </span>
                  )}
                </div>
              </div>
              <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                Confirmed
              </span>
            </div>
          ))}

          {/* Remaining Empty Slots */}
          {Array.from({ length: openSlotsCount }).map((_, idx) => (
            <div
              key={`empty_${idx}`}
              className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] backdrop-blur-xl p-4 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SparklesSVG className="h-3.5 w-3.5 text-white/40" />
                  <span className="font-semibold text-white/70">
                    Slot #{totalJoined + idx + 1} Open
                  </span>
                </div>
                <span className="text-[11px] text-white/40 block">
                  Waiting for teammate to join with code:{" "}
                  <strong className="text-[#f20089] font-mono font-bold">
                    {registeredTeam.teamCode}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onCopyCode(registeredTeam.teamCode)}
                className="rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 px-3 py-1 text-[10px] font-bold text-white/80 transition-all cursor-pointer whitespace-nowrap"
              >
                Copy Code
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

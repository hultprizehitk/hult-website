"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  User,
  CheckCircle2,
  Maximize2,
  X,
  MapPin,
  Calendar,
  Lock,
  Sparkles,
} from "lucide-react";

interface TeamMemberInfo {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
  checkedIn?: boolean;
}

interface AuditoriumPassProps {
  team: {
    _id: string;
    teamCode: string;
    teamName: string;
    lead: {
      name: string;
      email: string;
      phone?: string;
      department?: string;
      roll?: string;
      checkedIn?: boolean;
    };
    leadEmail: string;
    members?: TeamMemberInfo[];
    checkedIn?: boolean;
    submissionStatus?: string;
  };
  currentUserEmail?: string;
  eventName?: string;
  venue?: string;
  date?: string;
}

export default function AuditoriumPassQR({
  team,
  currentUserEmail = "",
  eventName = "HULT ASCEND : The Rise Begins",
  venue = "SV Auditorium",
  date = "Wed, Sep 30 · 2:00 PM Sharp",
}: AuditoriumPassProps) {
  const { data: session } = useSession();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Strictly resolve the currently logged-in user's identity
  const effectiveEmail = (
    session?.user?.email ||
    currentUserEmail ||
    ""
  )
    .toLowerCase()
    .trim();

  // Check if the logged-in user is the Team Leader
  const isLeader = Boolean(
    effectiveEmail &&
      (team.leadEmail.toLowerCase() === effectiveEmail ||
        team.lead?.email?.toLowerCase() === effectiveEmail)
  );

  // Check if the logged-in user is one of the members
  const matchedMember =
    !isLeader && effectiveEmail
      ? team.members?.find((m) => m.email?.toLowerCase() === effectiveEmail)
      : null;

  // Strictly resolve details for the logged-in participant
  const participantName = isLeader
    ? team.lead.name
    : matchedMember
    ? matchedMember.name
    : session?.user?.name || team.lead.name;

  const participantEmail = isLeader
    ? team.leadEmail.toLowerCase()
    : matchedMember
    ? matchedMember.email.toLowerCase()
    : effectiveEmail || team.leadEmail.toLowerCase();

  const participantRole = isLeader ? "Team Leader" : "Team Member";

  const participantRoll = isLeader
    ? team.lead.roll || ""
    : matchedMember?.roll || (session?.user as { roll?: string })?.roll || "";

  const participantDept = isLeader
    ? team.lead.department || ""
    : matchedMember?.department ||
      (session?.user as { department?: string })?.department ||
      "";

  const isCheckedIn = isLeader
    ? Boolean(team.lead.checkedIn || team.checkedIn)
    : Boolean(matchedMember?.checkedIn || team.checkedIn);

  // The exact JSON payload the scanner parses
  const qrPayload = JSON.stringify({
    teamCode: team.teamCode.toUpperCase(),
    participantEmail: participantEmail,
    roll: participantRoll || "",
  });

  return (
    <div className="relative rounded-2xl border border-white/15 bg-gradient-to-br from-[#161224]/95 via-[#0e0a19]/95 to-[#08060f]/98 backdrop-blur-2xl p-4.5 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] space-y-4 select-none overflow-hidden">
      {/* Subtle iridescent top border glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089]/60 to-transparent" />

      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#f20089]/15 border border-[#f20089]/35 flex items-center justify-center text-[#f20089] shadow-[0_0_12px_rgba(242,0,137,0.25)]">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                Auditorium Entry Pass
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider bg-[#f20089]/20 text-rose-300 border border-[#f20089]/30">
                Official
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-sans">
              Scan at the entrance desk for real-time check-in
            </p>
          </div>
        </div>

        {/* Live Check-In Status Indicator */}
        {isCheckedIn ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-500/[0.12] border border-emerald-500/35 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
            <span>Checked In at Venue</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-500/[0.1] border border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span>Ready for Desk Scan</span>
          </span>
        )}
      </div>

      {/* Main Pass Body: Side-by-Side (QR + Credentials) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4.5 items-center">
        {/* Left: Compact, High-Contrast QR Code */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div
            className="relative p-2.5 bg-white rounded-xl shadow-xl border border-white/80 group cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setFullscreenOpen(true)}
            title="Click to view fullscreen QR pass"
          >
            <QRCodeSVG
              value={qrPayload}
              size={136}
              level="H"
              includeMargin={false}
              className="w-full h-auto max-w-[136px]"
            />
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 backdrop-blur-[1px] rounded-lg flex items-center justify-center transition-opacity text-white text-[11px] font-semibold gap-1">
              <Maximize2 size={13} />
              <span>Enlarge</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            className="text-[9.5px] font-mono text-white/50 hover:text-white/80 pt-1.5 tracking-wider inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Maximize2 size={10} />
            <span>TAP TO ENLARGE</span>
          </button>
        </div>

        {/* Right: Clean, Personal Participant Credentials */}
        <div className="sm:col-span-7 flex flex-col justify-between gap-2.5 text-left min-w-0">
          {/* Participant Name & Role */}
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {participantName}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/10 text-white/90 shrink-0">
                {isLeader ? (
                  <ShieldCheck size={10} className="text-[#f20089]" />
                ) : (
                  <User size={10} className="text-white/60" />
                )}
                <span>{participantRole}</span>
              </span>
            </div>
            <p className="text-xs text-white/70 font-mono truncate">
              {participantEmail}
            </p>
            {participantRoll && (
              <p className="text-[11px] text-white/50 font-mono">
                Roll: <span className="text-white/80 font-semibold">{participantRoll}</span>
                {participantDept ? ` · ${participantDept}` : ""}
              </p>
            )}
          </div>

          {/* Team & Venue Snapshot Cards */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-2 min-w-0">
              <span className="text-[8.5px] uppercase font-mono text-white/40 block leading-tight">
                Team
              </span>
              <span className="text-[11.5px] font-bold text-white truncate block pt-0.5">
                {team.teamName}
              </span>
              <span className="text-[10px] font-mono font-extrabold text-[#f20089] block tracking-wider">
                {team.teamCode}
              </span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-2 min-w-0">
              <span className="text-[8.5px] uppercase font-mono text-white/40 block leading-tight">
                Venue
              </span>
              <div className="flex items-center gap-1 text-[11.5px] font-bold text-white truncate pt-0.5">
                <MapPin size={11} className="text-rose-400 shrink-0" />
                <span className="truncate">{venue}</span>
              </div>
              <span className="text-[9.5px] font-mono text-white/50 block truncate pt-0.5">
                {(date || "Sep 30, 2026, 2:00 PM")
                  .replace(/12:00\s*PM/gi, "2:00 PM")
                  .split("·")[0]
                  .trim()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Popup Modal for Ultra-Fast Scanning at Desk */}
      {fullscreenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn"
          onClick={() => setFullscreenOpen(false)}
        >
          <div
            className="relative max-w-sm w-full bg-[#120f1f] border border-white/20 rounded-3xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Close pass"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 pt-1">
              <span className="text-[9.5px] font-mono font-bold tracking-widest uppercase text-[#f20089]">
                {eventName}
              </span>
              <h4 className="font-serif text-xl font-bold text-white">
                {participantName}
              </h4>
              <p className="text-xs font-mono text-white/60">
                Team {team.teamName} · <span className="text-[#f20089] font-bold">{team.teamCode}</span>
              </p>
            </div>

            {/* High-Resolution QR */}
            <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-white">
              <QRCodeSVG
                value={qrPayload}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono text-white/80">
                Present this screen at the SV Auditorium desk scanner
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-white/5 border border-white/15 text-white/70">
                <Lock size={10} className="text-emerald-400" />
                <span>Personal Entry Credential</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

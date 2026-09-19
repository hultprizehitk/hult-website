"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Check } from "lucide-react";
import type { PublicEvent } from "@/app/events/page";

interface EventAuditoriumPassProps {
  event: PublicEvent;
  registeredTeam: any;
  isTeamCriteriaMet: boolean;
  minMembers: number;
  totalJoined: number;
}

export default function EventAuditoriumPass({
  event,
  registeredTeam,
  isTeamCriteriaMet,
  minMembers,
  totalJoined,
}: EventAuditoriumPassProps) {
  if (!isTeamCriteriaMet) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 flex items-center justify-between font-sans">
        <span className="font-medium">Pass Locked • Needs {minMembers - totalJoined} more member(s)</span>
        <span className="font-mono font-bold text-[11px] bg-amber-500/20 px-2.5 py-0.5 rounded-full">
          {totalJoined}/{minMembers}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-white/[0.04] to-black p-6 sm:p-8 backdrop-blur-3xl shadow-[0_15px_45px_rgba(16,185,129,0.25)] space-y-6">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Auditorium Pass • Unlocked</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
            {event.title} Official Pass
          </h3>

          <p className="text-xs text-white/70 font-sans">
            Scannable digital pass for main stage entry.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <span className="text-[10px] text-white/50 block uppercase">Team Name</span>
              <span className="font-bold text-white block">{registeredTeam.teamName}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <span className="text-[10px] text-white/50 block uppercase">Team Leader</span>
              <span className="font-bold text-emerald-300 block truncate">{registeredTeam.leadName}</span>
            </div>
          </div>
        </div>

        {/* Scannable Dynamic QR Code */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white backdrop-blur-2xl border border-white/30 shadow-2xl shrink-0 self-center md:self-auto">
          <QRCodeSVG
            value={`https://hultprizehitk.live/events/checkin?eventId=${event._id}&teamCode=${registeredTeam.teamCode}`}
            size={135}
            bgColor={"#FFFFFF"}
            fgColor={"#09090b"}
            level={"M"}
          />
          <span className="text-[10px] font-bold text-black/80 font-mono mt-2 uppercase tracking-wider flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-600" />
            <span>Official Check-In QR</span>
          </span>
        </div>
      </div>
    </div>
  );
}

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
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between font-sans">
        <span className="font-medium">
          Pass Locked: Needs {minMembers - totalJoined} more member(s) to validate
        </span>
        <span className="font-mono font-bold text-[10px] bg-amber-100 px-2 py-0.5 rounded-full">
          {totalJoined}/{minMembers}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-300/70 bg-white/85 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-md">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-3 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
            <ShieldCheck size={12} />
            <span>Auditorium Pass • Verified</span>
          </div>

          <h3 className="text-xl font-bold text-[#1a0812]">
            {event.title} Stage Pass
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-pink-50/50 border border-pink-200/50 p-2">
              <span className="text-[10px] text-[#7a4658] block uppercase font-medium">Team</span>
              <span className="font-bold text-[#1a0812] block truncate">{registeredTeam.teamName}</span>
            </div>
            <div className="rounded-lg bg-pink-50/50 border border-pink-200/50 p-2">
              <span className="text-[10px] text-[#7a4658] block uppercase font-medium">Leader</span>
              <span className="font-bold text-[#1a0812] block truncate">{registeredTeam.leadName}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-pink-200/60 shadow-sm shrink-0">
          <QRCodeSVG
            value={`https://hultprizehitk.live/events/checkin?eventId=${event._id}&teamCode=${registeredTeam.teamCode}`}
            size={110}
            bgColor={"#FFFFFF"}
            fgColor={"#1a0812"}
            level={"M"}
          />
          <span className="text-[9px] font-bold text-[#7a4658] font-mono mt-1.5 uppercase tracking-wider flex items-center gap-1">
            <Check size={10} className="text-emerald-600" />
            <span>Check-In Pass</span>
          </span>
        </div>
      </div>
    </div>
  );
}

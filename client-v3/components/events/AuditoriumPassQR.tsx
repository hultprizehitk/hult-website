"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { Maximize2, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";

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
    <div className="select-none rounded-2xl border border-white/10 bg-gradient-to-b from-brand/[0.08] to-white/[0.02]">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-pink-300">
            <QrCode size={18} />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-white">Entry pass</h4>
            <p className="mt-0.5 text-xs text-white/45">Show this QR at the venue desk.</p>
          </div>
        </div>
        {isCheckedIn ? (
          <StatusBadge tone="success">Checked in</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Not checked in</StatusBadge>
        )}
      </div>

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setFullscreenOpen(true)}
          className="group relative shrink-0 cursor-pointer self-center rounded-xl bg-white p-2.5"
          aria-label="Enlarge QR pass"
        >
          <QRCodeSVG value={qrPayload} size={128} level="H" includeMargin={false} />
          <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-xl bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 size={13} />
            Enlarge
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{participantName}</p>
            <p className="truncate text-xs text-white/50">
              {[participantRole, participantRoll, participantDept].filter(Boolean).join(" · ")}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0">
              <dt className="text-xs text-white/45">Team</dt>
              <dd className="mt-0.5 truncate text-white">{team.teamName}</dd>
              <dd className="truncate font-mono text-xs text-pink-300">{team.teamCode}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-white/45">Venue</dt>
              <dd className="mt-0.5 truncate text-white">{venue}</dd>
              <dd className="truncate text-xs text-white/50">
                {(date || "Sep 30, 2026, 2:00 PM")
                  .replace(/12:00\s*PM/gi, "2:00 PM")
                  .split("·")[0]
                  .trim()}
              </dd>
            </div>
          </dl>
          <Button variant="outline" size="sm" onClick={() => setFullscreenOpen(true)}>
            <Maximize2 />
            Enlarge QR
          </Button>
        </div>
      </div>

      {/* Fullscreen QR for fast scanning at the desk */}
      {fullscreenOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-fadeIn"
          onClick={() => setFullscreenOpen(false)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/10 bg-[#121118] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3"
              onClick={() => setFullscreenOpen(false)}
              aria-label="Close pass"
            >
              <X />
            </Button>

            <div className="space-y-1 pt-2">
              <p className="text-xs text-white/50">{eventName}</p>
              <h4 className="text-lg font-semibold text-white">{participantName}</h4>
              <p className="text-sm text-white/60">
                {team.teamName} · <span className="font-mono">{team.teamCode}</span>
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={qrPayload} size={220} level="H" includeMargin={false} />
            </div>

            <p className="text-xs text-white/50">Show this screen at the {venue} desk.</p>
          </div>
        </div>
      )}
    </div>
  );
}

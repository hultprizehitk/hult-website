"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import type { PublicEvent } from "../page";

interface EventInsideViewProps {
  event: PublicEvent;
  sessionUser: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  registeredTeam: any | null;
  onBack: () => void;
  onRegisterSuccess: (teamData: any) => void;
}

export default function EventInsideView({
  event,
  sessionUser,
  registeredTeam,
  onBack,
  onRegisterSuccess,
}: EventInsideViewProps) {
  const minMembers = event.minTeamMembers || 3;
  const maxMembers = event.maxTeamMembers || 5;

  // Mode: "create" (start new team and get team code) | "join" (enter team code)
  const [registrationMode, setRegistrationMode] = useState<"create" | "join">("create");

  // Create Team state
  const [teamName, setTeamName] = useState("");
  const [ventureName, setVentureName] = useState("");
  const [targetMembersCount, setTargetMembersCount] = useState<number>(minMembers);
  const [leadPhone, setLeadPhone] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");

  // Join Team state
  const [joinCode, setJoinCode] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberDepartment, setMemberDepartment] = useState("Computer Science & Engineering");

  // General state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Handle Create Team submit
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sessionUser?.email) {
      setErrorMessage("Please sign in first to register.");
      return;
    }

    if (!teamName.trim()) {
      setErrorMessage("Please enter your team name.");
      return;
    }

    if (!leadPhone.trim()) {
      setErrorMessage("Please enter your WhatsApp / contact phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          eventId: event._id,
          teamName: teamName.trim(),
          ventureName: ventureName.trim(),
          leadName: sessionUser.name || "Student Leader",
          leadPhone: leadPhone.trim(),
          department: department.trim(),
          membersCount: targetMembersCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create team. Please try again.");
      }

      onRegisterSuccess(data.team);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Team submit
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sessionUser?.email) {
      setErrorMessage("Please sign in first to join a team.");
      return;
    }

    if (!joinCode.trim()) {
      setErrorMessage("Please enter the 6-character Team Invite Code.");
      return;
    }

    if (!memberPhone.trim()) {
      setErrorMessage("Please enter your WhatsApp / contact phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          eventId: event._id,
          teamCode: joinCode.trim().toUpperCase(),
          phone: memberPhone.trim(),
          department: memberDepartment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join team. Please verify the code.");
      }

      onRegisterSuccess(data.team);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to join team.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh roster to see if teammates joined
  const handleRefreshRoster = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/events/register?eventId=${event._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.team) {
          onRegisterSuccess(data.team);
        }
      }
    } catch (err) {
      console.error("Failed to refresh roster:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Copy code to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // WhatsApp share link generator
  const getWhatsAppShareUrl = (team: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://hultprizehitk.com";
    const inviteUrl = `${origin}/events?event=${event._id}`;
    const text = `Hey! Join my Hult Prize team *${team.teamName}* for the event *${event.title}* at Heritage Institute.\n\nOpen this link: ${inviteUrl}\nSelect "Join Existing Team" and enter Team Code: *${team.teamCode}*`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Compute roster counts
  const currentMembersList = registeredTeam ? registeredTeam.members || [] : [];
  const totalJoined = registeredTeam ? 1 + currentMembersList.length : 0;
  const targetCount = registeredTeam ? registeredTeam.membersCount || minMembers : minMembers;
  const openSlotsCount = Math.max(0, targetCount - totalJoined);

  return (
    <div className="w-full text-left space-y-8 animate-fadeIn font-[family-name:var(--font-google-sans)]">
      {/* Top Back Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
        >
          <span>← Back to All Events</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-white/50 font-sans">
          <Link href="/events" onClick={onBack} className="hover:text-white transition-colors">
            Events
          </Link>
          <span>/</span>
          <span className="text-[#f20089] font-medium truncate max-w-[200px] sm:max-w-none">
            {event.title}
          </span>
        </div>
      </div>

      {/* Hero Event Card (Hult Theme Glassmorphism) */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6">
        {/* Top Iridescent Accent Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089] to-transparent" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#f20089]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-900/20 blur-3xl" />

        <div className="relative z-10 space-y-4">
          {/* Badges Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#f20089]">
              {event.tag}
            </span>

            {event.registrationStatus === "closed" ? (
              <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-[11px] font-bold text-red-300 uppercase tracking-wider">
                Registrations Closed
              </span>
            ) : event.registrationStatus === "extended" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-1 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                Extended Deadline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Registrations Open
              </span>
            )}

            <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-[11px] font-bold text-purple-200">
              👥 Team Size: {minMembers} to {maxMembers} Members
            </span>
          </div>

          {/* Event Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 font-sans text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
                Schedule & Time
              </span>
              <span className="font-semibold text-white block text-xs sm:text-sm">
                📅 {event.date}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
                Venue Location
              </span>
              <span className="font-semibold text-white block text-xs sm:text-sm">
                📍 {event.venue}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
                Team Size Limits
              </span>
              <span className="font-bold text-[#f20089] block text-xs sm:text-sm">
                👥 {minMembers} to {maxMembers} Students / Team
              </span>
            </div>
          </div>

          {/* Event Description */}
          <div className="pt-2">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-white/50 mb-2">
              About This Event
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {event.link && event.link.startsWith("http") && (
            <div className="pt-2">
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[#f20089] hover:underline font-bold"
              >
                <span>🔗 External RSVP & Event Page ↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IN-PAGE TEAM REGISTRATION & PASS STUDIO (ZERO POPUP MODALS)               */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Iridescent Accent Line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089] to-transparent" />

        {/* STATE A: STUDENT IS REGISTERED IN A TEAM (VIEW TEAM STUDIO & INVITE PASS) */}
        {registeredTeam ? (
          <div className="space-y-6 animate-scaleUp">
            {/* Header Status */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
              <div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  ✓ Confirmed Team Registration Pass
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
                  Team {registeredTeam.teamName}
                </h2>
                {registeredTeam.ventureName && (
                  <p className="text-xs text-[#f20089] font-medium mt-0.5">
                    💡 Venture Pitch: {registeredTeam.ventureName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshRoster}
                  disabled={refreshing}
                  className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  title="Click to refresh roster if a teammate just joined"
                >
                  <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                  <span>{refreshing ? "Syncing..." : "Refresh Roster"}</span>
                </button>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  Status: {registeredTeam.status || "Confirmed"}
                </span>
              </div>
            </div>

            {/* TEAM INVITE CODE BANNER (The Core Requested Feature) */}
            {registeredTeam.teamCode && (
              <div className="relative overflow-hidden rounded-3xl border border-[#f20089]/50 bg-gradient-to-br from-[#f20089]/15 via-white/[0.04] to-purple-950/30 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_10px_35px_rgba(242,0,137,0.2)]">
                <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#f20089]/25 blur-2xl" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#f20089] uppercase tracking-widest block font-mono">
                      🔑 Official Team Invite Code
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-widest px-4 py-1.5 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-[#f20089]/60 shadow-[inset_0_2px_10px_rgba(242,0,137,0.25)]">
                        {registeredTeam.teamCode}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 max-w-lg pt-1 font-sans">
                      Share this invite code with your teammates. They can navigate to this event and select{" "}
                      <strong className="text-white font-semibold">Join Existing Team</strong> to enter this code and join your roster.
                    </p>
                  </div>

                  {/* Quick Share Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(registeredTeam.teamCode)}
                      className="rounded-2xl bg-white hover:bg-neutral-100 px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <span>{copiedCode ? "✓" : "📋"}</span>
                      <span>{copiedCode ? "Copied to Clipboard!" : "Copy Team Code"}</span>
                    </button>

                    <a
                      href={getWhatsAppShareUrl(registeredTeam)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#25D366]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <span>📲</span>
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE TEAM ROSTER SLOTS */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-7 space-y-5 font-sans shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
                <div>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest block font-mono">
                    Team Roster Progress
                  </span>
                  <span className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                    👥 {totalJoined} of {targetCount} Members Confirmed
                  </span>
                </div>

                <div className="text-right">
                  {totalJoined < minMembers ? (
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full block">
                      ⚠️ Needs {minMembers - totalJoined} more member(s) for min eligibility
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full block">
                      ✓ Official Team Size Requirement Met
                    </span>
                  )}
                </div>
              </div>

              {/* Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Slot 1: Team Leader */}
                <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👑</span>
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
                      <span>🏛️ {registeredTeam.department}</span>
                      {registeredTeam.leadPhone && <span>📞 {registeredTeam.leadPhone}</span>}
                    </div>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Joined
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
                        <span className="text-base">👤</span>
                        <span className="font-bold text-white text-sm">{mate.name}</span>
                        <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.2 rounded-full">
                          Co-Founder #{idx + 2}
                        </span>
                      </div>
                      <span className="text-white/60 font-mono block truncate text-[11px]">
                        {mate.email}
                      </span>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-white/50">
                        <span>🏛️ {mate.department || "Heritage IT"}</span>
                        {mate.phone && <span>📞 {mate.phone}</span>}
                      </div>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Joined
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
                        <span className="text-neutral-500">⏳</span>
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
                      onClick={() => handleCopyCode(registeredTeam.teamCode)}
                      className="rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 px-3 py-1 text-[10px] font-bold text-white/80 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Copy Code
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={onBack}
                className="rounded-2xl bg-white/[0.08] hover:bg-white/15 px-6 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                ← Back to All Events
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `HULT PRIZE REGISTRATION PASS\nEvent: ${event.title}\nTeam: ${registeredTeam.teamName}\nTeam Code: ${registeredTeam.teamCode || "N/A"}\nLeader: ${registeredTeam.leadName} (${registeredTeam.leadEmail})\nMembers Count: ${totalJoined} / ${targetCount}\nVenue: ${event.venue}\nDate: ${event.date}`;
                    navigator.clipboard.writeText(text);
                    alert("Registration Pass details copied to clipboard!");
                  }}
                  className="rounded-2xl bg-white/[0.06] hover:bg-white/15 border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>📋 Copy Pass Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-2xl bg-[#f20089]/20 hover:bg-[#f20089]/30 border border-[#f20089]/40 px-5 py-2.5 text-xs font-bold text-[#f20089] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️ Print Pass</span>
                </button>
              </div>
            </div>
          </div>
        ) : event.registrationStatus === "closed" ? (
          /* STATE B: REGISTRATION CLOSED */
          <div className="py-8 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-xl">
              🔒
            </div>
            <h2 className="text-xl font-bold text-white">Registrations Closed</h2>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              Registrations for this event are currently closed by the organizers. Please follow our announcements for future editions.
            </p>
          </div>
        ) : !sessionUser ? (
          /* STATE C: UNAUTHENTICATED IN-PAGE PROMPT */
          <div className="py-8 text-center space-y-4 animate-fadeIn">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f20089]/20 border border-[#f20089]/40 text-2xl shadow-lg shadow-[#f20089]/20">
              🎓
            </div>

            <div>
              <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-bold text-[#f20089] uppercase tracking-wider">
                Student Verification Required
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Sign In to Register for {event.title}
              </h2>
              <p className="text-xs text-white/70 mt-2 max-w-md mx-auto leading-relaxed font-sans">
                Participation in Hult Prize OnCampus events is exclusively open to verified Heritage Institute of Technology students. Please sign in with your college Google account (<span className="text-[#f20089] font-mono">@heritageit.edu.in</span>) to proceed.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  signIn("google", {
                    callbackUrl: `/events?event=${event._id}`,
                  })
                }
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-neutral-100 px-7 py-3 text-xs sm:text-sm font-bold text-black shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In with College Email (@heritageit.edu.in)</span>
              </button>
            </div>
          </div>
        ) : (
          /* STATE D: TWO REGISTRATION OPTIONS (CREATE TEAM OR JOIN TEAM) */
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-bold text-[#f20089] uppercase tracking-wider">
                Official Event Registration
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Team Registration Studio
              </h2>
              <p className="text-xs text-white/60 mt-1 font-sans">
                Choose an option below to either create a new venture team or join your co-founders using a Team Code.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200 flex items-center gap-3">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TWO INTERACTIVE OPTION CARDS (Join Team vs Create Team) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Create Team */}
              <button
                type="button"
                onClick={() => {
                  setRegistrationMode("create");
                  setErrorMessage(null);
                }}
                className={`p-6 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  registrationMode === "create"
                    ? "border-[#f20089] bg-gradient-to-br from-[#f20089]/15 via-white/[0.04] to-black shadow-[0_10px_30px_rgba(242,0,137,0.25)] scale-[1.01]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-3xl">👑</span>
                  {registrationMode === "create" ? (
                    <span className="text-[10px] uppercase font-bold text-[#f20089] bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 rounded-full">
                      Selected
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold text-white/40">
                      Option 1
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-1 font-[family-name:var(--font-google-sans)]">
                  Create a New Team
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  Become the Team Leader, set your venture idea, and generate a unique{" "}
                  <strong className="text-pink-300 font-semibold">Team Invite Code</strong> to invite your co-founders.
                </p>
              </button>

              {/* Option 2: Join Team */}
              <button
                type="button"
                onClick={() => {
                  setRegistrationMode("join");
                  setErrorMessage(null);
                }}
                className={`p-6 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  registrationMode === "join"
                    ? "border-[#f20089] bg-gradient-to-br from-[#f20089]/15 via-white/[0.04] to-black shadow-[0_10px_30px_rgba(242,0,137,0.25)] scale-[1.01]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-3xl">🤝</span>
                  {registrationMode === "join" ? (
                    <span className="text-[10px] uppercase font-bold text-[#f20089] bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 rounded-full">
                      Selected
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold text-white/40">
                      Option 2
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-1 font-[family-name:var(--font-google-sans)]">
                  Join with Team Code
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  Have a 6-character Team Code from your Team Leader? Enter it here to join your co-founders instantly.
                </p>
              </button>
            </div>

            {/* =================================================================== */}
            {/* SUB-FORM 1: CREATE TEAM FORM                                        */}
            {/* =================================================================== */}
            {registrationMode === "create" && (
              <form onSubmit={handleCreateTeam} className="space-y-6 pt-2 animate-fadeIn">
                {/* Team Leader Identity */}
                <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 sm:p-6 space-y-4 backdrop-blur-xl shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <span>👑</span>
                      <span>Team Leader (You)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ✓ Verified College Identity
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div>
                      <label className="block text-white/60 mb-1">Lead Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={sessionUser.name || "Student Leader"}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white/70 outline-none cursor-not-allowed backdrop-blur-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Lead College Email</label>
                      <input
                        type="email"
                        disabled
                        value={sessionUser.email || ""}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white/70 outline-none cursor-not-allowed backdrop-blur-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans pt-1">
                    <div>
                      <label className="block text-white/60 mb-1">WhatsApp / Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Lead Department / Branch</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs"
                      >
                        <option className="bg-neutral-900 text-white" value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Information Technology">Information Technology</option>
                        <option className="bg-neutral-900 text-white" value="Electronics & Communication">Electronics & Communication</option>
                        <option className="bg-neutral-900 text-white" value="Electrical Engineering">Electrical Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Mechanical Engineering">Mechanical Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Chemical Engineering">Chemical Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Biotechnology">Biotechnology</option>
                        <option className="bg-neutral-900 text-white" value="Civil Engineering">Civil Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Applied Electronics & Instrumentation">Applied Electronics</option>
                        <option className="bg-neutral-900 text-white" value="MCA / Management">MCA / Management</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team & Venture Pitch Info */}
                <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 sm:p-6 space-y-4 backdrop-blur-xl shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Team & Venture Pitch Details</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <label className="block text-white/70 font-semibold mb-1">Team Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EcoSphere Pioneers"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 font-semibold mb-1">
                        Venture / Pitch Idea Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Solar Bio-Pesticide Generator"
                        value={ventureName}
                        onChange={(e) => setVentureName(e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Target Team Size Selector */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-white/80 mb-2">
                      Total Expected Team Size ({minMembers} to {maxMembers} Members)
                    </label>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {Array.from(
                        { length: maxMembers - minMembers + 1 },
                        (_, i) => minMembers + i
                      ).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setTargetMembersCount(count)}
                          className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer border ${
                            targetMembersCount === count
                              ? "bg-[#f20089] text-white border-[#f20089] shadow-lg shadow-[#f20089]/30"
                              : "bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {count} Members
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-white/40 mt-1.5 block">
                      Official Hult constraint: Min {minMembers}, Max {maxMembers} students.
                    </span>
                  </div>
                </div>

                {/* Info Notice about Code Generation */}
                <div className="rounded-2xl border border-[#f20089]/30 bg-[#f20089]/10 p-4 text-xs text-neutral-200 flex items-start gap-3">
                  <span className="text-xl">✨</span>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">
                      Automatic Team Invite Code Generation
                    </span>
                    <span className="text-white/70 leading-relaxed block font-sans">
                      When you submit, your team will be created and a unique 6-character Team Code (e.g. <span className="font-mono text-[#f20089] font-bold">HULT-7X9K</span>) will be generated. You can share this code with your co-founders so they can join your team directly.
                    </span>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="rounded-2xl bg-white/[0.08] hover:bg-white/15 px-6 py-3 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-50 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                  >
                    {loading ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Generating Team Code...</span>
                      </>
                    ) : (
                      <span>Create Team & Generate Invite Code →</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* =================================================================== */}
            {/* SUB-FORM 2: JOIN TEAM FORM (ENTER CODE)                             */}
            {/* =================================================================== */}
            {registrationMode === "join" && (
              <form onSubmit={handleJoinTeam} className="space-y-6 pt-2 animate-fadeIn">
                {/* Team Code Entry Box */}
                <div className="rounded-3xl border border-[#f20089]/40 bg-white/[0.04] p-6 sm:p-7 space-y-3 backdrop-blur-xl shadow-[0_10px_35px_rgba(242,0,137,0.15)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white">
                    🔑 Enter Team Invite Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="e.g. HULT-7X9K"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] px-4 py-3.5 text-xl sm:text-2xl text-white outline-none focus:border-[#f20089] focus:ring-2 focus:ring-[#f20089]/40 font-mono tracking-widest uppercase font-bold backdrop-blur-xl shadow-inner transition-all"
                  />
                  <p className="text-[11px] text-white/50 font-sans">
                    Enter the exact 6-character code given by your Team Leader. Letters are case-insensitive.
                  </p>
                </div>

                {/* Member Identity Details */}
                <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 sm:p-6 space-y-4 backdrop-blur-xl shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Your Information (Teammate)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ✓ Verified College Identity
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div>
                      <label className="block text-white/60 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={sessionUser.name || "Student Co-Founder"}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white/70 outline-none cursor-not-allowed backdrop-blur-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Your College Email</label>
                      <input
                        type="email"
                        disabled
                        value={sessionUser.email || ""}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-white/70 outline-none cursor-not-allowed backdrop-blur-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans pt-1">
                    <div>
                      <label className="block text-white/60 mb-1">WhatsApp / Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={memberPhone}
                        onChange={(e) => setMemberPhone(e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Your Department / Branch</label>
                      <select
                        value={memberDepartment}
                        onChange={(e) => setMemberDepartment(e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs"
                      >
                        <option className="bg-neutral-900 text-white" value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Information Technology">Information Technology</option>
                        <option className="bg-neutral-900 text-white" value="Electronics & Communication">Electronics & Communication</option>
                        <option className="bg-neutral-900 text-white" value="Electrical Engineering">Electrical Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Mechanical Engineering">Mechanical Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Chemical Engineering">Chemical Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Biotechnology">Biotechnology</option>
                        <option className="bg-neutral-900 text-white" value="Civil Engineering">Civil Engineering</option>
                        <option className="bg-neutral-900 text-white" value="Applied Electronics & Instrumentation">Applied Electronics</option>
                        <option className="bg-neutral-900 text-white" value="MCA / Management">MCA / Management</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="rounded-2xl bg-white/[0.08] hover:bg-white/15 px-6 py-3 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-50 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                  >
                    {loading ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Verifying Team Code...</span>
                      </>
                    ) : (
                      <span>Verify Code & Join Team →</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

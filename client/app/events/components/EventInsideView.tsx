"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { ExternalLink, Sparkles, RotateCcw, Check, Clipboard, Share2, ShieldCheck, QrCode, AlertTriangle, Crown, User, Building2, Phone, Clock, Users } from "lucide-react";
import { parseHeritageEmail } from "@/lib/heritage-parser";
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
  const [leadPhone, setLeadPhone] = useState("");
  const [leadRoll, setLeadRoll] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");

  // Join Team state
  const [joinCode, setJoinCode] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRoll, setMemberRoll] = useState("");
  const [memberDepartment, setMemberDepartment] = useState("Computer Science & Engineering");

  // RSVP State
  const [rsvpInfo, setRsvpInfo] = useState<{
    rsvpd: boolean;
    status?: string;
    myCheckIn?: boolean;
    checkedInCount?: number;
    totalRoster?: number;
  } | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // General state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Conversational step wizard state (Points 1 & 2)
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [joinStep, setJoinStep] = useState<1 | 2>(1);

  // Fetch RSVP status if user has a registered team
  const fetchRsvpStatus = async () => {
    if (!registeredTeam || !event._id) return;
    try {
      const res = await fetch(`/api/events/rsvp?eventId=${event._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rsvpd) {
          const checkedInCount = data.rsvp?.checkedInMembers?.length || 0;
          const totalRoster = 1 + (registeredTeam?.members?.length || 0);
          setRsvpInfo({
            rsvpd: true,
            status: data.status,
            myCheckIn: data.myCheckIn,
            checkedInCount,
            totalRoster,
          });
        } else {
          setRsvpInfo({ rsvpd: false });
        }
      }
    } catch (err) {
      console.error("Failed to fetch RSVP status:", err);
    }
  };

  useEffect(() => {
    fetchRsvpStatus();
  }, [registeredTeam, event._id]);

  // Auto-fill student profile from Heritage institutional identity (Point 3)
  useEffect(() => {
    if (sessionUser?.email) {
      const parsed = parseHeritageEmail(sessionUser.email);
      if (parsed.branchName) {
        setDepartment(parsed.branchName);
        setMemberDepartment(parsed.branchName);
      }
    }
  }, [sessionUser?.email]);

  // Read URL params for auto-fill join code (e.g. ?code=HULT-7X9K)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("code");
      if (codeParam) {
        setJoinCode(codeParam.toUpperCase().trim());
        setRegistrationMode("join");
      }
    }
  }, []);

  // Handle RSVP action
  const handleRsvp = async () => {
    if (!sessionUser?.email || !event._id) return;
    setRsvpLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event._id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to RSVP.");
      }

      await fetchRsvpStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to RSVP.");
    } finally {
      setRsvpLoading(false);
    }
  };

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
          leadRoll: leadRoll.trim(),
          department: department.trim(),
          membersCount: maxMembers,
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
          roll: memberRoll.trim(),
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
    const inviteUrl = `https://hultprizehitk.live/events?event=${event._id}&code=${team.teamCode}`;
    const text = `Hey! Join my Hult Prize team *${team.teamName}* for the event *${event.title}* at Heritage Institute.\n\nOpen this link: ${inviteUrl}\nOr select "Join Existing Team" and enter Team Code: *${team.teamCode}*`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Compute roster counts
  const currentMembersList = registeredTeam ? registeredTeam.members || [] : [];
  const totalJoined = registeredTeam ? 1 + currentMembersList.length : 0;
  const targetCount = registeredTeam ? registeredTeam.membersCount || maxMembers : maxMembers;
  const openSlotsCount = Math.max(0, targetCount - totalJoined);
  const isTeamCriteriaMet = totalJoined >= minMembers;

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
              Team Size: {minMembers} to {maxMembers} Members
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
                {event.date}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
                Venue Location
              </span>
              <span className="font-semibold text-white block text-xs sm:text-sm">
                {event.venue}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
                Team Size Limits
              </span>
              <span className="font-bold text-[#f20089] block text-xs sm:text-sm">
                {minMembers} to {maxMembers} Students / Team
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
                <ExternalLink className="h-3.5 w-3.5 text-[#f20089]" />
                <span>External RSVP & Event Page</span>
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshRoster}
                  disabled={refreshing}
                  className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  title="Click to refresh roster if a teammate just joined"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-pink-400" : ""}`} />
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

            {/* ========================================================================= */}
            {/* POINT 5: REAL-TIME ROSTER PROGRESS TRACKER & INVITE CODE BANNER            */}
            {/* ========================================================================= */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-7 space-y-4 font-sans shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest block font-mono font-bold">
                    Point 5 • Real-Time Roster Progress
                  </span>
                  <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                    Team Member Eligibility Tracker
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
                      onClick={() => handleCopyCode(registeredTeam.teamCode)}
                      className="rounded-xl bg-white hover:bg-neutral-100 px-3.5 py-1.5 text-xs font-bold text-black shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? "Code Copied!" : "Copy Code"}</span>
                    </button>

                    <a
                      href={getWhatsAppShareUrl(registeredTeam)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-[#25D366] hover:bg-[#20bd5a] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#25D366]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share via WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* POINT 6: DYNAMIC DIGITAL AUDITORIUM PASS & VERIFICATION QR CODE            */}
            {/* ========================================================================= */}
            {isTeamCriteriaMet ? (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-white/[0.04] to-black p-6 sm:p-8 backdrop-blur-3xl shadow-[0_15px_45px_rgba(16,185,129,0.25)] space-y-6">
                <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3 max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Verified Auditorium Pass • Unlocked</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                      {event.title} Official Pass
                    </h3>

                    <p className="text-xs sm:text-sm text-white/80 font-sans leading-relaxed">
                      Your team roster meets the official Hult Prize eligibility standard. Present this scannable digital QR pass at the Auditorium entrance on event day.
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
                      <QrCode className="h-3 w-3 text-emerald-600" />
                      <span>Official Check-In QR</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* INCOMPLETE ROSTER CRITERIA WARNING */
              <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent backdrop-blur-2xl p-5 sm:p-6 text-xs text-amber-200 flex items-start gap-3.5 shadow-[0_10px_30px_rgba(245,158,11,0.15)]">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-amber-300 text-sm font-[family-name:var(--font-google-sans)]">
                      Pass Locked: Needs {minMembers - totalJoined} More Member(s)
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-300 font-mono">
                      Roster Pending ({totalJoined}/{minMembers})
                    </span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed font-sans text-xs">
                    Official Hult Prize rules stipulate a minimum of <strong>{minMembers} members</strong> per team to unlock your Auditorium Pass. Share your Team Invite Code (<strong className="font-mono text-white">{registeredTeam.teamCode}</strong>) with co-founders to unlock your pass!
                  </p>
                </div>
              </div>
            )}

            {/* LIVE TEAM ROSTER MEMBER SLOTS */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-7 space-y-4 font-sans shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                <span className="text-sm font-bold text-white font-[family-name:var(--font-google-sans)] flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-400" />
                  <span>Team Co-Founders ({totalJoined} of {targetCount} Slots Occupied)</span>
                </span>
              </div>

              {/* Member Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Slot 1: Team Leader */}
                <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
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
                        <Building2 className="h-3 w-3 text-sky-400" />
                        <span>{registeredTeam.department}</span>
                      </span>
                      {registeredTeam.leadPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-400" />
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
                        <User className="h-4 w-4 text-sky-400" />
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
                          <Building2 className="h-3 w-3 text-sky-400" />
                          <span>{mate.department || "Heritage IT"}</span>
                        </span>
                        {mate.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-400" />
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
                        <Clock className="h-3.5 w-3.5 text-white/40" />
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
                    if (!isTeamCriteriaMet) {
                      alert(`⚠️ Team Roster Incomplete (${totalJoined}/${minMembers} Members)\n\nOfficial Hult Prize rules require at least ${minMembers} members per team to validate your pass. Please share your Team Code (${registeredTeam.teamCode}) with teammates so they can join!`);
                      return;
                    }
                    const text = `HULT PRIZE REGISTRATION PASS\nEvent: ${event.title}\nTeam: ${registeredTeam.teamName}\nTeam Code: ${registeredTeam.teamCode || "N/A"}\nLeader: ${registeredTeam.leadName} (${registeredTeam.leadEmail})\nMembers Count: ${totalJoined} / ${targetCount}\nStatus: Confirmed\nVenue: ${event.venue}\nDate: ${event.date}`;
                    navigator.clipboard.writeText(text);
                    alert("Registration Pass details copied to clipboard!");
                  }}
                  className={`rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isTeamCriteriaMet
                      ? "bg-white/[0.06] hover:bg-white/15 border-white/10 text-white/80 hover:text-white"
                      : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white/60"
                  }`}
                >
                  <span>Copy Pass Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isTeamCriteriaMet) {
                      alert(`Team Criteria Not Met\n\nYou have ${totalJoined} member(s). Official passes can only be printed once at least ${minMembers} members have joined your team roster.`);
                      return;
                    }
                    window.print();
                  }}
                  className={`rounded-2xl border px-5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isTeamCriteriaMet
                      ? "bg-[#f20089]/20 hover:bg-[#f20089]/30 border-[#f20089]/40 text-[#f20089] hover:text-white"
                      : "bg-white/[0.03] border-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <span>{isTeamCriteriaMet ? "Print Pass" : `Pass Locked (Needs ${minMembers - totalJoined} More)`}</span>
                </button>
              </div>
            </div>
          </div>
        ) : event.registrationStatus === "closed" ? (
          /* STATE B: REGISTRATION CLOSED */
          <div className="py-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center rounded-full bg-white/[0.06] px-4 py-1 text-xs text-white/70 font-mono">
              Restricted Access
            </div>
            <h2 className="text-xl font-bold text-white">Registrations Closed</h2>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              Registrations for this event are currently closed by the organizers. Please follow our announcements for future editions.
            </p>
          </div>
        ) : !sessionUser ? (
          /* STATE C: UNAUTHENTICATED IN-PAGE PROMPT */
          <div className="py-8 text-center space-y-4 animate-fadeIn">
            <div className="inline-flex items-center justify-center rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-4 py-1 text-xs font-bold text-pink-300 font-mono">
              Student Clearance
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
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-pink-400 bg-pink-500/10 border border-pink-500/30 px-2.5 py-0.5 rounded-full">Lead</span>
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
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full">Member</span>
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
            {/* SUB-FORM 1: CONVERSATIONAL STEP-BY-STEP CREATE TEAM WIZARD          */}
            {/* =================================================================== */}
            {registrationMode === "create" && (
              <form onSubmit={handleCreateTeam} className="space-y-6 pt-2 animate-fadeIn font-sans">
                {/* Minimalist Step Tracker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#f20089] font-bold tracking-widest uppercase">
                      STEP {createStep.toString().padStart(2, "0")} / 02 — {createStep === 1 ? "VENTURE DETAILS" : "LEADER CONTACT"}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">{createStep === 1 ? "50%" : "100%"}</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f20089] transition-all duration-300"
                      style={{ width: createStep === 1 ? "50%" : "100%" }}
                    />
                  </div>
                </div>

                {/* STEP 1: STARTUP CONCEPT & TEAM NAME */}
                {createStep === 1 && (
                  <div className="rounded-3xl border border-white/15 bg-[#09090b] p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#f20089] uppercase tracking-widest block">
                        Phase 01
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                        What is your startup venture & team name?
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        Provide a team title and your pitch idea concept for the competition roster.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          Team Name <span className="text-[#f20089]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. EcoSphere Pioneers"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (teamName.trim()) setCreateStep(2);
                            }
                          }}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          Venture / Pitch Idea Title <span className="text-zinc-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Solar Bio-Pesticide Generator"
                          value={ventureName}
                          onChange={(e) => setVentureName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (teamName.trim()) setCreateStep(2);
                            }
                          }}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs font-medium"
                        />
                      </div>
                    </div>

                    {/* Minimalist Team Size Criteria */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">
                            Required Team Roster Capacity
                          </span>
                          <span className="text-[11px] text-zinc-400 block">
                            Minimum {minMembers} to maximum {maxMembers} members per registered team.
                          </span>
                        </div>
                        <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-mono text-zinc-200 font-bold uppercase tracking-wider">
                          {minMembers}–{maxMembers} Members
                        </span>
                      </div>
                    </div>

                    {/* Step 1 Navigation */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onBack}
                        className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!teamName.trim()}
                        onClick={() => {
                          if (!teamName.trim()) {
                            setErrorMessage("Please enter your team name to proceed.");
                            return;
                          }
                          setErrorMessage(null);
                          setCreateStep(2);
                        }}
                        className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-40 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/20 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-95"
                      >
                        <span>Continue to Leader Contact →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: LEADER CONTACT & VERIFICATION */}
                {createStep === 2 && (
                  <div className="rounded-3xl border border-white/15 bg-[#09090b] p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#f20089] uppercase tracking-widest block">
                        Phase 02
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                        Team Leader Contact & Credentials
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        Provide a WhatsApp contact number for pitch schedule notifications and event day communication.
                      </p>
                    </div>

                    {/* Verified Identity Badge (Minimalist Dark Glass) */}
                    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="space-y-0.5 text-xs">
                        <span className="font-semibold text-white block">
                          Team Leader: {sessionUser.name || "Student Leader"}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 block">
                          {sessionUser.email}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-zinc-200 border border-white/15 px-3 py-1 rounded-full">
                        Verified Institutional Identity
                      </span>
                    </div>

                    {/* Auto-fill Identity Micro-Banner */}
                    <div className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3 flex items-center justify-between gap-2 text-xs backdrop-blur-md">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-pink-400 shrink-0" />
                        <span className="text-pink-200 text-[11px] font-mono">
                          Auto-filled from verified email: <strong className="text-white font-semibold">{parseHeritageEmail(sessionUser?.email || "").fullName}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-pink-300 font-mono bg-pink-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Heritage Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          WhatsApp / Contact Phone <span className="text-[#f20089]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 9876543210"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          College Roll Number <span className="text-zinc-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12621001099"
                          value={leadRoll}
                          onChange={(e) => setLeadRoll(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          Department / Branch
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs"
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

                    {/* Step 2 Actions */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setCreateStep(1)}
                        disabled={loading}
                        className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
                      >
                        ← Back to Step 01
                      </button>

                      <button
                        type="submit"
                        disabled={loading || !leadPhone.trim()}
                        className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-40 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/20 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-95"
                      >
                        {loading ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            <span>Generating Team Code...</span>
                          </>
                        ) : (
                          <span>Create Team & Generate Invite Code →</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* =================================================================== */}
            {/* SUB-FORM 2: CONVERSATIONAL STEP-BY-STEP JOIN TEAM WIZARD            */}
            {/* =================================================================== */}
            {registrationMode === "join" && (
              <form onSubmit={handleJoinTeam} className="space-y-6 pt-2 animate-fadeIn font-sans">
                {/* Minimalist Step Tracker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#f20089] font-bold tracking-widest uppercase">
                      STEP {joinStep.toString().padStart(2, "0")} / 02 — {joinStep === 1 ? "TEAM CODE" : "MEMBER CONTACT"}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">{joinStep === 1 ? "50%" : "100%"}</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f20089] transition-all duration-300"
                      style={{ width: joinStep === 1 ? "50%" : "100%" }}
                    />
                  </div>
                </div>

                {/* STEP 1: ENTER TEAM CODE */}
                {joinStep === 1 && (
                  <div className="rounded-3xl border border-white/15 bg-[#09090b] p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#f20089] uppercase tracking-widest block">
                        Phase 01
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                        Enter your 6-character Team Invite Code
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        Enter the team invite code provided by your Team Leader (e.g. <span className="font-mono text-[#f20089] font-bold">HULT-7X9K</span>).
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        placeholder="e.g. HULT-7X9K"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (joinCode.trim()) setJoinStep(2);
                          }
                        }}
                        className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-5 py-4 text-2xl sm:text-3xl text-white outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] font-mono tracking-widest uppercase font-bold shadow-2xl transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onBack}
                        className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={!joinCode.trim()}
                        onClick={() => {
                          if (!joinCode.trim()) {
                            setErrorMessage("Please enter a valid Team Invite Code.");
                            return;
                          }
                          setErrorMessage(null);
                          setJoinStep(2);
                        }}
                        className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-40 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/20 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-95"
                      >
                        <span>Next: Enter Contact Info →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: MEMBER CONTACT INFO */}
                {joinStep === 2 && (
                  <div className="rounded-3xl border border-white/15 bg-[#09090b] p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#f20089] uppercase tracking-widest block">
                        Phase 02
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                        Teammate Contact Details & Department
                      </h3>
                    </div>

                    {/* Verified Identity Badge */}
                    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="space-y-0.5 text-xs">
                        <span className="font-semibold text-white block">
                          Joining Member: {sessionUser.name || "Student Co-Founder"}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 block">
                          {sessionUser.email}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-zinc-200 border border-white/15 px-3 py-1 rounded-full">
                        Verified Institutional Identity
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          WhatsApp / Contact Phone <span className="text-[#f20089]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 9876543210"
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          College Roll Number <span className="text-zinc-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12621001099"
                          value={memberRoll}
                          onChange={(e) => setMemberRoll(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-200 font-semibold text-xs mb-1.5">
                          Department / Branch
                        </label>
                        <select
                          value={memberDepartment}
                          onChange={(e) => setMemberDepartment(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-[#121216] focus:bg-[#16161c] px-4 py-3 text-white outline-none focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089] transition-all text-xs"
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

                    {/* Step 2 Actions */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setJoinStep(1)}
                        disabled={loading}
                        className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
                      >
                        ← Back to Step 01
                      </button>

                      <button
                        type="submit"
                        disabled={loading || !memberPhone.trim()}
                        className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-40 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/20 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-95"
                      >
                        {loading ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            <span>Verifying Team Code...</span>
                          </>
                        ) : (
                          <span>Verify Code & Join Team →</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

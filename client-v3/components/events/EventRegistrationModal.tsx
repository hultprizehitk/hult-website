"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  X,
  Users,
  PlusCircle,
  KeyRound,
  Copy,
  Check,
  Share2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Lock,
  Sparkles,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicEvent } from "@/types";

interface EventRegistrationModalProps {
  event: PublicEvent;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationComplete?: () => void;
}

interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
  joinedAt?: string;
}

interface ExistingTeam {
  _id: string;
  teamCode: string;
  teamName: string;
  ventureName?: string;
  lead: {
    name: string;
    email: string;
    phone?: string;
    department?: string;
    roll?: string;
  };
  leadEmail: string;
  members: TeamMember[];
  status: string;
  checkedIn?: boolean;
}

type RegistrationMode = "select" | "create" | "join";

export default function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  onRegistrationComplete,
}: EventRegistrationModalProps) {
  const { data: session, status: authStatus } = useSession();

  // Mode: "select" (two cards), "create" (form), "join" (form)
  const [mode, setMode] = useState<RegistrationMode>("select");

  // Registration loading / existing state
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingTeam, setExistingTeam] = useState<ExistingTeam | null>(null);
  const [userRole, setUserRole] = useState<"lead" | "member" | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    teamName: "",
    ventureName: "",
    phone: "",
    roll: "",
  });

  // Join Form State
  const [joinForm, setJoinForm] = useState({
    teamCode: "",
    phone: "",
    roll: "",
  });

  // Action status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const minMembers = event.minTeamMembers || 3;
  const maxMembers = event.maxTeamMembers || 5;

  // Check if current user is already in a team for this event
  const checkUserTeam = useCallback(async () => {
    if (!session?.user?.email) {
      setCheckingExisting(false);
      return;
    }

    try {
      setCheckingExisting(true);
      const res = await fetch(`/api/teams?eventId=${event._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasTeam && data.team) {
          setExistingTeam(data.team);
          setUserRole(data.role);
        } else {
          setExistingTeam(null);
          setUserRole(null);
        }
      }
    } catch (err) {
      console.error("Failed to check existing team:", err);
    } finally {
      setCheckingExisting(false);
    }
  }, [event._id, session?.user?.email]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setMode("select");
      checkUserTeam();
    }
  }, [isOpen, checkUserTeam]);

  if (!isOpen) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCopyCode = (code: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareWhatsApp = (code: string, teamName: string) => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(
        `Join my team "${teamName}" for ${event.title} at Hult Prize HITK! Use Team Code: ${code}\nRegister here: ${window.location.origin}/events?event=${event._id}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!createForm.teamName.trim()) {
      setErrorMessage("Team name is required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event._id,
          teamName: createForm.teamName.trim(),
          ventureName: createForm.ventureName.trim(),
          phone: createForm.phone.trim(),
          roll: createForm.roll.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to create team.");
        return;
      }

      setExistingTeam(data.team);
      setUserRole("lead");
      if (onRegistrationComplete) onRegistrationComplete();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!joinForm.teamCode.trim()) {
      setErrorMessage("Please enter a valid Team Code.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: joinForm.teamCode.trim().toUpperCase(),
          phone: joinForm.phone.trim(),
          roll: joinForm.roll.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to join team.");
        return;
      }

      setExistingTeam(data.team);
      setUserRole("member");
      if (onRegistrationComplete) onRegistrationComplete();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render States ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl text-white font-sans my-8">
        {/* Top Iridescent Edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 h-8 w-8 rounded-full bg-[#16161d] hover:bg-[#202028] text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Event Header Strip */}
        <div className="border-b border-white/10 pb-4 mb-6 pr-8">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="rounded-full bg-[#16161d] border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
              {event.tag || "Flagship"}
            </span>
            <span className="text-[11px] text-white/50 font-mono">
              Team: {minMembers}–{maxMembers} Members
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)] leading-snug">
            {event.title}
          </h2>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/40 bg-[#240c10] p-3.5 text-xs text-red-200 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ── STATE 1: LOADING ────────────────────────────────────────────── */}
        {checkingExisting ? (
          <div className="py-16 text-center text-xs text-white/50 font-mono flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            <span>Verifying student registration status...</span>
          </div>
        ) : authStatus !== "authenticated" ? (
          /* ── STATE 2: UNAUTHENTICATED ─────────────────────────────────────── */
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16161d] border border-white/15 text-white">
              <Lock className="h-6 w-6 text-white/80" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Student Authentication Required
              </h3>
              <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                Registration is restricted to verified students. Sign in with your official
                college email account to continue.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#16161d] p-3 text-[11px] font-mono text-white/70">
              Only <strong className="text-white">@heritageit.edu.in</strong> accounts are authorized.
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => signIn("google", { callbackUrl: window.location.href })}
              className="w-full font-bold font-[family-name:var(--font-google-sans)] py-6 rounded-2xl shadow-xl"
            >
              Sign In with Google (HITK Account) →
            </Button>
          </div>
        ) : existingTeam ? (
          /* ── STATE 3: ALREADY REGISTERED (TEAM CONFIRMATION CARD) ──────────── */
          <div className="space-y-5 animate-fadeIn">
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0a1f18] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">
                    You are Registered for this Event!
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Status: Confirmed Participation
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono">
                {userRole === "lead" ? "Team Leader" : "Team Member"}
              </span>
            </div>

            {/* Team Identity Card */}
            <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                  Team Name
                </span>
                <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                  {existingTeam.teamName}
                </h3>
                {existingTeam.ventureName && (
                  <p className="text-xs text-white/70 mt-0.5">
                    Venture Idea: {existingTeam.ventureName}
                  </p>
                )}
              </div>

              {/* Unique Team Code Highlight Box */}
              <div className="rounded-xl border border-white/20 bg-[#121217] p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">
                    Team Invite Code
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-emerald-400">
                    {existingTeam.teamCode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(existingTeam.teamCode)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e1e28] hover:bg-[#282836] border border-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-white/70" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(existingTeam.teamCode, existingTeam.teamName)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Roster Progress */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60 font-semibold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-white/60" />
                    <span>Team Roster</span>
                  </span>
                  <span className="font-mono text-[11px] text-white/70">
                    {1 + (existingTeam.members?.length || 0)} / {maxMembers} Members
                  </span>
                </div>

                {/* Team Leader Row */}
                <div className="rounded-xl bg-[#121217] border border-white/10 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{existingTeam.lead.name}</span>
                    <span className="text-[10px] text-white/50 font-mono">{existingTeam.lead.email}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/80">
                    Leader
                  </span>
                </div>

                {/* Team Members List */}
                {existingTeam.members && existingTeam.members.length > 0 && (
                  <div className="space-y-1.5">
                    {existingTeam.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-[#121217] border border-white/10 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-white block">{m.name}</span>
                          <span className="text-[10px] text-white/50 font-mono">{m.email}</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">
                          Member
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty slots indicator */}
                {1 + (existingTeam.members?.length || 0) < maxMembers && (
                  <p className="text-[11px] text-white/50 pt-1 leading-normal">
                    Share your team code (<span className="text-emerald-300 font-mono font-bold">{existingTeam.teamCode}</span>)
                    with up to {maxMembers - (1 + (existingTeam.members?.length || 0))} more classmates to join.
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="w-full font-semibold"
            >
              Close Window
            </Button>
          </div>
        ) : mode === "select" ? (
          /* ── STATE 4: THE DUAL CHOICE (CREATE TEAM vs JOIN TEAM) ─────────── */
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center space-y-1 mb-2">
              <span className="text-xs text-white/60">Choose how you want to participate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Create Team */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode("create");
                }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/15 bg-[#16161d] hover:bg-[#1e1e28] hover:border-white/35 p-5 text-left transition-all duration-200 cursor-pointer shadow-xl hover:scale-[1.02]"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 group-hover:bg-white group-hover:text-black transition-colors">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                    Create Team
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Start a new team as Team Leader. A unique Team Code will be generated for your
                    teammates to join.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-white">
                  <span>Start New Team</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option B: Join Team */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode("join");
                }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/15 bg-[#16161d] hover:bg-[#1e1e28] hover:border-white/35 p-5 text-left transition-all duration-200 cursor-pointer shadow-xl hover:scale-[1.02]"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 group-hover:bg-white group-hover:text-black transition-colors">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                    Join Team
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Have a Team Code from your leader? Enter the code to join their roster as a team member.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-white">
                  <span>Enter Code</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        ) : mode === "create" ? (
          /* ── STATE 5: CREATE TEAM FORM ───────────────────────────────────── */
          <form onSubmit={handleCreateSubmit} className="space-y-4 animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode("select");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to choices</span>
              </button>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                You will be Team Leader
              </span>
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EcoInnovators"
                value={createForm.teamName}
                onChange={(e) => setCreateForm({ ...createForm, teamName: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">
                Venture Track / Idea (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Renewable Microgrid Solution"
                value={createForm.ventureName}
                onChange={(e) => setCreateForm({ ...createForm, ventureName: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 font-semibold mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">
                  College Roll No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2152001"
                  value={createForm.roll}
                  onChange={(e) => setCreateForm({ ...createForm, roll: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
                />
              </div>
            </div>

            {/* Student Verified Identity Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#16161d] p-3 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">
                Leader Credentials
              </span>
              <div className="text-white font-medium">{session?.user?.name}</div>
              <div className="text-[10px] text-white/50 font-mono">{session?.user?.email}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setMode("select")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="default"
                disabled={submitting}
                className="font-[family-name:var(--font-google-sans)]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Generating Code...</span>
                  </>
                ) : (
                  <span>Create Team &amp; Get Code →</span>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* ── STATE 6: JOIN TEAM FORM ─────────────────────────────────────── */
          <form onSubmit={handleJoinSubmit} className="space-y-4 animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode("select");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to choices</span>
              </button>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Join by Invite Code
              </span>
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">
                Enter Team Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HULT-7X9B"
                value={joinForm.teamCode}
                onChange={(e) => setJoinForm({ ...joinForm, teamCode: e.target.value.toUpperCase() })}
                className="w-full rounded-2xl border border-white/20 bg-[#16161d] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner font-mono text-base font-black tracking-widest uppercase transition-all"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                Ask your team leader for the 8-character invite code
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 font-semibold mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={joinForm.phone}
                  onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">
                  College Roll No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2152002"
                  value={joinForm.roll}
                  onChange={(e) => setJoinForm({ ...joinForm, roll: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
                />
              </div>
            </div>

            {/* Student Verified Identity Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#16161d] p-3 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">
                Joining Member Credentials
              </span>
              <div className="text-white font-medium">{session?.user?.name}</div>
              <div className="text-[10px] text-white/50 font-mono">{session?.user?.email}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setMode("select")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="default"
                disabled={submitting}
                className="font-[family-name:var(--font-google-sans)]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Joining Team...</span>
                  </>
                ) : (
                  <span>Join Team Roster →</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

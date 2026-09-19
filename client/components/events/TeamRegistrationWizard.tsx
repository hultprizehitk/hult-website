"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { AlertTriangleSVG } from "@/components/ui/CustomSvgIcons";
import type { PublicEvent } from "@/app/events/page";

interface TeamRegistrationWizardProps {
  event: PublicEvent;
  sessionUser: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  registrationMode: "create" | "join";
  setRegistrationMode: (mode: "create" | "join") => void;
  teamName: string;
  setTeamName: (val: string) => void;
  ventureName: string;
  setVentureName: (val: string) => void;
  leadPhone: string;
  setLeadPhone: (val: string) => void;
  leadRoll: string;
  setLeadRoll: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  joinCode: string;
  setJoinCode: (val: string) => void;
  memberPhone: string;
  setMemberPhone: (val: string) => void;
  memberRoll: string;
  setMemberRoll: (val: string) => void;
  memberDepartment: string;
  setMemberDepartment: (val: string) => void;
  loading: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  createStep: 1 | 2;
  setCreateStep: (step: 1 | 2) => void;
  joinStep: 1 | 2;
  setJoinStep: (step: 1 | 2) => void;
  handleCreateTeam: (e: React.FormEvent) => void;
  handleJoinTeam: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function TeamRegistrationWizard({
  event,
  sessionUser,
  registrationMode,
  setRegistrationMode,
  teamName,
  setTeamName,
  ventureName,
  setVentureName,
  leadPhone,
  setLeadPhone,
  leadRoll,
  setLeadRoll,
  department,
  setDepartment,
  joinCode,
  setJoinCode,
  memberPhone,
  setMemberPhone,
  memberRoll,
  setMemberRoll,
  memberDepartment,
  setMemberDepartment,
  loading,
  errorMessage,
  setErrorMessage,
  createStep,
  setCreateStep,
  joinStep,
  setJoinStep,
  handleCreateTeam,
  handleJoinTeam,
  onBack,
}: TeamRegistrationWizardProps) {
  if (event.registrationStatus === "closed") {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="inline-flex items-center justify-center rounded-full bg-white/[0.06] px-4 py-1 text-xs text-white/70 font-mono">
          Restricted Access
        </div>
        <h2 className="text-xl font-bold text-white">Registrations Closed</h2>
        <p className="text-xs text-white/60 max-w-md mx-auto">
          Registrations for this event are currently closed by the organizers. Please follow our announcements for future editions.
        </p>
      </div>
    );
  }

  if (!sessionUser) {
    return (
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
          <p className="text-xs text-white/70 mt-2 max-w-md mx-auto font-sans">
            Sign in with your @heritageit.edu.in email to register.
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
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-bold text-[#f20089] uppercase tracking-wider">
          Official Event Registration
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
          Team Registration Studio
        </h2>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200 flex items-center gap-3">
          <AlertTriangleSVG className="h-4 w-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TWO INTERACTIVE OPTION CARDS */}
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
          <p className="text-xs text-white/60 font-sans">
            Register a new startup team and generate an invite code.
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
          <p className="text-xs text-white/60 font-sans">
            Enter a 6-character team code to join.
          </p>
        </button>
      </div>

      {/* SUB-FORM 1: STEP-BY-STEP CREATE TEAM WIZARD */}
      {registrationMode === "create" && (
        <form onSubmit={handleCreateTeam} className="space-y-6 pt-2 animate-fadeIn font-sans">
          {/* Step Tracker */}
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

          {/* STEP 1: TEAM NAME */}
          {createStep === 1 && (
            <div className="rounded-3xl border border-white/15 bg-[#09090b] p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                  Team & Venture Details
                </h3>
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

          {/* STEP 2: LEADER CONTACT */}
          {createStep === 2 && (
            <div className="rounded-3xl border border-white/15 bg-[#09090b] p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                  Leader Contact Info
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">
                    Leader: {sessionUser.name || "Student Leader"}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    {sessionUser.email}
                  </span>
                </div>
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
                    placeholder="e.g. 2151042"
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

      {/* SUB-FORM 2: STEP-BY-STEP JOIN TEAM WIZARD */}
      {registrationMode === "join" && (
        <form onSubmit={handleJoinTeam} className="space-y-6 pt-2 animate-fadeIn font-sans">
          {/* Step Tracker */}
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
                <h3 className="text-xl font-bold text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                  Member Contact Info
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">
                    Member: {sessionUser.name || "Student"}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    {sessionUser.email}
                  </span>
                </div>
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
                    placeholder="e.g. 2151042"
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
  );
}

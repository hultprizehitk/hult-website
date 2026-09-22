"use client";

import React from "react";
import { signIn } from "@/lib/auth-client";
import { AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
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
  // Closed status
  if (event.registrationStatus === "closed") {
    return (
      <div className="py-6 text-center space-y-2 font-sans">
        <span className="inline-flex items-center rounded-full bg-rose-500/15 border border-rose-400/30 px-3 py-0.5 text-[10px] font-bold text-rose-200 uppercase tracking-wide">
          Closed
        </span>
        <h3 className="text-lg font-bold text-white">Registrations Closed</h3>
        <p className="text-xs text-white/60">
          Registrations for this event are currently closed by the organizers.
        </p>
      </div>
    );
  }

  // Not signed in
  if (!sessionUser) {
    return (
      <div className="py-6 text-center space-y-3 font-sans">
        <span className="inline-flex items-center rounded-full bg-white/10 border border-white/25 px-3 py-0.5 text-[10px] font-bold text-white/85 uppercase tracking-wide">
          Authentication Required
        </span>

        <h3 className="text-xl font-bold text-white">
          Sign In to Register for {event.title}
        </h3>
        <p className="text-xs text-white/60 max-w-sm mx-auto">
          Sign in with your verified college email (@heritageit.edu.in) to continue.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: `/events?event=${event._id}`,
              })
            }
            className="inline-flex items-center gap-2.5 rounded-full bg-white hover:bg-neutral-100 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign In with College Email</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          Team Registration
        </h3>
        <p className="text-xs text-white/60">
          Create a new team as leader or enter an invite code to join an existing team.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setRegistrationMode("create");
            setErrorMessage(null);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xl ${
            registrationMode === "create"
              ? "border-white/60 bg-white/15 ring-1 ring-white/30"
              : "border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Leader
            </span>
            {registrationMode === "create" && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white">
            Create a New Team
          </h4>
          <p className="text-[11px] text-white/55 mt-0.5">
            Register and get an invite code.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setRegistrationMode("join");
            setErrorMessage(null);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xl ${
            registrationMode === "join"
              ? "border-white/60 bg-white/15 ring-1 ring-white/30"
              : "border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              Member
            </span>
            {registrationMode === "join" && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white">
            Join with Code
          </h4>
          <p className="text-[11px] text-white/55 mt-0.5">
            Enter your team invite code.
          </p>
        </button>
      </div>

      {/* ── CREATE TEAM FORM ──────────────────────────────────────── */}
      {registrationMode === "create" && (
        <form onSubmit={handleCreateTeam} className="space-y-4 pt-1">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Step {createStep} of 2: {createStep === 1 ? "Team Name" : "Leader Contact"}</span>
            <span className="text-white font-mono">{createStep === 1 ? "50%" : "100%"}</span>
          </div>

          {createStep === 1 && (
            <div className="space-y-3 bg-white/[0.05] border border-white/15 rounded-2xl p-4 shadow-lg backdrop-blur-xl">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Team Name <span className="text-rose-300">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EcoSphere Pioneers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/[0.07] focus:bg-white/[0.12] px-3.5 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Venture / Pitch Idea Title <span className="text-white/45 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solar Bio-Pesticide Generator"
                  value={ventureName}
                  onChange={(e) => setVentureName(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/[0.07] focus:bg-white/[0.12] px-3.5 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={!teamName.trim()}
                  onClick={() => {
                    if (!teamName.trim()) {
                      setErrorMessage("Please enter your team name.");
                      return;
                    }
                    setErrorMessage(null);
                    setCreateStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-40 px-5 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-black/40 transition-all cursor-pointer"
                >
                  <span>Next: Leader Info</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-3 bg-white/[0.05] border border-white/15 rounded-2xl p-4 shadow-lg backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Phone <span className="text-rose-300">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white focus:ring-1 focus:ring-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="2151042"
                    value={leadRoll}
                    onChange={(e) => setLeadRoll(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white focus:ring-1 focus:ring-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2 text-xs text-white outline-none focus:border-white focus:ring-1 focus:ring-white/30 [&>option]:bg-black [&>option]:text-white"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Electrical Engineering">EE</option>
                    <option value="Mechanical Engineering">ME</option>
                    <option value="Chemical Engineering">ChE</option>
                    <option value="Biotechnology">BT</option>
                    <option value="Civil Engineering">CE</option>
                    <option value="MCA / Management">MCA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 cursor-pointer transition-all"
                >
                  <ArrowLeft size={12} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !leadPhone.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-40 px-6 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-black/40 transition-all cursor-pointer"
                >
                  <span>{loading ? "Creating..." : "Create Team"}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ── JOIN TEAM FORM ────────────────────────────────────────── */}
      {registrationMode === "join" && (
        <form onSubmit={handleJoinTeam} className="space-y-4 pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Step {joinStep} of 2: {joinStep === 1 ? "Invite Code" : "Contact Details"}</span>
            <span className="text-white font-mono">{joinStep === 1 ? "50%" : "100%"}</span>
          </div>

          {joinStep === 1 && (
            <div className="space-y-3 bg-white/[0.05] border border-white/15 rounded-2xl p-4 shadow-lg backdrop-blur-xl">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Team Invite Code <span className="text-rose-300">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="e.g. HULT26"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2.5 text-base font-mono font-bold tracking-widest text-white placeholder:text-white/35 uppercase outline-none focus:border-white focus:ring-1 focus:ring-white/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={!joinCode.trim()}
                  onClick={() => {
                    if (!joinCode.trim()) {
                      setErrorMessage("Please enter an invite code.");
                      return;
                    }
                    setErrorMessage(null);
                    setJoinStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-40 px-5 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-black/40 transition-all cursor-pointer"
                >
                  <span>Next: Your Info</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {joinStep === 2 && (
            <div className="space-y-3 bg-white/[0.05] border border-white/15 rounded-2xl p-4 shadow-lg backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Phone <span className="text-rose-300">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white focus:ring-1 focus:ring-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="2151042"
                    value={memberRoll}
                    onChange={(e) => setMemberRoll(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white focus:ring-1 focus:ring-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Department
                  </label>
                  <select
                    value={memberDepartment}
                    onChange={(e) => setMemberDepartment(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 py-2 text-xs text-white outline-none focus:border-white focus:ring-1 focus:ring-white/30 [&>option]:bg-black [&>option]:text-white"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Electrical Engineering">EE</option>
                    <option value="Mechanical Engineering">ME</option>
                    <option value="Chemical Engineering">ChE</option>
                    <option value="Biotechnology">BT</option>
                    <option value="Civil Engineering">CE</option>
                    <option value="MCA / Management">MCA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 cursor-pointer transition-all"
                >
                  <ArrowLeft size={12} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !memberPhone.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-40 px-6 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-black/40 transition-all cursor-pointer"
                >
                  <span>{loading ? "Joining..." : "Join Team"}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

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
  Loader2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Phone,
  GraduationCap,
  Edit3,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicEvent } from "@/types";

interface EventRegistrationModalProps {
  event: PublicEvent;
  isOpen?: boolean;
  onClose?: () => void;
  onRegistrationComplete?: () => void;
  isInline?: boolean;
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
  ventureDescription?: string;
  pitchDeckUrl?: string;
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: string;
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
  isOpen = true,
  onClose,
  onRegistrationComplete,
  isInline = true,
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

  // Final Team Submission State (for Team Leader)
  const [submissionForm, setSubmissionForm] = useState({
    ventureName: "",
    ventureDescription: "",
    pitchDeckUrl: "",
  });
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [finalSubmitError, setFinalSubmitError] = useState<string | null>(null);
  const [finalSubmitSuccess, setFinalSubmitSuccess] = useState<string | null>(null);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const minMembers = event.minTeamMembers || 3;
  const maxMembers = event.maxTeamMembers || 5;

  // Sync submission form with existing team data
  useEffect(() => {
    if (existingTeam) {
      setSubmissionForm({
        ventureName: existingTeam.ventureName || "",
        ventureDescription: existingTeam.ventureDescription || "",
        pitchDeckUrl: existingTeam.pitchDeckUrl || "",
      });
    }
  }, [existingTeam]);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingTeam) return;

    setSubmittingFinal(true);
    setFinalSubmitError(null);
    setFinalSubmitSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: existingTeam._id,
          teamCode: existingTeam.teamCode,
          ventureName: submissionForm.ventureName,
          ventureDescription: submissionForm.ventureDescription,
          pitchDeckUrl: submissionForm.pitchDeckUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit final team details.");
      }

      setFinalSubmitSuccess("Team information submitted successfully!");
      setExistingTeam((prev) =>
        prev
          ? {
              ...prev,
              ventureName: submissionForm.ventureName,
              ventureDescription: submissionForm.ventureDescription,
              pitchDeckUrl: submissionForm.pitchDeckUrl,
              submissionStatus: "submitted",
              submittedAt: new Date().toISOString(),
            }
          : null
      );
      setIsEditingSubmission(false);
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    } catch (err: unknown) {
      setFinalSubmitError((err as Error).message);
    } finally {
      setSubmittingFinal(false);
    }
  };

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
      console.error("Error checking user team:", err);
    } finally {
      setCheckingExisting(false);
    }
  }, [event._id, session?.user?.email]);

  useEffect(() => {
    checkUserTeam();
  }, [checkUserTeam]);

  const handleCopyCode = (code: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const handleShareWhatsApp = (code: string, teamName: string) => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const text = encodeURIComponent(
        `Join my Hult Prize team "${teamName}" for ${event.title}!\n\n` +
          `Team Invite Code: ${code}\n\n` +
          `Join our team directly here:\n${origin}/events?event=${event._id}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!createForm.teamName.trim()) {
      setErrorMessage("Please enter a valid Team Name.");
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

  if (!isInline && !isOpen) return null;

  // ── RENDER CORE WORKSPACE CONTENT ──────────────────────────────────────────
  const renderWorkspaceContent = () => (
    <div className="space-y-6">
      {/* Error Notice */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-200 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* ── STATE 1: LOADING ──────────────────────────────────────────────── */}
      {checkingExisting ? (
        <div className="py-16 text-center text-xs text-white/50 font-mono flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-white/70" />
          <span>Verifying student registration &amp; team status...</span>
        </div>
      ) : authStatus !== "authenticated" ? (
        /* ── STATE 2: UNAUTHENTICATED ───────────────────────────────────────── */
        <div className="space-y-6 text-center py-6 max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/20 text-white shadow-xl">
            <Lock className="h-7 w-7 text-white/80" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
              Student Authentication Required
            </h3>
            <p className="text-xs text-white/60 leading-relaxed font-[family-name:var(--font-google-sans)]">
              Registration is restricted to verified Heritage students. Sign in with your official
              college account (@heritageit.edu.in) to create or join a team.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11px] font-mono text-white/70">
            Only <strong className="text-white">@heritageit.edu.in</strong> accounts are authorized.
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: window.location.href })}
            className="w-full rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-bold font-[family-name:var(--font-google-sans)] py-3 px-6 text-xs sm:text-sm shadow-xl shadow-white/10 transition-all hover:scale-105 cursor-pointer"
          >
            Sign In with Google (HITK Account) →
          </button>
        </div>
      ) : existingTeam ? (
        /* ── STATE 3: ALREADY REGISTERED (TEAM WORKSPACE DOSSIER) ──────────── */
        (() => {
          const currentMembersCount = 1 + (existingTeam.members?.length || 0);
          const meetsMinCriteria = currentMembersCount >= minMembers;
          const isSubmitted = existingTeam.submissionStatus === "submitted";

          return (
            <div className="space-y-5 animate-fadeIn">
              {/* Team Name & Invite Code Hero Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 space-y-4 shadow-xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">
                      Registered Team Name
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {existingTeam.teamName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Role Badge */}
                    <span
                      className={`rounded-full border text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono flex items-center gap-1.5 ${
                        userRole === "lead"
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                          : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      }`}
                    >
                      {userRole === "lead" ? (
                        <>
                          <ShieldCheck size={12} />
                          <span>Team Leader</span>
                        </>
                      ) : (
                        <>
                          <Users size={12} />
                          <span>Team Member</span>
                        </>
                      )}
                    </span>

                    {/* Clean Technical Status Pill (1-line, no walls of text) */}
                    {isSubmitted ? (
                      <span className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono">
                        Submitted
                      </span>
                    ) : meetsMinCriteria ? (
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono">
                        Ready to Submit ({currentMembersCount}/{maxMembers})
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono">
                        Forming ({currentMembersCount}/{minMembers} Min Required)
                      </span>
                    )}

                    {existingTeam.ventureName && (
                      <span className="text-xs font-mono text-white/70 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                        Track: {existingTeam.ventureName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Invite Code Bar */}
                <div className="rounded-2xl border border-white/20 bg-black/50 backdrop-blur-2xl p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/50 block mb-1">
                      Team Invite Code
                    </span>
                    <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-[#f20089]">
                      {existingTeam.teamCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(existingTeam.teamCode)}
                      className="rounded-full bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1.5 font-[family-name:var(--font-google-sans)]"
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
                      onClick={() =>
                        handleShareWhatsApp(existingTeam.teamCode, existingTeam.teamName)
                      }
                      className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 text-xs transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1.5 font-[family-name:var(--font-google-sans)] shadow-lg shadow-emerald-900/30"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-white/50 leading-relaxed font-[family-name:var(--font-google-sans)]">
                  Share this invite code with classmates. When they enter this code on the event page, they join your team roster automatically.
                </p>
              </div>

              {/* Full Team Roster Dossier & Open Slots */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 space-y-4 shadow-xl">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-white/10">
                  <span className="text-white/80 font-semibold flex items-center gap-2 font-mono uppercase text-[11px]">
                    <Users className="h-4 w-4 text-[#f20089]" />
                    <span>Full Team Roster ({currentMembersCount}/{maxMembers} Students)</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    Heritage Verified
                  </span>
                </div>

                {/* Team Leader Card */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/15 p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-sm flex items-center justify-center shrink-0 font-[family-name:var(--font-google-sans)]">
                        {existingTeam.lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-[family-name:var(--font-google-sans)] font-bold text-white text-sm sm:text-base truncate">
                            {existingTeam.lead.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 shrink-0">
                            Leader
                          </span>
                        </div>
                        <div className="text-xs text-white/50 font-mono truncate">
                          {existingTeam.lead.email}
                        </div>
                      </div>
                    </div>

                    {existingTeam.lead.roll && (
                      <span className="text-xs font-mono text-white/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                        Roll: {existingTeam.lead.roll}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-white/60 pt-2 border-t border-white/5 font-mono">
                    {existingTeam.lead.department && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1">
                        <GraduationCap size={13} className="text-white/40" />
                        <span>{existingTeam.lead.department}</span>
                      </span>
                    )}
                    {existingTeam.lead.phone && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1">
                        <Phone size={12} className="text-white/40" />
                        <span>{existingTeam.lead.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Joined Members */}
                {existingTeam.members && existingTeam.members.length > 0 && (
                  <div className="space-y-2.5">
                    {existingTeam.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-sm flex items-center justify-center shrink-0 font-[family-name:var(--font-google-sans)]">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-[family-name:var(--font-google-sans)] font-semibold text-white text-sm truncate">
                                  {m.name}
                                </span>
                                <span className="text-[9px] font-mono text-blue-300 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 shrink-0">
                                  Member
                                </span>
                              </div>
                              <div className="text-xs text-white/50 font-mono truncate">
                                {m.email}
                              </div>
                            </div>
                          </div>

                          {m.roll && (
                            <span className="text-xs font-mono text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                              Roll: {m.roll}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-white/60 pt-2 border-t border-white/5 font-mono">
                          {m.department && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1">
                              <GraduationCap size={13} className="text-white/40" />
                              <span>{m.department}</span>
                            </span>
                          )}
                          {m.phone && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1">
                              <Phone size={12} className="text-white/40" />
                              <span>{m.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Venture Proposal & Submission Dossier (Unlocks once minimum criteria is reached) */}
              {meetsMinCriteria && (
                <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
                    <span className="font-mono uppercase font-bold tracking-wider text-white/70 text-xs flex items-center gap-2">
                      <FileText size={15} className="text-[#f20089]" />
                      <span>Venture Proposal &amp; Pitch Deck</span>
                    </span>

                    {userRole === "lead" && isSubmitted && !isEditingSubmission && (
                      <button
                        type="button"
                        onClick={() => setIsEditingSubmission(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#f20089] hover:underline font-semibold cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Edit Details</span>
                      </button>
                    )}
                  </div>

                  {userRole === "lead" && (!isSubmitted || isEditingSubmission) ? (
                    /* Team Leader Submit / Edit Form */
                    <form onSubmit={handleFinalSubmit} className="space-y-4 pt-1">
                      {finalSubmitError && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-200">
                          {finalSubmitError}
                        </div>
                      )}
                      {finalSubmitSuccess && (
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-200">
                          {finalSubmitSuccess}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5 font-bold">
                          Venture Track / Project Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. EcoPack Innovations"
                          value={submissionForm.ventureName}
                          onChange={(e) =>
                            setSubmissionForm((p) => ({ ...p, ventureName: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5 font-bold">
                          Executive Problem &amp; Solution Summary
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Briefly describe your venture's social impact, target problem, and proposed innovation..."
                          value={submissionForm.ventureDescription}
                          onChange={(e) =>
                            setSubmissionForm((p) => ({
                              ...p,
                              ventureDescription: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none resize-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5 font-bold">
                          Pitch Deck Link (Google Drive / Canva / Notion)
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/... or Canva presentation link"
                          value={submissionForm.pitchDeckUrl}
                          onChange={(e) =>
                            setSubmissionForm((p) => ({ ...p, pitchDeckUrl: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none font-mono transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-3 flex-wrap">
                        <button
                          type="submit"
                          disabled={submittingFinal}
                          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm py-3 px-7 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 font-[family-name:var(--font-google-sans)] inline-flex items-center gap-2"
                        >
                          {submittingFinal ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Submitting Application...</span>
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              <span>Submit Official Team Application</span>
                            </>
                          )}
                        </button>

                        {isEditingSubmission && (
                          <button
                            type="button"
                            onClick={() => setIsEditingSubmission(false)}
                            className="rounded-full border border-white/15 bg-white/5 hover:bg-white/15 px-5 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    /* Read-Only Proposal Dossier */
                    <div className="space-y-4 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-white/40 block">
                          Track / Project Title
                        </span>
                        <span className="font-[family-name:var(--font-google-sans)] font-bold text-white text-base block mt-0.5">
                          {existingTeam.ventureName || "General Track"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-white/40 block">
                          Description &amp; Problem Statement
                        </span>
                        <p className="text-white/80 whitespace-pre-line text-xs sm:text-sm mt-1 leading-relaxed bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                          {existingTeam.ventureDescription || "No description provided."}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-white/40 block mb-1.5">
                          Pitch Deck Presentation
                        </span>
                        {existingTeam.pitchDeckUrl ? (
                          <a
                            href={existingTeam.pitchDeckUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-105"
                          >
                            <ExternalLink size={13} className="text-[#f20089]" />
                            <span className="truncate max-w-sm">{existingTeam.pitchDeckUrl}</span>
                          </a>
                        ) : (
                          <span className="text-white/40 font-mono text-xs">
                            Pitch deck not yet attached.
                          </span>
                        )}
                      </div>

                      {userRole === "member" && (
                        <p className="text-[11px] text-white/40 font-mono pt-1">
                          Read-only: Only your Team Leader ({existingTeam.lead.name}) is authorized to update submission details.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()
      ) : mode === "select" ? (
        /* ── STATE 4: THE DUAL CHOICE (CREATE TEAM vs JOIN TEAM) ───────────── */
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-1">
            <h3 className="font-serif text-2xl font-bold text-white">
              Choose How to Participate
            </h3>
            <p className="text-xs text-white/60 font-[family-name:var(--font-google-sans)]">
              Lead your own startup venture or join an existing student team with a team code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Option A: Create Team */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode("create");
              }}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/35 p-6 sm:p-7 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl cursor-pointer"
            >
              <div>
                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-4 group-hover:bg-white group-hover:text-black transition-all">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-white mb-1.5">
                  Create Team
                </h4>
                <p className="text-xs text-white/60 leading-relaxed font-[family-name:var(--font-google-sans)]">
                  Start a new venture as Team Leader. A unique Team Invite Code will be generated for your classmates to join.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-white">
                <span className="font-[family-name:var(--font-google-sans)]">Start New Team</span>
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
              className="group relative flex flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/35 p-6 sm:p-7 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl cursor-pointer"
            >
              <div>
                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-4 group-hover:bg-white group-hover:text-black transition-all">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-white mb-1.5">
                  Join Team
                </h4>
                <p className="text-xs text-white/60 leading-relaxed font-[family-name:var(--font-google-sans)]">
                  Have a Team Invite Code from your leader? Enter the code to join their roster as an official team member.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-white">
                <span className="font-[family-name:var(--font-google-sans)]">Enter Invite Code</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      ) : mode === "create" ? (
        /* ── STATE 5: CREATE TEAM FORM ─────────────────────────────────────── */
        <form onSubmit={handleCreateSubmit} className="space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode("select");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer font-[family-name:var(--font-google-sans)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to choices</span>
            </button>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              You will be Team Leader
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
              Team Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EcoInnovators"
              value={createForm.teamName}
              onChange={(e) => setCreateForm({ ...createForm, teamName: e.target.value })}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
              Venture Track / Idea (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Renewable Microgrid Solution"
              value={createForm.ventureName}
              onChange={(e) => setCreateForm({ ...createForm, ventureName: e.target.value })}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                College Roll No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2152001"
                value={createForm.roll}
                onChange={(e) => setCreateForm({ ...createForm, roll: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-mono transition-all"
              />
            </div>
          </div>

          {/* Student Verified Identity Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
              Leader Credentials
            </span>
            <div className="text-white font-medium text-sm font-[family-name:var(--font-google-sans)]">
              {session?.user?.name}
            </div>
            <div className="text-xs text-white/50 font-mono mt-0.5">{session?.user?.email}</div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setMode("select")}
              className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-bold px-7 py-3 text-xs sm:text-sm shadow-xl shadow-white/10 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)] inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Code...</span>
                </>
              ) : (
                <span>Create Team &amp; Get Code →</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ── STATE 6: JOIN TEAM FORM ───────────────────────────────────────── */
        <form onSubmit={handleJoinSubmit} className="space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode("select");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer font-[family-name:var(--font-google-sans)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to choices</span>
            </button>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Join by Invite Code
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
              Enter Team Invite Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HULT-7X9B"
              value={joinForm.teamCode}
              onChange={(e) => setJoinForm({ ...joinForm, teamCode: e.target.value.toUpperCase() })}
              className="w-full rounded-2xl border-2 border-white/20 bg-black/40 px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#f20089] shadow-inner font-mono text-xl sm:text-2xl font-black tracking-widest text-[#f20089] uppercase text-center transition-all"
            />
            <span className="text-[11px] text-white/50 mt-1.5 block text-center font-[family-name:var(--font-google-sans)]">
              Ask your team leader for their 8-character invite code (e.g. HULT-XXXX)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={joinForm.phone}
                onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                College Roll No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2152002"
                value={joinForm.roll}
                onChange={(e) => setJoinForm({ ...joinForm, roll: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-mono transition-all"
              />
            </div>
          </div>

          {/* Student Verified Identity Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
              Joining Member Credentials
            </span>
            <div className="text-white font-medium text-sm font-[family-name:var(--font-google-sans)]">
              {session?.user?.name}
            </div>
            <div className="text-xs text-white/50 font-mono mt-0.5">{session?.user?.email}</div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setMode("select")}
              className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-bold px-7 py-3 text-xs sm:text-sm shadow-xl shadow-white/10 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)] inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Joining Team...</span>
                </>
              ) : (
                <span>Join Team Roster →</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  // ── INLINE MODE (PAGE SECTION) ─────────────────────────────────────────────
  if (isInline) {
    return (
      <section
        id="team-registration"
        className="relative w-full rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-9 shadow-2xl overflow-hidden text-white font-sans animate-fadeIn scroll-mt-28"
      >
        {/* Top Iridescent Edge */}
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
          aria-hidden="true"
        />

        <div className="relative z-[2] flex flex-col gap-6">
          {/* Section Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#f20089] mb-1">
                <Sparkles size={12} />
                <span>Competition Workspace</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]">
                Team Registration &amp; Roster
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono">
                {event.tag || "Flagship"}
              </span>
              <span className="text-[11px] text-white/60 font-mono">
                Team: {minMembers}–{maxMembers} Members
              </span>
            </div>
          </div>

          {/* Render Core Content Inline */}
          {renderWorkspaceContent()}
        </div>
      </section>
    );
  }

  // ── MODAL MODE (FALLBACK DIALOG) ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] border border-white/15 bg-[#0c0a12]/95 backdrop-blur-2xl shadow-2xl text-white font-sans overflow-hidden">
        {/* Top Iridescent Edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Fixed Pinned Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 shrink-0 bg-[#0c0a12] flex items-center justify-between gap-4">
          <div className="space-y-1 pr-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 font-mono">
                {event.tag || "Flagship"}
              </span>
              <span className="text-[11px] text-white/50 font-mono">
                Team: {minMembers}–{maxMembers} Members
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {event.title}
            </h2>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Modal"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {renderWorkspaceContent()}
        </div>
      </div>
    </div>
  );
}

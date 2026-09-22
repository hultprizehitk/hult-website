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
  CheckCircle2,
  ExternalLink,
  FileText,
  Phone,
  GraduationCap,
  Clock,
  Edit3,
  Send,
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
          /* ── STATE 3: ALREADY REGISTERED (FULL TEAM INFO & CRITERIA SUBMISSION) ──── */
          (() => {
            const currentMembersCount = 1 + (existingTeam.members?.length || 0);
            const meetsMinCriteria = currentMembersCount >= minMembers;
            const isSubmitted = existingTeam.submissionStatus === "submitted";

            return (
              <div className="space-y-5 animate-fadeIn">
                {/* Status Bar */}
                <div
                  className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                    isSubmitted
                      ? "border-purple-500/40 bg-purple-950/20"
                      : meetsMinCriteria
                      ? "border-emerald-500/40 bg-emerald-950/20"
                      : "border-amber-500/40 bg-amber-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSubmitted ? (
                      <Sparkles className="h-5 w-5 text-purple-400 shrink-0" />
                    ) : meetsMinCriteria ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isSubmitted
                          ? "Application Officially Submitted"
                          : meetsMinCriteria
                          ? "Team Criteria Met (Eligible for Final Submission)"
                          : "Forming Team (Roster Incomplete)"}
                      </span>
                      <span className="text-[10px] text-white/60 font-mono">
                        {isSubmitted
                          ? `Submitted on ${
                              existingTeam.submittedAt
                                ? new Date(existingTeam.submittedAt).toLocaleDateString()
                                : "Confirmed record"
                            }`
                          : meetsMinCriteria
                          ? `${currentMembersCount} of ${maxMembers} members enrolled`
                          : `Needs ${minMembers - currentMembersCount} more member(s) to reach minimum`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isSubmitted && (
                      <span className="rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 font-mono">
                        Submitted
                      </span>
                    )}
                    <span
                      className={`rounded-full border text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono flex items-center gap-1 ${
                        userRole === "lead"
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                          : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      }`}
                    >
                      {userRole === "lead" ? (
                        <>
                          <ShieldCheck size={11} />
                          <span>Team Leader</span>
                        </>
                      ) : (
                        <>
                          <Users size={11} />
                          <span>Team Member</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Criteria Progress Card */}
                <div className="rounded-2xl border border-white/15 bg-[#16161d] p-4.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase font-bold tracking-wider text-white/50 text-[10px] flex items-center gap-1.5">
                      <Users size={13} className="text-[#f20089]" />
                      <span>Roster Criteria Progress</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      {currentMembersCount} / {maxMembers} Students{" "}
                      <span className="text-white/40 font-normal">
                        (Min required: {minMembers})
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isSubmitted
                          ? "bg-purple-500"
                          : meetsMinCriteria
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(15, (currentMembersCount / maxMembers) * 100)
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Context Guidance Alert */}
                  {!meetsMinCriteria ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200/90 flex items-start gap-2">
                      <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 block">
                          Criteria Pending: Minimum {minMembers} Members Required
                        </span>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">
                          Share your Team Code below with classmates. Once at least {minMembers} students join, the Team Leader can submit the official venture details.
                        </p>
                      </div>
                    </div>
                  ) : !isSubmitted ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-200/90 flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-300 block">
                          Team Criteria Satisfied ({currentMembersCount} Members)
                        </span>
                        <p className="text-[11px] text-emerald-200/80 mt-0.5">
                          {userRole === "lead"
                            ? "As Team Leader, you can now finalize and submit your venture proposal and pitch deck below."
                            : "Your team satisfies the member threshold. Your Team Leader can now submit the final venture proposal."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs text-purple-200/90 flex items-start gap-2">
                      <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-300 block">
                          Roster &amp; Application Confirmed
                        </span>
                        <p className="text-[11px] text-purple-200/80 mt-0.5">
                          All criteria matched and final team details are recorded for judging.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Name & Invite Code Block */}
                <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                      Registered Team Name
                    </span>
                    <h3 className="text-xl font-bold text-white font-[family-name:var(--font-google-sans)]">
                      {existingTeam.teamName}
                    </h3>
                  </div>

                  {/* Team Code Bar */}
                  <div className="rounded-xl border border-white/20 bg-[#121217] p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">
                        Team Invite Code
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-[#f20089]">
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
                        onClick={() =>
                          handleShareWhatsApp(existingTeam.teamCode, existingTeam.teamName)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Comprehensive Team Roster Dossier */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 font-semibold flex items-center gap-1.5 font-mono uppercase text-[10px]">
                        <Users className="h-3.5 w-3.5 text-white/60" />
                        <span>Full Team Roster ({currentMembersCount} Students)</span>
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">
                        Heritage Verified
                      </span>
                    </div>

                    {/* Team Leader Dossier Card */}
                    <div className="rounded-xl bg-[#121217] border border-white/15 p-3.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {existingTeam.lead.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300">
                            Team Leader
                          </span>
                        </div>
                        {existingTeam.lead.roll && (
                          <span className="text-[10px] font-mono text-white/60">
                            Roll: {existingTeam.lead.roll}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-white/60 pt-1 font-mono">
                        <span className="truncate">{existingTeam.lead.email}</span>
                        <span>Dept: {existingTeam.lead.department || "General"}</span>
                        <span>Phone: {existingTeam.lead.phone || "Not recorded"}</span>
                      </div>
                    </div>

                    {/* Team Members List */}
                    {existingTeam.members && existingTeam.members.length > 0 && (
                      <div className="space-y-2">
                        {existingTeam.members.map((m, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-[#121217] border border-white/10 p-3 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-xs">
                                  {m.name}
                                </span>
                                <span className="text-[9px] font-mono text-blue-300 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                  Member
                                </span>
                              </div>
                              {m.roll && (
                                <span className="text-[10px] font-mono text-white/50">
                                  Roll: {m.roll}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-white/50 pt-0.5 font-mono">
                              <span className="truncate">{m.email}</span>
                              <span>Dept: {m.department || "General"}</span>
                              <span>Phone: {m.phone || "Not recorded"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Slots Remaining Guidance */}
                    {currentMembersCount < maxMembers && (
                      <p className="text-[11px] text-white/50 pt-1 leading-normal font-sans">
                        Share code <span className="text-[#f20089] font-mono font-bold">{existingTeam.teamCode}</span> with up to {maxMembers - currentMembersCount} more student(s) to complete your roster.
                      </p>
                    )}
                  </div>
                </div>

                {/* Venture Proposal & Submission Dossier */}
                <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono uppercase font-bold tracking-wider text-white/60 text-[10px] flex items-center gap-1.5">
                      <FileText size={13} className="text-[#f20089]" />
                      <span>Venture Proposal &amp; Pitch Deck</span>
                    </span>

                    {userRole === "lead" && !isEditingSubmission && (
                      <button
                        type="button"
                        onClick={() => setIsEditingSubmission(true)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#f20089] hover:underline font-semibold cursor-pointer"
                      >
                        <Edit3 size={12} />
                        <span>Edit Details</span>
                      </button>
                    )}
                  </div>

                  {userRole === "lead" ? (
                    isEditingSubmission ||
                    (!existingTeam.ventureDescription && !existingTeam.pitchDeckUrl) ? (
                      /* Team Leader Edit / Submit Form */
                      <form onSubmit={handleFinalSubmit} className="space-y-3.5 pt-1">
                        {finalSubmitError && (
                          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
                            {finalSubmitError}
                          </div>
                        )}
                        {finalSubmitSuccess && (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                            {finalSubmitSuccess}
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
                            Venture Track / Project Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. EcoPack Innovations"
                            value={submissionForm.ventureName}
                            onChange={(e) =>
                              setSubmissionForm((p) => ({ ...p, ventureName: e.target.value }))
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
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
                            className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
                            Pitch Deck Link (Google Drive / Canva / Notion)
                          </label>
                          <input
                            type="url"
                            placeholder="https://drive.google.com/... or Canva presentation link"
                            value={submissionForm.pitchDeckUrl}
                            onChange={(e) =>
                              setSubmissionForm((p) => ({ ...p, pitchDeckUrl: e.target.value }))
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            type="submit"
                            variant="default"
                            disabled={!meetsMinCriteria || submittingFinal}
                            className="flex-1 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingFinal ? (
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Submitting Application...</span>
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                <Send size={13} />
                                <span>Submit Official Team Application</span>
                              </span>
                            )}
                          </Button>

                          {isEditingSubmission && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditingSubmission(false)}
                              className="rounded-xl font-semibold text-xs"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>

                        {!meetsMinCriteria && (
                          <p className="text-[10px] text-amber-300 font-mono text-center">
                            Submission unlocks once your team reaches at least {minMembers} members.
                          </p>
                        )}
                      </form>
                    ) : (
                      /* Team Leader Read View */
                      <div className="space-y-3 pt-1 text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-white/40 block">
                            Track / Project Title
                          </span>
                          <span className="font-bold text-white block mt-0.5">
                            {existingTeam.ventureName || "General Track"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase text-white/40 block">
                            Description &amp; Problem Statement
                          </span>
                          <p className="text-white/80 whitespace-pre-line text-xs mt-0.5 leading-relaxed bg-[#121217] border border-white/10 p-3 rounded-xl">
                            {existingTeam.ventureDescription || "No description provided."}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                            Pitch Deck Presentation
                          </span>
                          {existingTeam.pitchDeckUrl ? (
                            <a
                              href={existingTeam.pitchDeckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors"
                            >
                              <ExternalLink size={13} className="text-[#f20089]" />
                              <span className="truncate max-w-xs">{existingTeam.pitchDeckUrl}</span>
                            </a>
                          ) : (
                            <span className="text-white/40 font-mono text-[11px]">
                              Pitch deck not yet attached.
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    /* Team Member Read-Only View */
                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-white/40 block">
                          Track / Project Title
                        </span>
                        <span className="font-bold text-white block mt-0.5">
                          {existingTeam.ventureName || "General Impact Track"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-white/40 block">
                          Description &amp; Problem Statement
                        </span>
                        <p className="text-white/80 whitespace-pre-line text-xs mt-0.5 leading-relaxed bg-[#121217] border border-white/10 p-3 rounded-xl">
                          {existingTeam.ventureDescription || "Pending submission by Team Leader."}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                          Pitch Deck Link
                        </span>
                        {existingTeam.pitchDeckUrl ? (
                          <a
                            href={existingTeam.pitchDeckUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors"
                          >
                            <ExternalLink size={13} className="text-[#f20089]" />
                            <span className="truncate max-w-xs">{existingTeam.pitchDeckUrl}</span>
                          </a>
                        ) : (
                          <span className="text-white/40 font-mono text-[11px]">
                            Pending upload by Team Leader.
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-white/40 font-mono pt-1">
                        Read-only: Only your Team Leader ({existingTeam.lead.name}) is authorized to update submission details.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={onClose}
                  className="w-full font-semibold cursor-pointer"
                >
                  Close Window
                </Button>
              </div>
            );
          })()
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

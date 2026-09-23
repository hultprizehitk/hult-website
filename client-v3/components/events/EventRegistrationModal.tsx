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
  ShieldCheck,
  AlertCircle,
  Lock,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  Phone,
  GraduationCap,
  Edit3,
  Send,
  Trash2,
  UserMinus,
  LogOut,
} from "lucide-react";
import type { PublicEvent } from "@/types";
import CreateTeamForm from "./registration/CreateTeamForm";
import JoinTeamForm from "./registration/JoinTeamForm";

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

  // Saved user profile (phone & roll from DB)
  const [profileData, setProfileData] = useState<{
    phone: string;
    roll: string;
  } | null>(null);

  // Fetch saved student profile (phone & roll)
  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            const rawPhone = (data.user.phone || "").trim();
            const rawRoll = (data.user.roll || "").trim();
            const cleanPhone = rawPhone.replace(/\D/g, "").slice(0, 10);
            const cleanRoll = rawRoll.replace(/\D/g, "");

            setProfileData({ phone: cleanPhone, roll: cleanRoll });
            if (cleanPhone) {
              setCreateForm((prev) => ({ ...prev, phone: cleanPhone }));
              setJoinForm((prev) => ({ ...prev, phone: cleanPhone }));
            }
            if (cleanRoll) {
              setCreateForm((prev) => ({ ...prev, roll: cleanRoll }));
              setJoinForm((prev) => ({ ...prev, roll: cleanRoll }));
            }
          }
        })
        .catch((err) => console.error("Error fetching user profile:", err));
    }
  }, [session?.user?.email]);

  const isPhoneSaved = Boolean(profileData?.phone && /^\d{10}$/.test(profileData.phone));
  const isRollSaved = Boolean(profileData?.roll && /^\d+$/.test(profileData.roll));

  // Action status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Final Team Registration State
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [finalSubmitError, setFinalSubmitError] = useState<string | null>(null);
  const [finalSubmitSuccess, setFinalSubmitSuccess] = useState<string | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Team Management State (Edit info, Remove Member, Leave Team, Delete Team)
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamForm, setEditTeamForm] = useState({
    teamName: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const minMembers = event.minTeamMembers || 3;
  const maxMembers = event.maxTeamMembers || 5;

  // Sync edit team form with existing team data
  useEffect(() => {
    if (existingTeam) {
      setEditTeamForm({
        teamName: existingTeam.teamName || "",
      });
    }
  }, [existingTeam]);

  // Open submission popup modal
  const openSubmissionModal = () => {
    setFinalSubmitError(null);
    setFinalSubmitSuccess(null);
    setIsSubmissionModalOpen(true);
  };

  // Close submission modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSubmissionModalOpen) {
        setIsSubmissionModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmissionModalOpen]);

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!existingTeam) return;

    const currentMembersCount = 1 + (existingTeam.members?.length || 0);
    if (currentMembersCount < minMembers) {
      setFinalSubmitError(
        `Minimum ${minMembers} members required to submit registration. Your team currently has ${currentMembersCount} member(s).`
      );
      return;
    }

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
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit team registration.");
      }

      setFinalSubmitSuccess("Team registration submitted successfully! Team is registered for this event.");
      setExistingTeam((prev) =>
        prev
          ? {
            ...prev,
            submissionStatus: "submitted",
            status: "confirmed",
            submittedAt: new Date().toISOString(),
          }
          : null
      );
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

  // Team Leader edits team info
  const handleEditTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingTeam) return;

    if (existingTeam.submissionStatus === "submitted") {
      setActionError("Official team registration has already been submitted. The team name is permanently locked and cannot be changed.");
      return;
    }

    if (!editTeamForm.teamName.trim()) {
      setActionError("Team Name cannot be blank.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: existingTeam._id,
          action: "edit_team",
          teamName: editTeamForm.teamName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update team details.");
      }

      setExistingTeam((prev) =>
        prev
          ? {
            ...prev,
            teamName: editTeamForm.teamName.trim(),
          }
          : null
      );
      setIsEditingTeam(false);
      setActionSuccess("Team details updated successfully.");
      setTimeout(() => setActionSuccess(null), 3500);
      if (onRegistrationComplete) onRegistrationComplete();
    } catch (err: unknown) {
      setActionError((err as Error).message || "Failed to update team.");
    } finally {
      setActionLoading(false);
    }
  };

  // Team Leader removes a member from the roster
  const handleRemoveMember = async (memberEmail: string, memberName: string) => {
    if (!existingTeam) return;

    if (!window.confirm(`Remove ${memberName} from this team roster?`)) {
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: existingTeam._id,
          action: "remove_member",
          memberEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove member.");
      }

      setActionSuccess(`${memberName} removed from team.`);
      setTimeout(() => setActionSuccess(null), 3500);
      await checkUserTeam();
      if (onRegistrationComplete) onRegistrationComplete();
    } catch (err: unknown) {
      setActionError((err as Error).message || "Failed to remove member.");
    } finally {
      setActionLoading(false);
    }
  };

  // Team Member leaves the team
  const handleLeaveTeam = async () => {
    if (!existingTeam) return;

    if (
      !window.confirm(
        `Are you sure you want to leave team "${existingTeam.teamName}"? You will be free to join or create another team.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: existingTeam._id,
          action: "leave_team",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to leave team.");
      }

      const prevName = existingTeam.teamName;
      setExistingTeam(null);
      setUserRole(null);
      setMode("select");
      setActionSuccess(`You left team "${prevName}". You can now create or join a new team.`);
      setTimeout(() => setActionSuccess(null), 4000);
      if (onRegistrationComplete) onRegistrationComplete();
      await checkUserTeam();
    } catch (err: unknown) {
      setActionError((err as Error).message || "Failed to leave team.");
    } finally {
      setActionLoading(false);
    }
  };

  // Team Leader disbands/deletes the team
  const handleDeleteTeam = async () => {
    if (!existingTeam) return;

    if (
      !window.confirm(
        `Disband and delete team "${existingTeam.teamName}"? All teammates will be released, and you can join or create another team.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/teams?teamId=${existingTeam._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disband team.");
      }

      const prevName = existingTeam.teamName;
      setExistingTeam(null);
      setUserRole(null);
      setMode("select");
      setActionSuccess(`Team "${prevName}" disbanded. You can now create or join a new team.`);
      setTimeout(() => setActionSuccess(null), 4000);
      if (onRegistrationComplete) onRegistrationComplete();
      await checkUserTeam();
    } catch (err: unknown) {
      setActionError((err as Error).message || "Failed to delete team.");
    } finally {
      setActionLoading(false);
    }
  };

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

    const rawPhone = createForm.phone.trim() || profileData?.phone?.trim() || "";
    const rawRoll = createForm.roll.trim() || profileData?.roll?.trim() || "";
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(0, 10);
    const cleanRoll = rawRoll.replace(/\D/g, "");

    if (!createForm.teamName.trim()) {
      setErrorMessage("Please enter a valid Team Name.");
      return;
    }

    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setErrorMessage("Contact Phone must be a valid 10-digit number.");
      return;
    }

    if (!cleanRoll || !/^\d+$/.test(cleanRoll)) {
      setErrorMessage("College Roll No. must contain numbers only.");
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
          phone: cleanPhone,
          roll: cleanRoll,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to create team.");
        return;
      }

      setExistingTeam(data.team);
      setUserRole("lead");
      // Update profileData locally
      setProfileData({ phone: cleanPhone, roll: cleanRoll });
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

    const rawPhone = joinForm.phone.trim() || profileData?.phone?.trim() || "";
    const rawRoll = joinForm.roll.trim() || profileData?.roll?.trim() || "";
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(0, 10);
    const cleanRoll = rawRoll.replace(/\D/g, "");

    if (!joinForm.teamCode.trim()) {
      setErrorMessage("Please enter a valid Team Code.");
      return;
    }

    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setErrorMessage("Contact Phone must be a valid 10-digit number.");
      return;
    }

    if (!cleanRoll || !/^\d+$/.test(cleanRoll)) {
      setErrorMessage("College Roll No. must contain numbers only.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: joinForm.teamCode.trim().toUpperCase(),
          phone: cleanPhone,
          roll: cleanRoll,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to join team.");
        return;
      }

      setExistingTeam(data.team);
      setUserRole("member");
      // Update profileData locally
      setProfileData({ phone: cleanPhone, roll: cleanRoll });
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/12 text-white/90 backdrop-blur-md">
                      {userRole === "lead" ? (
                        <>
                          <ShieldCheck size={12} className="text-[#f20089]" />
                          <span>Team Leader</span>
                        </>
                      ) : (
                        <>
                          <Users size={12} className="text-white/60" />
                          <span>Team Member</span>
                        </>
                      )}
                    </span>

                    {/* Status Pill with refined indicator dot */}
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/[0.08] border border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] backdrop-blur-md">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        </span>
                        <span>Registered &amp; Confirmed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/[0.08] border border-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.12)] backdrop-blur-md">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                        </span>
                        <span>Pending Submission ({currentMembersCount} Joined)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Management Action Buttons Row */}
                {userRole === "lead" && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 flex-wrap">
                    {!isSubmitted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingTeam(!isEditingTeam);
                            setActionError(null);
                          }}
                          className="rounded-full bg-white/5 hover:bg-white/15 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5 font-mono"
                        >
                          <Edit3 size={11} className="text-white/70" />
                          <span>{isEditingTeam ? "Cancel Edit" : "Edit Team Name"}</span>
                        </button>

                        <span className="text-[10px] font-mono text-white/40">
                          Leader control: rename team
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/50">
                        <Lock size={11} className="text-emerald-400" />
                        <span>Team Name Locked (Submitted)</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Action Alerts */}
                {actionError && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <span className="leading-relaxed">{actionError}</span>
                  </div>
                )}
                {actionSuccess && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span className="leading-relaxed">{actionSuccess}</span>
                  </div>
                )}

                {/* Inline Team Info Edit Form (for Team Leader) */}
                {isEditingTeam && (
                  <form
                    onSubmit={handleEditTeamSubmit}
                    className="bg-white/5 border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Edit3 size={13} className="text-rose-300" />
                        <span>Edit Team Details</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-300">Leader Privilege</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-white/70 mb-1 font-bold">
                          Team Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editTeamForm.teamName}
                          onChange={(e) =>
                            setEditTeamForm((p) => ({ ...p, teamName: e.target.value }))
                          }
                          className="w-full rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingTeam(false)}
                        className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs text-white/70 hover:text-white transition-all cursor-pointer font-mono"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="rounded-full bg-white text-black hover:bg-neutral-200 font-bold px-4 py-1.5 text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 disabled:opacity-50 font-mono"
                      >
                        {actionLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Team Invite Code Bar */}
                <div className="rounded-2xl border border-white/20 bg-black/50 backdrop-blur-2xl p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/50 block mb-1">
                      Team Invite Code
                    </span>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-[#f20089]">
                        {existingTeam.teamCode}
                      </span>
                      {isSubmitted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                          <Lock size={10} />
                          <span>Roster Locked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {!isSubmitted ? (
                      <>
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
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/15 px-3.5 py-1.5 text-xs font-mono text-white/60">
                        <Lock size={12} className="text-emerald-400" />
                        <span>Registration Finalized</span>
                      </span>
                    )}
                  </div>
                </div>

                {isSubmitted ? (
                  <p className="text-[11px] text-emerald-400/90 leading-relaxed font-[family-name:var(--font-google-sans)] flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>Official team registration has been finalized and submitted. The team roster is locked and no new members can join using this code.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-white/50 leading-relaxed font-[family-name:var(--font-google-sans)]">
                    Share this invite code with classmates. When they enter this code on the event page, they join your team roster automatically.
                  </p>
                )}
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-google-sans)] font-bold text-white text-sm sm:text-base truncate">
                          {existingTeam.lead.name}
                        </span>
                        <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white/90 shrink-0">
                          Leader
                        </span>
                      </div>
                      <div className="text-xs text-white/50 font-mono truncate">
                        {existingTeam.lead.email}
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
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-[family-name:var(--font-google-sans)] font-semibold text-white text-sm truncate">
                                {m.name}
                              </span>
                              <span className="text-[9px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60 shrink-0">
                                Member
                              </span>
                            </div>
                            <div className="text-xs text-white/50 font-mono truncate">
                              {m.email}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {m.roll && (
                              <span className="text-xs font-mono text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                                Roll: {m.roll}
                              </span>
                            )}
                            {userRole === "lead" && !isSubmitted && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.email, m.name)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-white/60 hover:text-rose-300 bg-white/[0.04] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                title={`Remove ${m.name} from team`}
                              >
                                <UserMinus size={11} />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
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

              {/* ── OFFICIAL TEAM REGISTRATION CARD (DOWN BELOW) ── */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 space-y-5 shadow-xl">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#f20089]" />
                    <span className="font-mono uppercase font-bold tracking-wider text-white/80 text-xs">
                      Official Team Registration
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Registered &amp; Confirmed</span>
                      </span>
                    ) : meetsMinCriteria ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Criteria Met ({currentMembersCount}/{minMembers})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        <span>Need {minMembers - currentMembersCount} More ({currentMembersCount}/{minMembers})</span>
                      </span>
                    )}
                  </div>
                </div>

                {isSubmitted ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/15 px-4 py-2.5 text-xs font-mono text-white/70">
                      <Lock size={12} className="text-emerald-400" />
                      <span>Roster Finalized &amp; Locked</span>
                    </span>

                    <button
                      type="button"
                      onClick={openSubmissionModal}
                      className="rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-5 py-2.5 text-xs transition-all cursor-pointer font-mono inline-flex items-center gap-2"
                    >
                      <FileText size={13} />
                      <span>View Registration Status</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    {userRole === "lead" ? (
                      <button
                        type="button"
                        onClick={handleDeleteTeam}
                        disabled={actionLoading}
                        className="rounded-full bg-white/5 hover:bg-rose-500/10 border border-white/15 hover:border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all cursor-pointer inline-flex items-center gap-1.5 font-mono disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        <span>Disband Team</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLeaveTeam}
                        disabled={actionLoading}
                        className="rounded-full bg-white/5 hover:bg-rose-500/10 border border-white/15 hover:border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-white/75 hover:text-rose-200 transition-all cursor-pointer inline-flex items-center gap-1.5 font-mono disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                        <span>Leave Team</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={openSubmissionModal}
                      className="rounded-full bg-white hover:bg-neutral-200 text-black font-bold px-6 py-2.5 text-xs transition-all cursor-pointer shadow-lg inline-flex items-center gap-2 font-mono"
                    >
                      <Send size={13} />
                      <span>
                        {userRole === "lead"
                          ? meetsMinCriteria
                            ? "Submit Application"
                            : `Submit Application (${currentMembersCount}/${minMembers})`
                          : "View Registration Status"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
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
              Lead your own team or join an existing student team with a team code.
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
                  Register as Team Leader. A unique Team Invite Code will be generated for your teammates to join.
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
        <CreateTeamForm
          createForm={createForm}
          setCreateForm={setCreateForm}
          isPhoneSaved={isPhoneSaved}
          isRollSaved={isRollSaved}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          submitting={submitting}
          onBack={() => {
            setErrorMessage(null);
            setMode("select");
          }}
          onSubmit={handleCreateSubmit}
        />
      ) : (
        /* ── STATE 6: JOIN TEAM FORM ───────────────────────────────────────── */
        <JoinTeamForm
          joinForm={joinForm}
          setJoinForm={setJoinForm}
          isPhoneSaved={isPhoneSaved}
          isRollSaved={isRollSaved}
          submitting={submitting}
          onBack={() => {
            setErrorMessage(null);
            setMode("select");
          }}
          onSubmit={handleJoinSubmit}
        />
      )}
    </div>
  );

  // ── REGISTRATION CONFIRMATION POPUP MODAL COMPONENT ────────────────────────
  const renderSubmissionModal = () => {
    if (!isSubmissionModalOpen || !existingTeam) return null;

    const currentMembersCount = 1 + (existingTeam.members?.length || 0);
    const meetsMinCriteria = currentMembersCount >= minMembers;
    const isActuallyConfirmed = existingTeam.submissionStatus === "submitted" && meetsMinCriteria;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 transition-opacity"
        onClick={() => setIsSubmissionModalOpen(false)}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121118] text-white font-sans shadow-2xl p-6 space-y-4 antialiased"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Official Registration
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isActuallyConfirmed ? "Registration Confirmed" : "Team Registration"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsSubmissionModalOpen(false)}
              className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body Content - Minimal, Technical, Professional */}
          {isActuallyConfirmed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-200 font-mono">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Team &quot;{existingTeam.teamName}&quot; is registered for this event.</span>
              </div>
            </div>
          ) : !meetsMinCriteria ? (
            <div className="space-y-3">
              {/* Status Pill Row */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-mono text-amber-200">
                <span className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-400 shrink-0" />
                  <span>Roster Incomplete</span>
                </span>
                <span className="font-bold text-amber-300">
                  {currentMembersCount} / {minMembers} Required
                </span>
              </div>

              {/* Invite Code Compact Box */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono">
                <span className="text-white/50">Invite Code</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#f20089] text-sm tracking-wider">
                    {existingTeam.teamCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(existingTeam.teamCode)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Copy Invite Code"
                  >
                    {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-white/50 font-mono text-center pt-1">
                Need {minMembers - currentMembersCount} more member{minMembers - currentMembersCount === 1 ? "" : "s"} to submit registration.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs font-mono text-emerald-200">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Roster Ready</span>
                </span>
                <span className="font-bold text-emerald-300">{currentMembersCount} Members</span>
              </div>

              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-white/40">Team</span>
                  <span className="text-white font-medium">{existingTeam.teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Event</span>
                  <span className="text-white font-medium truncate max-w-[200px]">{event.title}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {finalSubmitError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200 font-mono">
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{finalSubmitError}</span>
            </div>
          )}

          {/* Success Message */}
          {finalSubmitSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200 font-mono">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{finalSubmitSuccess}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsSubmissionModalOpen(false)}
              className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer font-mono"
            >
              Close
            </button>

            {meetsMinCriteria && !isActuallyConfirmed && userRole === "lead" && (
              <button
                type="button"
                disabled={submittingFinal}
                onClick={() => handleFinalSubmit()}
                className="rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs py-2 px-5 transition-all cursor-pointer shadow-md font-mono inline-flex items-center gap-2 disabled:opacity-50"
              >
                {submittingFinal ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Confirm Registration</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── INLINE MODE (PAGE SECTION) ─────────────────────────────────────────────
  if (isInline) {
    return (
      <>
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

                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]">
                  Team Registration &amp; Roster
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {event.tag && event.tag.trim().toLowerCase() !== "flagship" && (
                  <span className="rounded-full bg-white/[0.06] border border-white/15 text-white/85 text-xs font-medium px-3 py-1 backdrop-blur-md">
                    {event.tag}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-white/60 font-medium bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
                  <Users size={12} className="text-rose-300/80 shrink-0" />
                  <span>Team: {minMembers}–{maxMembers} Members</span>
                </span>
              </div>
            </div>

            {/* Render Core Content Inline */}
            {renderWorkspaceContent()}
          </div>
        </section>
        {renderSubmissionModal()}
      </>
    );
  }

  // ── MODAL MODE (FALLBACK DIALOG) ───────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] border border-white/15 bg-neutral-900/90 backdrop-blur-2xl shadow-2xl text-white font-sans overflow-hidden">
          {/* Top Iridescent Edge */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Fixed Pinned Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-white/10 shrink-0 bg-[#0c0a12] flex items-center justify-between gap-4">
            <div className="space-y-1 pr-4 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {event.tag && event.tag.trim().toLowerCase() !== "flagship" && (
                  <span className="rounded-full bg-white/[0.06] border border-white/15 text-white/85 text-xs font-medium px-2.5 py-0.5 backdrop-blur-md">
                    {event.tag}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-white/60 font-medium bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full">
                  <Users size={11} className="text-rose-300/80 shrink-0" />
                  <span>Team: {minMembers}–{maxMembers} Members</span>
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
      {renderSubmissionModal()}
    </>
  );
}

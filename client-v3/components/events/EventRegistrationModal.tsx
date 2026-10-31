"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  X,
  PlusCircle,
  KeyRound,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Loader2,
  Edit3,
  Send,
  Trash2,
  LogOut,
  UserRound,
  Users,
} from "lucide-react";
import type { PublicEvent } from "@/types";
import { useCountdown } from "@/lib/countdown";
import CreateTeamForm from "./registration/CreateTeamForm";
import JoinTeamForm from "./registration/JoinTeamForm";
import AuditoriumPassQR from "./AuditoriumPassQR";
import TeamRoster from "./TeamRoster";
import TeamStatusBadge from "./TeamStatusBadge";
import { Button } from "@/components/ui/button";
import Notice from "@/components/ui/Notice";
import { detailLabelClass, inputClass, teamCardClass } from "@/components/ui/styles";

const choiceCardClass =
  "group flex cursor-pointer flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.06]";

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
  isOnSpot?: boolean;
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

  const [liveEvent, setLiveEvent] = useState(event);

  useEffect(() => {
    setLiveEvent(event);
  }, [event]);

  // Real-time synchronization when Master Admin toggles On-Spot or closes registration
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("event_onspot_sync");
      channel.onmessage = (e) => {
        if (e.data?.eventId === event._id) {
          setLiveEvent((prev) => ({
            ...prev,
            onSpotRegistrationEnabled: e.data.onSpotRegistrationEnabled,
            ...(e.data.registrationStatus ? { registrationStatus: e.data.registrationStatus } : {}),
          }));
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "event_onspot_sync" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.eventId === event._id) {
            setLiveEvent((prev) => ({
              ...prev,
              onSpotRegistrationEnabled: parsed.onSpotRegistrationEnabled,
              ...(parsed.registrationStatus ? { registrationStatus: parsed.registrationStatus } : {}),
            }));
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [event._id]);

  const minMembers = liveEvent.minTeamMembers || 3;
  const maxMembers = liveEvent.maxTeamMembers || 5;
  const countdown = useCountdown(liveEvent.registrationDeadline);
  const isOnSpotLive = Boolean(liveEvent.onSpotRegistrationEnabled);
  const isTimeOver = countdown.hasDeadline && countdown.isExpired;
  const isRegistrationClosed = !isOnSpotLive && (liveEvent.registrationStatus === "closed" || isTimeOver);

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

    if (isRegistrationClosed) {
      setFinalSubmitError("Registration deadline for this event has passed. Submissions are closed.");
      return;
    }

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

    if (isRegistrationClosed) {
      setErrorMessage("Registration for this event has closed.");
      return;
    }

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

    if (isRegistrationClosed) {
      setErrorMessage("Registration for this event has closed.");
      return;
    }

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
    <div className="space-y-5">
      {errorMessage && <Notice tone="error">{errorMessage}</Notice>}

      {/* ── STATE 1: LOADING ──────────────────────────────────────────────── */}
      {checkingExisting ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
          <Loader2 size={16} className="animate-spin" />
          <span>Checking your registration</span>
        </div>
      ) : authStatus !== "authenticated" ? (
        /* ── STATE 2: UNAUTHENTICATED ───────────────────────────────────────── */
        <div className="mx-auto max-w-sm space-y-5 py-8 text-center">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-white">Sign in to register</h3>
            <p className="text-sm text-white/55">
              Use your @heritageit.edu.in Google account to create or join a team.
            </p>
          </div>
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: window.location.href })}
          >
            Sign in with Google
          </Button>
        </div>
      ) : existingTeam ? (
        /* ── STATE 3: ALREADY REGISTERED (TEAM WORKSPACE) ──────────────────── */
        (() => {
          const currentMembersCount = 1 + (existingTeam.members?.length || 0);
          const isSubmitted = existingTeam.submissionStatus === "submitted";
          const isLead = userRole === "lead";
          // The API rejects roster changes once submitted or after the deadline
          const canManage = !isSubmitted && !isRegistrationClosed;
          const teamNotes = [
            existingTeam.isOnSpot && "On-spot registration",
            existingTeam.checkedIn && "Checked in",
          ].filter(Boolean);

          return (
            <div className="space-y-5 animate-fadeIn">
              {/* Team Card */}
              <div className={teamCardClass}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-white/45">Your team</p>
                      <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
                        {existingTeam.teamName}
                      </h3>
                      {teamNotes.length > 0 && (
                        <p className="mt-1 text-sm text-white/50">{teamNotes.join(" · ")}</p>
                      )}
                    </div>
                    <TeamStatusBadge
                      status={existingTeam.submissionStatus}
                      memberCount={currentMembersCount}
                      minMembers={minMembers}
                      isClosed={isRegistrationClosed}
                    />
                  </div>

                  <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <dt className={detailLabelClass}>
                        <KeyRound size={14} className="text-pink-300" />
                        Invite code
                      </dt>
                      <dd className="mt-1 flex items-center gap-1">
                        <span className="font-mono text-base font-medium tracking-wide text-pink-300">
                          {existingTeam.teamCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(existingTeam.teamCode)}
                          className="cursor-pointer rounded-md p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Copy invite code"
                          title="Copy invite code"
                        >
                          {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt className={detailLabelClass}>
                        <UserRound size={14} className="text-violet-300" />
                        Role
                      </dt>
                      <dd className="mt-1 text-sm text-white">{isLead ? "Leader" : "Member"}</dd>
                    </div>
                    <div>
                      <dt className={detailLabelClass}>
                        <Users size={14} className="text-sky-300" />
                        Members
                      </dt>
                      <dd className="mt-1 text-sm tabular-nums text-white">
                        {currentMembersCount} / {maxMembers}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-4 text-xs text-white/45">
                    {isSubmitted
                      ? "Roster locked. No new members can join."
                      : isRegistrationClosed
                        ? "Deadline passed. Roster locked."
                        : "Share the invite code so teammates can join."}
                  </p>

                  {actionError && <Notice tone="error" className="mt-4">{actionError}</Notice>}
                  {actionSuccess && <Notice tone="success" className="mt-4">{actionSuccess}</Notice>}

                  {/* Inline Team Rename (Leader) */}
                  {isEditingTeam && (
                    <form
                      onSubmit={handleEditTeamSubmit}
                      className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end animate-fadeIn"
                    >
                      <label className="block flex-1">
                        <span className="mb-1.5 block text-xs text-white/55">Team name</span>
                        <input
                          type="text"
                          required
                          value={editTeamForm.teamName}
                          onChange={(e) => setEditTeamForm((p) => ({ ...p, teamName: e.target.value }))}
                          className={inputClass}
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsEditingTeam(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="brand" loading={actionLoading}>
                          Save
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Team Actions */}
                {canManage && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareWhatsApp(existingTeam.teamCode, existingTeam.teamName)}
                      >
                        <Share2 />
                        Share invite
                      </Button>
                      {isLead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingTeam(!isEditingTeam);
                            setActionError(null);
                          }}
                        >
                          <Edit3 />
                          Rename
                        </Button>
                      )}
                      <Button
                        variant="destructive-outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={isLead ? handleDeleteTeam : handleLeaveTeam}
                      >
                        {isLead ? <Trash2 /> : <LogOut />}
                        {isLead ? "Disband" : "Leave team"}
                      </Button>
                    </div>
                    {isLead && (
                      <Button variant="brand" size="sm" onClick={openSubmissionModal}>
                        <Send />
                        Submit team
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Official Auditorium Entry & Check-In QR Pass */}
              {isSubmitted && (
                <AuditoriumPassQR
                  team={existingTeam}
                  currentUserEmail={session?.user?.email || ""}
                  eventName={event.title}
                  venue={event.venue || "SV Auditorium"}
                  date={event.date}
                />
              )}

              {/* Team Roster */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <h4 className="mb-4 text-sm font-semibold text-white">Roster</h4>
                <TeamRoster
                  lead={existingTeam.lead}
                  members={existingTeam.members}
                  currentUserEmail={session?.user?.email || ""}
                  canRemove={isLead && canManage}
                  disabled={actionLoading}
                  onRemove={handleRemoveMember}
                />
              </div>
            </div>
          );
        })()
      ) : isRegistrationClosed ? (
        /* ── STATE: REGISTRATION CLOSED (STUDENT HAS NO TEAM) ─────────────── */
        <div className="mx-auto max-w-sm space-y-2 py-10 text-center animate-fadeIn">
          <h3 className="text-lg font-semibold text-white">Registration closed</h3>
          <p className="text-sm text-white/55">
            {countdown.hasDeadline
              ? `The deadline was ${countdown.formattedDeadline}.`
              : "New teams and joins are no longer accepted."}
          </p>
          <p className="pt-2 text-xs text-white/45">
            Already on a team? Sign in with the email you registered with.
          </p>
        </div>
      ) : mode === "select" ? (
        /* ── STATE 4: THE DUAL CHOICE (CREATE TEAM vs JOIN TEAM) ───────────── */
        <div className="space-y-5 animate-fadeIn">
          {isOnSpotLive && (
            <Notice tone="warning">
              On-spot registration is live. Create or join a team, then submit once it meets the minimum size.
            </Notice>
          )}

          <h3 className="text-lg font-semibold text-white">How do you want to participate?</h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode("create");
              }}
              className={choiceCardClass}
            >
              <span className="flex w-full items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-pink-300">
                  <PlusCircle size={18} />
                </span>
                <ArrowRight size={16} className="text-white/30 transition-colors group-hover:text-white/70" />
              </span>
              <span className="mt-4 block text-sm font-semibold text-white">Create a team</span>
              <span className="mt-1 block text-sm text-white/50">Lead a team and get an invite code.</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode("join");
              }}
              className={choiceCardClass}
            >
              <span className="flex w-full items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                  <KeyRound size={18} />
                </span>
                <ArrowRight size={16} className="text-white/30 transition-colors group-hover:text-white/70" />
              </span>
              <span className="mt-4 block text-sm font-semibold text-white">Join a team</span>
              <span className="mt-1 block text-sm text-white/50">Use an invite code from your leader.</span>
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

  // ── REGISTRATION CONFIRMATION DIALOG ───────────────────────────────────────
  const renderSubmissionModal = () => {
    if (!isSubmissionModalOpen || !existingTeam) return null;

    const currentMembersCount = 1 + (existingTeam.members?.length || 0);
    const meetsMinCriteria = currentMembersCount >= minMembers;
    const isActuallyConfirmed = existingTeam.submissionStatus === "submitted" && meetsMinCriteria;
    const missingCount = minMembers - currentMembersCount;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setIsSubmissionModalOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-team-title"
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121118] p-6 text-white font-sans shadow-2xl antialiased"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 id="submit-team-title" className="text-lg font-semibold text-white">
                {isActuallyConfirmed ? "Registration confirmed" : "Submit team"}
              </h3>
              <p className="mt-0.5 truncate text-sm text-white/50">{event.title}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsSubmissionModalOpen(false)}
              aria-label="Close"
            >
              <X />
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {isActuallyConfirmed ? (
              <Notice tone="success">{existingTeam.teamName} is registered for this event.</Notice>
            ) : !meetsMinCriteria ? (
              <>
                <Notice tone="warning">
                  Add {missingCount} more member{missingCount === 1 ? "" : "s"} before submitting.
                </Notice>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="text-xs text-white/45">Invite code</span>
                  <span className="flex items-center gap-1">
                    <span className="font-mono text-sm tracking-wide text-white">{existingTeam.teamCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(existingTeam.teamCode)}
                      className="cursor-pointer rounded-md p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Copy invite code"
                      title="Copy invite code"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </span>
                </div>
              </>
            ) : (
              <>
                <dl className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] text-sm">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-white/45">Team</dt>
                    <dd className="truncate text-white">{existingTeam.teamName}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-white/45">Members</dt>
                    <dd className="tabular-nums text-white">
                      {currentMembersCount} / {maxMembers}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-white/45">The roster locks once submitted.</p>
              </>
            )}

            {finalSubmitError && <Notice tone="error">{finalSubmitError}</Notice>}
            {finalSubmitSuccess && !isActuallyConfirmed && <Notice tone="success">{finalSubmitSuccess}</Notice>}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            {isRegistrationClosed && !isActuallyConfirmed && (
              <span className="mr-auto text-xs text-rose-300/90">Submissions are closed.</span>
            )}
            <Button variant="ghost" onClick={() => setIsSubmissionModalOpen(false)}>
              Close
            </Button>
            {meetsMinCriteria && !isActuallyConfirmed && userRole === "lead" && !isRegistrationClosed && (
              <Button variant="brand" loading={submittingFinal} onClick={() => handleFinalSubmit()}>
                Confirm submission
              </Button>
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
          className="relative w-full rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden text-white font-sans animate-fadeIn scroll-mt-28"
        >
          <div
            className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
            aria-hidden="true"
          />

          <div className="relative z-[2] flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Team registration</h2>
              <p className="mt-1 text-sm text-white/50">
                {minMembers}–{maxMembers} members per team
              </p>
            </div>

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
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-[#0c0a12] shadow-2xl text-white font-sans overflow-hidden">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">{event.title}</h2>
              <p className="mt-0.5 text-sm text-white/50">
                {minMembers}–{maxMembers} members per team
              </p>
            </div>

            {onClose && (
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                <X />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {renderWorkspaceContent()}
          </div>
        </div>
      </div>
      {renderSubmissionModal()}
    </>
  );
}

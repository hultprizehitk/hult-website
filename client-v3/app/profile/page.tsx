"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  LogOut,
  ArrowRight,
  Lock,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Edit3,
  Loader2,
  Trash2,
  QrCode,
  Building2,
  CalendarDays,
  Phone,
  Hash,
  KeyRound,
  UserRound,
  Users,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/layout/SiteHeader";
import GrainOverlay from "@/components/hero/GrainOverlay";
import EventHeroBackground from "@/components/events/EventHeroBackground";
import AuditoriumPassQR from "@/components/events/AuditoriumPassQR";
import TeamRoster from "@/components/events/TeamRoster";
import TeamStatusBadge from "@/components/events/TeamStatusBadge";
import Notice from "@/components/ui/Notice";
import { detailLabelClass, inputClass, teamCardClass } from "@/components/ui/styles";

interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
}

interface UserTeam {
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
  eventId?: {
    _id: string;
    title: string;
    tag?: string;
    date?: string;
    venue?: string;
    minTeamMembers?: number;
    maxTeamMembers?: number;
  };
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  department: string;
  year: string;
  phone?: string;
  roll?: string;
  role: string;
}

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activePassTeamId, setActivePassTeamId] = useState<string | null>(null);

  // Profile Edit State (Phone & Roll only)
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        department?: string;
        year?: string;
      }
    | undefined;

  const userEmail = user?.email?.toLowerCase().trim();
  const displayName = profile?.name || user?.name || user?.email || "";
  const profileDetails = [
    {
      label: "Department",
      icon: Building2,
      iconClass: "text-sky-300",
      value: profile?.department || user?.department,
      required: false,
    },
    {
      label: "Year",
      icon: CalendarDays,
      iconClass: "text-violet-300",
      value: profile?.year || user?.year,
      required: false,
    },
    {
      label: "Phone",
      icon: Phone,
      iconClass: "text-emerald-300",
      value: profile?.phone && /^\d{10}$/.test(profile.phone) ? profile.phone : "",
      required: true,
    },
    {
      label: "Roll number",
      icon: Hash,
      iconClass: "text-amber-300",
      value: profile?.roll && /^\d+$/.test(profile.roll) ? profile.roll : "",
      required: true,
    },
  ];

  // 1. Fetch Profile (Name, Phone, Roll, Department, Year)
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setProfile(data.user);
          setEditPhone(data.user.phone ? data.user.phone.replace(/\D/g, "").slice(0, 10) : "");
          setEditRoll(data.user.roll ? data.user.roll.replace(/\D/g, "") : "");
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [session?.user?.email]);

  // 2. Fetch User Teams
  const fetchTeams = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      setLoadingTeams(true);
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.teams)) {
          setTeams(data.teams);
        }
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoadingTeams(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
      fetchTeams();
    }
  }, [status, fetchProfile, fetchTeams]);

  // 3. Save Profile Details (Phone & Roll only)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const cleanPhone = editPhone.replace(/\D/g, "").trim();
    const cleanRoll = editRoll.replace(/\D/g, "").trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      setSaveError("Contact Phone must be a valid 10-digit number.");
      return;
    }

    if (!cleanRoll) {
      setSaveError("College Roll Number must contain numbers only.");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          roll: cleanRoll,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setProfile(data.user);
      setIsEditing(false);
      setSaveSuccess("Details saved.");
      fetchTeams();
      setTimeout(() => setSaveSuccess(null), 4500);
    } catch (err: unknown) {
      setSaveError((err as Error).message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleShareWhatsApp = (team: UserTeam) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const text = encodeURIComponent(
      `Join my Hult Prize team "${team.teamName}"!\n\n` +
        `Team Invite Code: ${team.teamCode}\n\n` +
        `Register and join our team here:\n${origin}/events`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Team Management State on Profile
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [teamActionLoading, setTeamActionLoading] = useState<string | null>(null);
  const [teamActionError, setTeamActionError] = useState<string | null>(null);
  const [teamActionSuccess, setTeamActionSuccess] = useState<string | null>(null);

  const handleStartEditTeam = (team: UserTeam) => {
    if (team.submissionStatus === "submitted") {
      setTeamActionError("Official team registration has already been submitted. The team name is permanently locked and cannot be changed.");
      return;
    }
    setEditingTeamId(team._id);
    setEditTeamName(team.teamName || "");
    setTeamActionError(null);
  };

  const handleSaveTeamEdit = async (teamId: string, e: React.FormEvent) => {
    e.preventDefault();
    const targetTeam = teams.find((t) => t._id === teamId);
    if (targetTeam?.submissionStatus === "submitted") {
      setTeamActionError("Official team registration has already been submitted. The team name is permanently locked.");
      return;
    }

    if (!editTeamName.trim()) {
      setTeamActionError("Team Name cannot be blank.");
      return;
    }

    setTeamActionLoading(teamId);
    setTeamActionError(null);
    setTeamActionSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          action: "edit_team",
          teamName: editTeamName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update team details.");
      }

      setEditingTeamId(null);
      setTeamActionSuccess("Team details updated successfully.");
      setTimeout(() => setTeamActionSuccess(null), 3500);
      await fetchTeams();
    } catch (err: unknown) {
      setTeamActionError((err as Error).message || "Failed to update team.");
    } finally {
      setTeamActionLoading(null);
    }
  };

  const handleRemoveMemberFromProfile = async (
    teamId: string,
    memberEmail: string,
    memberName: string
  ) => {
    if (!window.confirm(`Remove ${memberName} from this team roster?`)) return;

    setTeamActionLoading(`${teamId}_${memberEmail}`);
    setTeamActionError(null);
    setTeamActionSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          action: "remove_member",
          memberEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove member.");
      }

      setTeamActionSuccess(`${memberName} removed from team.`);
      setTimeout(() => setTeamActionSuccess(null), 3500);
      await fetchTeams();
    } catch (err: unknown) {
      setTeamActionError((err as Error).message || "Failed to remove member.");
    } finally {
      setTeamActionLoading(null);
    }
  };

  const handleLeaveTeamFromProfile = async (team: UserTeam) => {
    if (
      !window.confirm(
        `Are you sure you want to leave team "${team.teamName}"? You will be free to join or create another team.`
      )
    ) {
      return;
    }

    setTeamActionLoading(team._id);
    setTeamActionError(null);
    setTeamActionSuccess(null);

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team._id,
          action: "leave_team",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to leave team.");
      }

      setTeamActionSuccess(`You left team "${team.teamName}".`);
      setTimeout(() => setTeamActionSuccess(null), 3500);
      await fetchTeams();
    } catch (err: unknown) {
      setTeamActionError((err as Error).message || "Failed to leave team.");
    } finally {
      setTeamActionLoading(null);
    }
  };

  const handleDeleteTeamFromProfile = async (team: UserTeam) => {
    if (
      !window.confirm(
        `Disband and delete team "${team.teamName}"? All team members will be removed, and you can join or create another team.`
      )
    ) {
      return;
    }

    setTeamActionLoading(team._id);
    setTeamActionError(null);
    setTeamActionSuccess(null);

    try {
      const res = await fetch(`/api/teams?teamId=${team._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disband team.");
      }

      setTeamActionSuccess(`Team "${team.teamName}" was disbanded.`);
      setTimeout(() => setTeamActionSuccess(null), 3500);
      await fetchTeams();
    } catch (err: unknown) {
      setTeamActionError((err as Error).message || "Failed to disband team.");
    } finally {
      setTeamActionLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0c14] font-[family-name:var(--font-google-sans)] text-white selection:bg-white/90 selection:text-black flex flex-col justify-between">
      {/* Site-wide Kolkata hero background */}
      <EventHeroBackground />
      <GrainOverlay opacity={0.4} />

      <SiteHeader />

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-12">
        <div className="w-full max-w-2xl md:max-w-3xl animate-fadeIn">
          {status === "loading" || loadingProfile ? (
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-black/55 p-12 shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 size={20} className="animate-spin text-white/60" />
                <p className="text-sm text-white/50">Loading profile</p>
              </div>
            </div>
          ) : status === "authenticated" && user ? (
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-black/55 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
              {/* Glass Top Specular Highlight */}
              <div
                className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
                aria-hidden="true"
              />

              <div className="relative z-[2]">
                {/* Identity */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar name={displayName} size="lg" />
                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {displayName}
                      </h1>
                      <p className="truncate text-sm text-white/50">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setSaveError(null);
                    }}
                  >
                    <Edit3 />
                    {isEditing ? "Cancel" : "Edit details"}
                  </Button>
                </div>

                {saveSuccess && <Notice tone="success" className="mt-6">{saveSuccess}</Notice>}
                {saveError && <Notice tone="error" className="mt-6">{saveError}</Notice>}

                {/* Inline Profile Edit Form (Phone & Roll only) */}
                {isEditing && (
                  <form
                    onSubmit={handleSaveProfile}
                    className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-fadeIn"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs text-white/55">Phone</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          required
                          placeholder="10-digit mobile number"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs text-white/55">Roll number</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          placeholder="e.g. 2152001"
                          value={editRoll}
                          onChange={(e) => setEditRoll(e.target.value.replace(/\D/g, ""))}
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="brand" size="sm" loading={savingProfile}>
                        Save
                      </Button>
                    </div>
                  </form>
                )}

                {/* Academic & Contact Details */}
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4">
                  {profileDetails.map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className={detailLabelClass}>
                        <item.icon size={14} className={item.iconClass} />
                        {item.label}
                      </dt>
                      <dd
                        className={`mt-1 break-words text-sm font-medium tabular-nums ${
                          item.value ? "text-white" : item.required ? "text-amber-300/90" : "text-white/40"
                        }`}
                      >
                        {item.value || (item.required ? "Required" : "Not set")}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Event Teams */}
                <section className="mt-10">
                  <h2 className="mb-4 text-base font-semibold text-white">Teams</h2>

                  {teamActionError && <Notice tone="error" className="mb-4">{teamActionError}</Notice>}
                  {teamActionSuccess && <Notice tone="success" className="mb-4">{teamActionSuccess}</Notice>}

                  {loadingTeams ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/50">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading teams</span>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
                      <p className="text-sm text-white/60">You are not on a team yet.</p>
                      <Button asChild variant="brand" size="sm" className="mt-4">
                        <Link href="/events">
                          Browse events
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teams.map((t) => {
                        const isLead =
                          t.leadEmail?.toLowerCase() === userEmail ||
                          t.lead?.email?.toLowerCase() === userEmail;
                        const isCopied = copiedCode === t.teamCode;
                        const isSubmitted = t.submissionStatus === "submitted";
                        const isPassOpen = activePassTeamId === t._id;
                        const memberCount = 1 + (t.members?.length || 0);

                        return (
                          <article
                            key={t._id}
                            className={teamCardClass}
                          >
                            <div className="p-5 sm:p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="truncate text-xs text-white/50">
                                    {t.eventId?.title || "Hult Prize"}
                                  </p>
                                  <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">
                                    {t.teamName}
                                  </h3>
                                  {t.pitchDeckUrl && (
                                    <a
                                      href={t.pitchDeckUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-1 inline-flex items-center gap-1 text-xs text-white/55 transition-colors hover:text-white"
                                    >
                                      Pitch deck
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                                <TeamStatusBadge
                                  status={t.submissionStatus}
                                  memberCount={memberCount}
                                  minMembers={t.eventId?.minTeamMembers || 3}
                                />
                              </div>

                              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <div className="col-span-2 min-w-0 sm:col-span-1">
                                  <dt className={detailLabelClass}>
                                    <KeyRound size={14} className="text-pink-300" />
                                    Invite code
                                  </dt>
                                  <dd className="mt-1 flex items-center gap-1">
                                    <span className="font-mono text-sm font-medium tracking-wide text-pink-300">
                                      {t.teamCode}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyCode(t.teamCode)}
                                      className="cursor-pointer rounded-md p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                                      aria-label="Copy invite code"
                                      title="Copy invite code"
                                    >
                                      {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
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
                                    {memberCount} / {t.eventId?.maxTeamMembers || 5}
                                  </dd>
                                </div>
                              </dl>

                              {/* Inline Team Rename (Leader, before submission) */}
                              {editingTeamId === t._id && (
                                <form
                                  onSubmit={(e) => handleSaveTeamEdit(t._id, e)}
                                  className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end animate-fadeIn"
                                >
                                  <label className="block flex-1">
                                    <span className="mb-1.5 block text-xs text-white/55">Team name</span>
                                    <input
                                      type="text"
                                      required
                                      value={editTeamName}
                                      onChange={(e) => setEditTeamName(e.target.value)}
                                      className={inputClass}
                                    />
                                  </label>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setEditingTeamId(null)}>
                                      Cancel
                                    </Button>
                                    <Button type="submit" variant="brand" loading={teamActionLoading === t._id}>
                                      Save
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </div>

                            {/* Roster */}
                            <TeamRoster
                              className="border-t border-white/10 px-5 py-4 sm:px-6"
                              lead={{ ...t.lead, email: t.lead?.email || t.leadEmail }}
                              members={t.members}
                              currentUserEmail={userEmail}
                              canRemove={isLead && !isSubmitted}
                              isRemoving={(email) => teamActionLoading === `${t._id}_${email}`}
                              onRemove={(email, name) => handleRemoveMemberFromProfile(t._id, email, name)}
                            />

                            {/* Team Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 sm:px-6">
                              <div className="flex flex-wrap items-center gap-2">
                                {isSubmitted ? (
                                  <Button
                                    variant={isPassOpen ? "outline" : "brand"}
                                    size="sm"
                                    onClick={() => setActivePassTeamId(isPassOpen ? null : t._id)}
                                  >
                                    <QrCode />
                                    {isPassOpen ? "Hide pass" : "Auditorium pass"}
                                  </Button>
                                ) : (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleShareWhatsApp(t)}>
                                      <Share2 />
                                      Share invite
                                    </Button>
                                    {isLead ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            editingTeamId === t._id ? setEditingTeamId(null) : handleStartEditTeam(t)
                                          }
                                        >
                                          <Edit3 />
                                          Rename
                                        </Button>
                                        <Button
                                          variant="destructive-outline"
                                          size="sm"
                                          loading={teamActionLoading === t._id && editingTeamId !== t._id}
                                          onClick={() => handleDeleteTeamFromProfile(t)}
                                        >
                                          <Trash2 />
                                          Disband
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="destructive-outline"
                                        size="sm"
                                        loading={teamActionLoading === t._id}
                                        onClick={() => handleLeaveTeamFromProfile(t)}
                                      >
                                        <LogOut />
                                        Leave team
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>

                              <Link
                                href={`/events?event=${t.eventId?._id || t.eventId}`}
                                className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
                              >
                                Open event
                                <ArrowRight size={14} />
                              </Link>
                            </div>

                            {/* Auditorium Entry Pass & QR */}
                            {isSubmitted && isPassOpen && (
                              <div className="border-t border-white/10 p-5 sm:p-6 animate-fadeIn">
                                <AuditoriumPassQR
                                  team={t}
                                  currentUserEmail={session?.user?.email || ""}
                                  eventName={t.eventId?.title || "HULT ASCEND : The Rise Begins"}
                                  venue={t.eventId?.venue || "SV Auditorium"}
                                  date={t.eventId?.date}
                                />
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Footer Navigation */}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                  <nav className="-ml-2.5 flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/">Home</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/events">Events</Link>
                    </Button>
                  </nav>
                  <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/register" })}>
                    <LogOut />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────
               UNAUTHENTICATED VIEW MATCHING REGISTER PAGE STYLE
               ──────────────────────────────────────────────────────── */
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-black/55 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-center">
              <div
                className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
                aria-hidden="true"
              />

              <div className="relative z-[2]">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl">
                  <Lock className="h-7 w-7 text-white/60" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Student Login Required
                </h2>
                <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed mb-6">
                  Please sign in with your official @heritageit.edu.in account to view your student profile and digital pass.
                </p>

                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/profile" })}
                  className="w-full flex items-center justify-center gap-3.5 rounded-2xl bg-white hover:bg-neutral-100 py-4 px-6 text-sm font-bold text-neutral-950 shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <span>Sign in with Google (HITK Account)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-md">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-white/90 mb-1">
                        Domain Restricted Access
                      </span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        This competition platform is restricted strictly to verified Heritage Institute
                        students. Only college accounts ending in{" "}
                        <strong className="text-rose-300">@heritageit.edu.in</strong> are authorized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-5 text-center">
        <p className="text-[10px] sm:text-[11px] text-white/40 font-medium leading-relaxed">
          &copy; 2027 Hult Prize at Heritage Institute of Technology. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

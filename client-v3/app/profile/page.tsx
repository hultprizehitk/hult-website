"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  CheckCircle2,
  Building,
  Calendar,
  Award,
  LogOut,
  ArrowRight,
  Lock,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Phone,
  GraduationCap,
  Edit3,
  Loader2,
  Trash2,
  UserMinus,
} from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import GrainOverlay from "@/components/hero/GrainOverlay";
import KolkataHero from "@/components/hero/KolkataHero";

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

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
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
          setEditName(data.user.name || user?.name || "");
          setEditPhone(data.user.phone ? data.user.phone.replace(/\D/g, "").slice(0, 10) : "");
          setEditRoll(data.user.roll ? data.user.roll.replace(/\D/g, "") : "");
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [session?.user?.email, user?.name]);

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

  // 3. Save Profile Details (Name, Phone & Roll)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const cleanName = editName.trim();
    const cleanPhone = editPhone.replace(/\D/g, "").trim();
    const cleanRoll = editRoll.replace(/\D/g, "").trim();

    if (!cleanName) {
      setSaveError("Please enter your Full Name.");
      return;
    }

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
          name: cleanName,
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
      setSaveSuccess("Profile details saved successfully!");
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
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-white/90 selection:text-black flex flex-col justify-between">
      {/* Kolkata skyline scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <KolkataHero
          mouseOffset={{ x: 0, y: 0 }}
          isRevealed={true}
          hideText={true}
          hideForeground={true}
        />
      </div>
      <GrainOverlay opacity={0.65} />

      <SiteHeader />

      {/* Main Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-10">
        <div className="w-full max-w-xl sm:max-w-2xl">
          {/* Glassmorphic Inside-Event Style Card */}
          <article className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden text-center">
            {/* Top specular highlight matching EventInsideView */}
            <div
              className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
              aria-hidden="true"
            />

            <div className="relative z-[2]">
              {status === "loading" || loadingProfile ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                  <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <p className="text-xs font-medium text-white/60 uppercase tracking-widest font-mono">
                    Verifying Scholar Credentials...
                  </p>
                </div>
              ) : status === "authenticated" && user ? (
                <div className="py-1 animate-fadeIn">
                  {/* Student Name with Edit Affordance */}
                  <div className="inline-flex items-center justify-center gap-2.5 mb-1 group">
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]">
                      {profile?.name || user.name}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setSaveError(null);
                      }}
                      className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="Edit Name and Details"
                      aria-label="Edit Name and Details"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 mb-6 font-mono font-medium">
                    {user.email}
                  </p>

                  {/* Success Alert */}
                  {saveSuccess && (
                    <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-400/50 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fadeIn font-mono">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{saveSuccess}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400/80">Synced with Events</span>
                    </div>
                  )}

                  {/* Section Title & Edit Button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                      Student Academic &amp; Contact Info
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setSaveError(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 size={11} className="text-rose-300" />
                      <span>{isEditing ? "Close Editor" : "Edit Details"}</span>
                    </button>
                  </div>

                  {/* Inline Editing Form */}
                  {isEditing && (
                    <form
                      onSubmit={handleSaveProfile}
                      className="bg-white/5 border border-white/15 rounded-2xl p-5 mb-6 text-left animate-fadeIn space-y-4 shadow-xl"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                          <Edit3 size={13} className="text-rose-300" />
                          <span>Update Scholar Profile &amp; Contact Info</span>
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300">
                          Auto-locks in events
                        </span>
                      </div>

                      {saveError && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                          <AlertCircle size={13} className="text-rose-400 shrink-0" />
                          <span>{saveError}</span>
                        </div>
                      )}

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Your full name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-white/10 px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-white/40 text-xs sm:text-sm font-sans transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                              Contact Phone (10 Digits) *
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={10}
                              required
                              placeholder="10-digit mobile number"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-white/10 px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-white/40 text-xs sm:text-sm font-mono transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                              College Roll No. (Numbers Only) *
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              required
                              placeholder="e.g. 2152001"
                              value={editRoll}
                              onChange={(e) => setEditRoll(e.target.value.replace(/\D/g, ""))}
                              className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-white/10 px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-white/40 text-xs sm:text-sm font-mono transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-white/50 font-mono">
                        Profile details sync automatically across all registered event teams.
                      </p>

                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="px-5 py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check size={12} />
                              <span>Save Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Student Digital ID Bento Grid matching EventInsideView Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                    {/* Department Tile */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1 shadow-md hover:bg-white/[0.08] transition-all">
                      <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                        <Building size={13} className="text-rose-300/90 shrink-0" />
                        <span>Department</span>
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {profile?.department || user?.department || "General Engineering"}
                      </span>
                    </div>

                    {/* Academic Year Tile */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1 shadow-md hover:bg-white/[0.08] transition-all">
                      <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                        <Calendar size={13} className="text-rose-300/90 shrink-0" />
                        <span>Academic Year</span>
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {profile?.year || user?.year || "3rd Year"}
                      </span>
                    </div>

                    {/* Contact Phone Tile */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1 shadow-md hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                          <Phone size={13} className="text-rose-300/90 shrink-0" />
                          <span>Contact Phone</span>
                        </span>
                        {profile?.phone && /^\d{10}$/.test(profile.phone) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                            <Check size={9} />
                            <span>Saved</span>
                          </span>
                        ) : profile?.phone && !/^\d+$/.test(profile.phone) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-rose-300 bg-rose-950/40 border border-rose-400/40 px-2 py-0.5 rounded-full">
                            <span>Numbers Only</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-400/40 px-2 py-0.5 rounded-full">
                            <span>Required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-white font-mono">
                        {profile?.phone ? (
                          /^\d+$/.test(profile.phone) ? (
                            profile.phone
                          ) : (
                            <span className="text-rose-300/90 italic font-mono text-xs">
                              {profile.phone} (Please update to digits only)
                            </span>
                          )
                        ) : (
                          <span className="text-white/40 italic font-sans">Not configured</span>
                        )}
                      </span>
                    </div>

                    {/* College Roll No. Tile */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1 shadow-md hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                          <GraduationCap size={13} className="text-rose-300/90 shrink-0" />
                          <span>College Roll No.</span>
                        </span>
                        {profile?.roll && /^\d+$/.test(profile.roll) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                            <Check size={9} />
                            <span>Saved</span>
                          </span>
                        ) : profile?.roll && !/^\d+$/.test(profile.roll) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-rose-300 bg-rose-950/40 border border-rose-400/40 px-2 py-0.5 rounded-full">
                            <span>Numbers Only</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-400/40 px-2 py-0.5 rounded-full">
                            <span>Required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-white font-mono">
                        {profile?.roll ? (
                          /^\d+$/.test(profile.roll) ? (
                            profile.roll
                          ) : (
                            <span className="text-rose-300/90 italic font-mono text-xs">
                              {profile.roll} (Please update to digits only)
                            </span>
                          )
                        ) : (
                          <span className="text-white/40 italic font-sans">Not configured</span>
                        )}
                      </span>
                    </div>

                    {/* Campus Affiliation Tile */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-2 flex-wrap sm:col-span-2 shadow-md">
                      <div>
                        <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 mb-0.5">
                          <Award size={13} className="text-rose-300/90 shrink-0" />
                          <span>Campus Affiliation</span>
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          Heritage Institute of Technology, Kolkata
                        </span>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white/80 font-mono">
                        Hult Prize 2027
                      </span>
                    </div>
                  </div>

                  {/* My Event Teams Section */}
                  <div className="w-full text-left mb-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                        <Users size={13} className="text-rose-300" />
                        <span>Event Teams &amp; Registrations</span>
                      </span>
                      {teams.length > 0 && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white/80 font-mono">
                          {teams.length} {teams.length === 1 ? "Team" : "Teams"}
                        </span>
                      )}
                    </div>

                    {/* Team Action Feedback Alerts */}
                    {teamActionError && (
                      <div className="mb-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn font-mono">
                        <AlertCircle size={13} className="text-rose-400 shrink-0" />
                        <span>{teamActionError}</span>
                      </div>
                    )}
                    {teamActionSuccess && (
                      <div className="mb-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-400/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn font-mono">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>{teamActionSuccess}</span>
                      </div>
                    )}

                    {loadingTeams ? (
                      <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-6 text-center shadow-md backdrop-blur-md">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                          Syncing your teams...
                        </span>
                      </div>
                    ) : teams.length === 0 ? (
                      <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-6 text-center flex flex-col items-center gap-3 shadow-md backdrop-blur-md">
                        <p className="text-xs text-white/70 font-sans">
                          You have not registered or joined any teams for active events yet.
                        </p>
                        <Link
                          href="/events"
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-105"
                        >
                          <Sparkles size={12} className="text-rose-300" />
                          <span>Explore Events &amp; Form Team</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5">
                        {teams.map((t) => {
                          const isLead =
                            t.leadEmail?.toLowerCase() === userEmail ||
                            t.lead?.email?.toLowerCase() === userEmail;
                          const isCopied = copiedCode === t.teamCode;

                          return (
                            <div
                              key={t._id}
                              className="bg-white/[0.04] border border-white/15 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-lg hover:bg-white/[0.06] hover:border-white/25 backdrop-blur-md transition-all text-left"
                            >
                              {/* Card Top Row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-serif text-sm sm:text-base font-bold text-white truncate max-w-[240px]">
                                  {t.eventId?.title || "Hult Prize Competition"}
                                </span>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {t.submissionStatus === "submitted" ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/90">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                      <span>Submitted</span>
                                    </span>
                                  ) : (1 + (t.members?.length || 0)) >=
                                    (t.eventId?.minTeamMembers || 3) ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/90">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      <span>Criteria Met</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/80">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                                      <span>
                                        Forming ({1 + (t.members?.length || 0)}/
                                        {t.eventId?.minTeamMembers || 3} Min)
                                      </span>
                                    </span>
                                  )}

                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 border border-white/15 text-white/90">
                                    {isLead ? (
                                      <>
                                        <ShieldCheck size={11} className="text-[#f20089]" />
                                        <span>Leader</span>
                                      </>
                                    ) : (
                                      <>
                                        <Users size={11} className="text-white/60" />
                                        <span>Member</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Team Name */}
                              <div>
                                <h4 className="text-base font-bold text-white font-serif tracking-tight">
                                  {t.teamName}
                                </h4>
                                {t.pitchDeckUrl && (
                                  <div className="mt-1.5">
                                    <a
                                      href={t.pitchDeckUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:underline font-mono"
                                    >
                                      <ExternalLink size={12} />
                                      <span>View Pitch Deck Link</span>
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Team Code Bar */}
                              <div className="bg-black/40 border border-white/15 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                  <span className="block text-[9px] font-mono uppercase font-bold tracking-widest text-white/50">
                                    Team Invite Code
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-base font-extrabold text-[#f20089] tracking-widest">
                                      {t.teamCode}
                                    </span>
                                    {t.submissionStatus === "submitted" && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                                        <Lock size={9} />
                                        <span>Roster Locked</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(t.teamCode)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition-all cursor-pointer"
                                    title="Copy invite code"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check size={12} className="text-emerald-400" />
                                        <span className="text-emerald-300">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>

                                  {t.submissionStatus !== "submitted" && (
                                    <button
                                      type="button"
                                      onClick={() => handleShareWhatsApp(t)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition-all cursor-pointer"
                                      title="Share invite code via WhatsApp"
                                    >
                                      <Share2 size={12} />
                                      <span>Share</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Team Management Action Row */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isLead ? (
                                    t.submissionStatus !== "submitted" ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            editingTeamId === t._id
                                              ? setEditingTeamId(null)
                                              : handleStartEditTeam(t)
                                          }
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white/90 hover:text-white transition-all cursor-pointer font-mono"
                                        >
                                          <Edit3 size={11} className="text-white/70" />
                                          <span>{editingTeamId === t._id ? "Cancel" : "Edit Team"}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTeamFromProfile(t)}
                                          disabled={teamActionLoading === t._id}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 hover:border-rose-500/30 bg-white/5 hover:bg-rose-500/10 px-3 py-1.5 text-[11px] font-medium text-white/75 hover:text-rose-200 transition-all cursor-pointer font-mono disabled:opacity-50"
                                        >
                                          {teamActionLoading === t._id ? (
                                            <Loader2 size={11} className="animate-spin" />
                                          ) : (
                                            <Trash2 size={11} />
                                          )}
                                          <span>Disband Team</span>
                                        </button>
                                      </>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                        <Lock size={10} className="text-emerald-400" />
                                        <span>Team Finalized &amp; Locked</span>
                                      </span>
                                    )
                                  ) : (
                                    t.submissionStatus !== "submitted" ? (
                                      <button
                                        type="button"
                                        onClick={() => handleLeaveTeamFromProfile(t)}
                                        disabled={teamActionLoading === t._id}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 hover:border-rose-500/30 bg-white/5 hover:bg-rose-500/10 px-3 py-1.5 text-[11px] font-medium text-white/75 hover:text-rose-200 transition-all cursor-pointer font-mono disabled:opacity-50"
                                      >
                                        {teamActionLoading === t._id ? (
                                          <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                          <LogOut size={11} />
                                        )}
                                        <span>Leave Team</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                        <Lock size={10} className="text-emerald-400" />
                                        <span>Roster Finalized</span>
                                      </span>
                                    )
                                  )}
                                </div>

                                <Link
                                  href={`/events?event=${t.eventId?._id || t.eventId}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-white/60 hover:text-white transition-colors"
                                >
                                  <span>Go to Event</span>
                                  <ArrowRight size={11} />
                                </Link>
                              </div>

                              {/* Inline Edit Form when editingTeamId === t._id */}
                              {editingTeamId === t._id && (
                                <form
                                  onSubmit={(e) => handleSaveTeamEdit(t._id, e)}
                                  className="bg-black/40 border border-white/15 rounded-xl p-3.5 space-y-3 animate-fadeIn text-left backdrop-blur-md"
                                >
                                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                                      <Edit3 size={11} className="text-rose-300" />
                                      <span>Edit Team Details</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-rose-300">Leader Edit</span>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/70 mb-1 font-bold">
                                      Team Name *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={editTeamName}
                                      onChange={(e) => setEditTeamName(e.target.value)}
                                      className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none transition-all font-sans"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTeamId(null)}
                                      className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-white/70 hover:text-white transition-all cursor-pointer font-mono"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={teamActionLoading === t._id}
                                      className="rounded-full bg-white text-black hover:bg-neutral-200 font-bold px-3.5 py-1 text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 disabled:opacity-50 font-mono"
                                    >
                                      {teamActionLoading === t._id ? (
                                        <Loader2 size={11} className="animate-spin" />
                                      ) : (
                                        <Check size={11} />
                                      )}
                                      <span>Save</span>
                                    </button>
                                  </div>
                                </form>
                              )}

                              {/* Members Roster Summary */}
                              <div className="pt-3 border-t border-white/10 text-xs space-y-2">
                                <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-white/50">
                                  Full Roster ({1 + (t.members?.length || 0)} Students)
                                </span>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-white/80 text-[11px] p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span className="font-medium text-white">
                                        {t.lead?.name || t.leadEmail}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#f20089]/20 text-[#f20089] border border-[#f20089]/30 uppercase">
                                        Lead
                                      </span>
                                    </div>
                                    <span className="text-white/50 font-mono text-[10px]">
                                      {t.lead?.department || "General"}{" "}
                                      {t.lead?.roll ? `• Roll: ${t.lead.roll}` : ""}
                                      {t.lead?.phone ? ` • Tel: ${t.lead.phone}` : ""}
                                    </span>
                                  </div>
                                  {t.members &&
                                    t.members.map((m, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between text-white/70 text-[11px] gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/10 flex-wrap"
                                      >
                                        <div className="flex items-center gap-2 truncate min-w-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                          <span className="text-white/90 truncate">{m.name || m.email}</span>
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-white/70 border border-white/15 uppercase">
                                            Member
                                          </span>
                                          <span className="text-white/50 font-mono text-[10px] ml-1 truncate hidden sm:inline">
                                            {m.department || "General"}{" "}
                                            {m.roll ? `• Roll: ${m.roll}` : ""}
                                            {m.phone ? ` • Tel: ${m.phone}` : ""}
                                          </span>
                                        </div>

                                        {isLead && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveMemberFromProfile(
                                                t._id,
                                                m.email,
                                                m.name || m.email
                                              )
                                            }
                                            disabled={teamActionLoading === `${t._id}_${m.email}`}
                                            className="inline-flex items-center gap-1 text-[10px] font-mono text-white/60 hover:text-rose-300 bg-white/[0.04] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                            title={`Remove ${m.name || m.email} from team`}
                                          >
                                            {teamActionLoading === `${t._id}_${m.email}` ? (
                                              <Loader2 size={10} className="animate-spin" />
                                            ) : (
                                              <UserMinus size={10} />
                                            )}
                                            <span>Remove</span>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Row matching EventInsideView */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4 border-t border-white/10">
                    <Link
                      href="/"
                      className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-lg text-center font-[family-name:var(--font-google-sans)]"
                    >
                      Homepage
                    </Link>
                    <Link
                      href="/events"
                      className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-lg text-center font-[family-name:var(--font-google-sans)]"
                    >
                      View Events
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/register" })}
                      className="rounded-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-400/40 px-5 py-2.5 text-xs font-semibold text-rose-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 font-[family-name:var(--font-google-sans)]"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated View matching EventInsideView styling */
                <div className="py-8 flex flex-col items-center gap-5">
                  <div className="h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                    <Lock className="h-7 w-7 text-white/50" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
                      Student Login Required
                    </h3>
                    <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                      Please sign in with your official @heritageit.edu.in account to view your digital pass and student credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/profile" })}
                    className="rounded-full bg-white hover:bg-neutral-100 text-neutral-950 px-6 py-2.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-xl font-[family-name:var(--font-google-sans)]"
                  >
                    <span>Sign in with Google</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/40 font-mono">
        © 2026-2027 Hult Prize at Heritage Institute of Technology
      </footer>
    </div>
  );
}

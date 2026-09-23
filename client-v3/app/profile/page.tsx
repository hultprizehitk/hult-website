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

  // 1. Fetch Profile (Phone, Roll, Department, Year)
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setProfile(data.user);
          setEditPhone(data.user.phone || "");
          setEditRoll(data.user.roll || "");
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

  // 3. Save Profile Details (Phone & Roll)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const cleanPhone = editPhone.trim();
    const cleanRoll = editRoll.trim();

    if (!cleanPhone) {
      setSaveError("Please enter your Contact Phone number.");
      return;
    }

    if (!cleanRoll) {
      setSaveError("Please enter your College Roll Number.");
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
      setSaveSuccess("Contact details & Roll No. saved successfully!");
      // Re-fetch teams to reflect updated phone & roll
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

      <SiteHeader transparent theme="light" />

      {/* Main Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-10">
        <div className="w-full max-w-xl sm:max-w-2xl">
          {/* Glassmorphic ID Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#0a0812]/92 p-6 sm:p-10 md:p-12 shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl text-center">
            {/* Top Iridescent Accent Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#f20089]/70 to-transparent" />

            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#f20089]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />

            {status === "loading" || loadingProfile ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-[#f20089] animate-spin" />
                <p className="text-xs font-medium text-white/60 uppercase tracking-widest font-mono">
                  Verifying Scholar Credentials...
                </p>
              </div>
            ) : status === "authenticated" && user ? (
              <div className="relative z-10 py-1 animate-fadeIn font-sans">
                {/* Avatar with Glow Ring */}
                <div className="relative mx-auto mb-4 flex items-center justify-center gap-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-white/15 to-white/5 text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(242,0,137,0.25)] font-[family-name:var(--font-google-sans)] overflow-hidden backdrop-blur-xl">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt={user.name || "Student"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0) || "H"
                    )}
                  </div>
                </div>

                {/* Verified Student Pill */}
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono shadow-sm">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Verified HITK Student</span>
                  </div>
                </div>

                {/* Student Name */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] tracking-tight mb-1">
                  {user.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mb-6 font-mono font-medium tracking-tight">
                  {user.email}
                </p>

                {/* Success Alert Banner */}
                {saveSuccess && (
                  <div className="mb-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fadeIn font-mono">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>{saveSuccess}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80">Synced with Events</span>
                  </div>
                )}

                {/* Student Credentials Header & Edit Toggle */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400">
                    Student Academic &amp; Contact Info
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setSaveError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1.5 rounded-full transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
                  >
                    <Edit3 size={11} className="text-[#f20089]" />
                    <span>{isEditing ? "Close Editor" : "Edit Details"}</span>
                  </button>
                </div>

                {/* Inline Editing Form */}
                {isEditing && (
                  <form
                    onSubmit={handleSaveProfile}
                    className="rounded-2xl border border-[#f20089]/40 bg-[#150a1e]/90 p-5 mb-6 text-left animate-fadeIn space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white font-[family-name:var(--font-google-sans)] flex items-center gap-1.5">
                        <Edit3 size={13} className="text-[#f20089]" />
                        <span>Update Contact Phone &amp; College Roll No.</span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-mono transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-white/70 font-bold mb-1.5">
                          College Roll No. *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2152001"
                          value={editRoll}
                          onChange={(e) => setEditRoll(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.1] px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-[#f20089] text-xs sm:text-sm font-mono transition-all"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                      Your saved contact phone and college roll number are used directly in all event registrations. Once saved, they are locked inside event forms and can only be updated from this profile.
                    </p>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-5 py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)] inline-flex items-center gap-1.5"
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

                {/* Student Digital ID Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                  {/* Department Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-4.5 flex flex-col justify-between">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                        <Building size={12} className="text-[#f20089]" />
                        <span>Department</span>
                      </span>
                      <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                        {profile?.department || user?.department || "General Engineering"}
                      </span>
                    </div>
                  </div>

                  {/* Academic Year Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-4.5 flex flex-col justify-between">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                        <Calendar size={12} className="text-[#f20089]" />
                        <span>Academic Year</span>
                      </span>
                      <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                        {profile?.year || user?.year || "3rd Year"}
                      </span>
                    </div>
                  </div>

                  {/* Contact Phone Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-4.5 flex flex-col justify-between transition-all hover:border-white/20">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400">
                          <Phone size={12} className="text-[#f20089]" />
                          <span>Contact Phone</span>
                        </span>
                        {profile?.phone ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check size={10} />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <span>Required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold font-mono text-white block leading-snug">
                        {profile?.phone || (
                          <span className="text-white/40 italic font-sans text-xs">
                            Not configured
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* College Roll No. Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-4.5 flex flex-col justify-between transition-all hover:border-white/20">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400">
                          <GraduationCap size={12} className="text-[#f20089]" />
                          <span>College Roll No.</span>
                        </span>
                        {profile?.roll ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check size={10} />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <span>Required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold font-mono text-white block leading-snug">
                        {profile?.roll || (
                          <span className="text-white/40 italic font-sans text-xs">
                            Not configured
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Campus Affiliation */}
                  <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-4.5 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-0.5">
                          <Award size={12} className="text-[#f20089]" />
                          <span>Campus Affiliation</span>
                        </span>
                        <span className="text-xs font-semibold text-white">
                          Heritage Institute of Technology, Kolkata
                        </span>
                      </div>
                      <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-mono font-bold text-zinc-200">
                        Hult Prize 2027
                      </span>
                    </div>
                  </div>
                </div>

                {/* My Event Teams Section */}
                <div className="w-full text-left mb-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-2 text-xs font-mono uppercase font-bold tracking-widest text-zinc-300">
                      <Users size={14} className="text-[#f20089]" />
                      <span>Event Teams &amp; Registrations</span>
                    </span>
                    {teams.length > 0 && (
                      <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white">
                        {teams.length} {teams.length === 1 ? "Team" : "Teams"}
                      </span>
                    )}
                  </div>

                  {loadingTeams ? (
                    <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-6 text-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-[#f20089] rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                        Syncing your teams...
                      </span>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#121018]/90 p-5 text-center flex flex-col items-center gap-3">
                      <p className="text-xs text-zinc-400 font-sans">
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
                    <div className="flex flex-col gap-3">
                      {teams.map((t) => {
                        const isLead =
                          t.leadEmail?.toLowerCase() === userEmail ||
                          t.lead?.email?.toLowerCase() === userEmail;
                        const isCopied = copiedCode === t.teamCode;

                        return (
                          <div
                            key={t._id}
                            className="rounded-2xl border border-white/10 bg-[#121018]/90 p-4.5 sm:p-5 flex flex-col gap-3.5 transition-all hover:border-white/25 shadow-lg"
                          >
                            {/* Card Top Row */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate max-w-[240px]">
                                {t.eventId?.title || "Hult Prize Competition"}
                              </span>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {t.submissionStatus === "submitted" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-widest font-mono">
                                    <Sparkles size={11} />
                                    <span>Submitted</span>
                                  </span>
                                ) : (1 + (t.members?.length || 0)) >=
                                  (t.eventId?.minTeamMembers || 3) ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                                    <CheckCircle2 size={11} />
                                    <span>Criteria Met</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-widest font-mono">
                                    <AlertCircle size={11} />
                                    <span>
                                      Forming ({1 + (t.members?.length || 0)}/
                                      {t.eventId?.minTeamMembers || 3} Min)
                                    </span>
                                  </span>
                                )}

                                {isLead ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-widest font-mono">
                                    <ShieldCheck size={11} />
                                    <span>Leader</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-widest font-mono">
                                    <Users size={11} />
                                    <span>Member</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Team Name & Venture */}
                            <div>
                              <h4 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)]">
                                {t.teamName}
                              </h4>
                              {t.ventureName && (
                                <p className="text-xs text-zinc-300 mt-0.5">
                                  Track / Venture:{" "}
                                  <strong className="text-white">{t.ventureName}</strong>
                                </p>
                              )}
                              {t.ventureDescription && (
                                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed bg-[#0b0a12] border border-white/5 p-2 rounded-lg">
                                  {t.ventureDescription}
                                </p>
                              )}
                              {t.pitchDeckUrl && (
                                <div className="mt-1.5">
                                  <a
                                    href={t.pitchDeckUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-[#f20089] hover:underline font-mono"
                                  >
                                    <ExternalLink size={12} />
                                    <span>View Pitch Deck Link</span>
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Team Code Bar */}
                            <div className="rounded-xl border border-white/10 bg-black/60 p-3 flex items-center justify-between gap-2 flex-wrap">
                              <div>
                                <span className="block text-[9px] font-mono uppercase font-bold tracking-widest text-zinc-400">
                                  Team Invite Code
                                </span>
                                <span className="font-mono text-base font-extrabold text-[#f20089] tracking-wider">
                                  {t.teamCode}
                                </span>
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

                                <button
                                  type="button"
                                  onClick={() => handleShareWhatsApp(t)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition-all cursor-pointer"
                                  title="Share invite code via WhatsApp"
                                >
                                  <Share2 size={12} />
                                  <span>Share</span>
                                </button>
                              </div>
                            </div>

                            {/* Members Roster Summary */}
                            <div className="pt-2 border-t border-white/10 text-xs">
                              <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1.5">
                                Full Roster ({1 + (t.members?.length || 0)} Students)
                              </span>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-zinc-300 text-[11px]">
                                  <span className="font-medium text-white">
                                    {t.lead?.name || t.leadEmail} (Lead)
                                  </span>
                                  <span className="text-zinc-400 font-mono text-[10px]">
                                    {t.lead?.department || "General"}{" "}
                                    {t.lead?.roll ? `• Roll: ${t.lead.roll}` : ""}
                                    {t.lead?.phone ? ` • Tel: ${t.lead.phone}` : ""}
                                  </span>
                                </div>
                                {t.members &&
                                  t.members.map((m, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-zinc-400 text-[11px]"
                                    >
                                      <span>{m.name || m.email}</span>
                                      <span className="text-zinc-400 font-mono text-[10px]">
                                        {m.department || "Member"}{" "}
                                        {m.roll ? `• Roll: ${m.roll}` : ""}
                                        {m.phone ? ` • Tel: ${m.phone}` : ""}
                                      </span>
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

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2">
                  <Link
                    href="/"
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/15 px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center text-center shadow-md"
                  >
                    Homepage
                  </Link>
                  <Link
                    href="/events"
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/15 px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center text-center shadow-md"
                  >
                    View Events
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/register" })}
                    className="w-full rounded-2xl border border-rose-500/30 bg-rose-950/25 hover:bg-rose-900/40 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-300 transition-all cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center justify-center gap-1.5 text-center shadow-md"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Unauthenticated View */
              <div className="py-8 flex flex-col items-center gap-5">
                <div className="h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-white/50" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                    Student Login Required
                  </h3>
                  <p className="text-xs text-white/60 max-w-sm mx-auto">
                    Please sign in with your official @heritageit.edu.in account to view your digital pass and student credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/profile" })}
                  className="rounded-2xl bg-white hover:bg-neutral-100 text-neutral-950 px-6 py-3 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-xl font-[family-name:var(--font-google-sans)]"
                >
                  <span>Sign in with Google</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/40 font-mono">
        © 2026-2027 Hult Prize at Heritage Institute of Technology
      </footer>
    </div>
  );
}

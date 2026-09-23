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
                  {/* Avatar */}
                  <div className="relative mx-auto mb-3 flex items-center justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 text-3xl font-bold text-white shadow-lg overflow-hidden backdrop-blur-md">
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

                  {/* Status Badges Row matching EventInsideView */}
                  <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/40 border border-emerald-400/50 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verified HITK Student
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/30 text-white/90 font-mono">
                      Hult Prize 2027
                    </span>
                  </div>

                  {/* Student Name */}
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)] mb-1">
                    {user.name}
                  </h1>
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
                            className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-white/10 px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-white/40 text-xs sm:text-sm font-mono transition-all"
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
                            className="w-full rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 focus:bg-white/10 px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-white/40 text-xs sm:text-sm font-mono transition-all"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                        Your contact phone and college roll number are used directly in all event registrations. Once saved, they are locked inside event forms and can only be updated from this profile.
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
                        {profile?.phone ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                            <Check size={9} />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-400/40 px-2 py-0.5 rounded-full">
                            <span>Required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-white font-mono">
                        {profile?.phone || (
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
                        {profile?.roll ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                            <Check size={9} />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-400/40 px-2 py-0.5 rounded-full">
                            <span>Required</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-white font-mono">
                        {profile?.roll || (
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
                  <div className="w-full text-left mb-6 pt-3 border-t border-white/10">
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

                    {loadingTeams ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center shadow-md">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                          Syncing your teams...
                        </span>
                      </div>
                    ) : teams.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center gap-3 shadow-md">
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
                      <div className="flex flex-col gap-3">
                        {teams.map((t) => {
                          const isLead =
                            t.leadEmail?.toLowerCase() === userEmail ||
                            t.lead?.email?.toLowerCase() === userEmail;
                          const isCopied = copiedCode === t.teamCode;

                          return (
                            <div
                              key={t._id}
                              className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-md hover:bg-white/[0.07] transition-all text-left"
                            >
                              {/* Card Top Row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-serif text-sm sm:text-base font-bold text-white truncate max-w-[240px]">
                                  {t.eventId?.title || "Hult Prize Competition"}
                                </span>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {t.submissionStatus === "submitted" ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-950/40 border border-purple-400/50 text-purple-300 font-mono">
                                      <Sparkles size={11} />
                                      <span>Submitted</span>
                                    </span>
                                  ) : (1 + (t.members?.length || 0)) >=
                                    (t.eventId?.minTeamMembers || 3) ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/40 border border-emerald-400/50 text-emerald-300 font-mono">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      <span>Criteria Met</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-950/40 border border-amber-400/50 text-amber-300 font-mono">
                                      <AlertCircle size={11} />
                                      <span>
                                        Forming ({1 + (t.members?.length || 0)}/
                                        {t.eventId?.minTeamMembers || 3} Min)
                                      </span>
                                    </span>
                                  )}

                                  {isLead ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950/40 border border-rose-400/50 text-rose-300 font-mono">
                                      <ShieldCheck size={11} />
                                      <span>Leader</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-950/40 border border-blue-400/50 text-blue-300 font-mono">
                                      <Users size={11} />
                                      <span>Member</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Team Name & Venture */}
                              <div>
                                <h4 className="text-base font-bold text-white font-serif tracking-tight">
                                  {t.teamName}
                                </h4>
                                {t.ventureName && (
                                  <p className="text-xs text-white/70 mt-0.5">
                                    Track / Venture:{" "}
                                    <strong className="text-white">{t.ventureName}</strong>
                                  </p>
                                )}
                                {t.ventureDescription && (
                                  <p className="text-[11px] text-white/60 mt-1 line-clamp-2 leading-relaxed bg-white/5 border border-white/10 p-2 rounded-xl">
                                    {t.ventureDescription}
                                  </p>
                                )}
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
                              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 flex-wrap">
                                <div>
                                  <span className="block text-[9px] font-mono uppercase font-bold tracking-widest text-white/50">
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
                                <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-white/50 mb-1.5">
                                  Full Roster ({1 + (t.members?.length || 0)} Students)
                                </span>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-white/80 text-[11px]">
                                    <span className="font-medium text-white">
                                      {t.lead?.name || t.leadEmail} (Lead)
                                    </span>
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
                                        className="flex items-center justify-between text-white/60 text-[11px]"
                                      >
                                        <span>{m.name || m.email}</span>
                                        <span className="text-white/50 font-mono text-[10px]">
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

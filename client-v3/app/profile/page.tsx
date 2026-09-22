"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import GrainOverlay from "@/components/hero/GrainOverlay";
import KolkataHero from "@/components/hero/KolkataHero";

interface TeamMember {
  name: string;
  email: string;
  department?: string;
  roll?: string;
}

interface UserTeam {
  _id: string;
  teamCode: string;
  teamName: string;
  ventureName?: string;
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
  };
}

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  useEffect(() => {
    if (status === "authenticated") {
      setLoadingTeams(true);
      fetch("/api/teams")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.teams)) {
            setTeams(data.teams);
          }
        })
        .catch((err) => {
          console.error("Error fetching teams:", err);
        })
        .finally(() => {
          setLoadingTeams(false);
        });
    }
  }, [status]);

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
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-6 sm:p-10 md:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl text-center">
            {/* Top Iridescent Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Ambient Glows */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/[0.05] blur-3xl" />

            {status === "loading" ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p className="text-xs font-medium text-white/60 uppercase tracking-widest font-mono">
                  Verifying Scholar Credentials...
                </p>
              </div>
            ) : status === "authenticated" && user ? (
              <div className="relative z-10 py-2 animate-fadeIn font-sans">
                {/* Avatar with Glow Ring */}
                <div className="relative mx-auto mb-4 flex items-center justify-center gap-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/[0.08] text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(255,255,255,0.15)] font-[family-name:var(--font-google-sans)] overflow-hidden backdrop-blur-xl">
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

                {/* Verified Pill */}
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Verified HITK Student</span>
                  </div>
                </div>

                {/* Student Name */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] mb-1">
                  {user.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mb-6 font-mono font-medium tracking-tight">
                  {user.email}
                </p>

                {/* Student Digital ID Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                  {/* Department Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 flex flex-col justify-between">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                        <Building size={12} className="text-white/60" />
                        <span>Department</span>
                      </span>
                      <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                        {user.department || "Engineering"}
                      </span>
                    </div>
                  </div>

                  {/* Academic Year Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 flex flex-col justify-between">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                        <Calendar size={12} className="text-white/60" />
                        <span>Academic Year</span>
                      </span>
                      <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                        {user.year || "3rd Year"}
                      </span>
                    </div>
                  </div>

                  {/* Campus Affiliation */}
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-0.5">
                          <Award size={12} className="text-white/60" />
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
                    <div className="rounded-2xl border border-white/10 bg-[#121216] p-6 text-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                        Syncing your teams...
                      </span>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#121216] p-5 text-center flex flex-col items-center gap-3">
                      <p className="text-xs text-zinc-400">
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
                            className="rounded-2xl border border-white/15 bg-[#121216] p-4.5 sm:p-5 flex flex-col gap-3 transition-all hover:border-white/25"
                          >
                            {/* Card Top Row */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate max-w-[240px]">
                                {t.eventId?.title || "Hult Prize Competition"}
                              </span>
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

                            {/* Team Name & Venture */}
                            <div>
                              <h4 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)]">
                                {t.teamName}
                              </h4>
                              {t.ventureName && (
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  Track / Venture: {t.ventureName}
                                </p>
                              )}
                            </div>

                            {/* Team Code Bar */}
                            <div className="rounded-xl border border-white/10 bg-[#0e0e12] p-3 flex items-center justify-between gap-2 flex-wrap">
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
                                Roster ({1 + (t.members?.length || 0)} Students)
                              </span>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-zinc-300 text-[11px]">
                                  <span className="font-medium text-white">
                                    {t.lead?.name || t.leadEmail} (Lead)
                                  </span>
                                  <span className="text-zinc-400 font-mono text-[10px]">
                                    {t.lead?.department || "Lead"}
                                  </span>
                                </div>
                                {t.members && t.members.map((m, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-zinc-400 text-[11px]"
                                  >
                                    <span>{m.name || m.email}</span>
                                    <span className="text-zinc-400 font-mono text-[10px]">
                                      {m.department || "Member"}
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
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center text-center"
                  >
                    Homepage
                  </Link>
                  <Link
                    href="/events"
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center text-center"
                  >
                    View Events
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/register" })}
                    className="w-full rounded-2xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-300 transition-all cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center justify-center gap-1.5 text-center"
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

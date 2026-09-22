"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import AnimatedGradient from "@/components/ui/animated-gradient";
import SiteHeader from "@/components/SiteHeader";
import { parseHeritageEmail } from "@/lib/heritage-parser";

export default function StudentProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [registrations, setRegistrations] = useState<any[]>([]);

  // If user is unauthenticated, redirect to registration/login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/register");
    }
  }, [status, router]);

  // Fetch student's registered events
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/events/register")
        .then((res) => (res.ok ? res.json() : { registrations: [] }))
        .then((data) => setRegistrations(data.registrations || []))
        .catch((err) => console.error("Error fetching registered events:", err));
    }
  }, [status]);

  const studentInfo = session?.user?.email
    ? parseHeritageEmail(session.user.email, session.user.name)
    : null;

  const userRole = (session?.user as { role?: string })?.role;
  const isMasterAdmin = userRole === "master_admin";
  const isLeadAdmin = userRole === "lead_admin";
  const isJuniorAdmin = userRole === "junior_admin";
  const isAdmin = isMasterAdmin || isLeadAdmin || isJuniorAdmin;

  const adminBadgeLabel = isMasterAdmin
    ? "Master Admin"
    : isLeadAdmin
    ? "Lead Admin"
    : isJuniorAdmin
    ? "Junior Admin"
    : "Admin";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans text-white selection:bg-[#f20089] selection:text-white flex flex-col justify-between">
      {/* WebGL Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 18,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />
      </div>

      <SiteHeader />

      {/* Main Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="w-full max-w-xl sm:max-w-2xl">
          {/* Glassmorphic Auth Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-6 sm:p-10 md:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-all duration-500 text-center">
            {/* Top Iridescent Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Ambient Aurora Glow Spheres behind Glass */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#f20089]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-900/30 blur-3xl" />

            {status === "loading" ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="h-14 w-14 rounded-full border-2 border-[#f20089] border-t-transparent animate-spin" />
                <p className="text-xs font-medium text-white/60 uppercase tracking-widest font-mono">
                  Loading Student Profile...
                </p>
              </div>
            ) : status === "authenticated" && session?.user ? (
              <div className="relative z-10 py-2 animate-fadeIn font-sans">
                {/* Avatar with Glow Ring & 3D Shield Badge */}
                <div className="relative mx-auto mb-4 flex items-center justify-center gap-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#f20089] to-purple-600 text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(242,0,137,0.6)] border-2 border-white/40 font-[family-name:var(--font-google-sans)] overflow-hidden">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Student"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      studentInfo?.firstName?.charAt(0) || "H"
                    )}
                  </div>
                </div>

                {/* Verified Pills: Student Status + Admin Role */}
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>HITK Student</span>
                  </div>
                  {isAdmin && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f20089]/50 bg-[#f20089]/20 px-3.5 py-1 text-[11px] font-bold text-pink-300 uppercase tracking-widest shadow-sm">
                      <span>{adminBadgeLabel}</span>
                    </div>
                  )}
                </div>

                {/* Student Name */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] mb-1">
                  {studentInfo?.fullName || session.user.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mb-6 font-mono font-medium tracking-tight">
                  {session.user.email}
                </p>

                {/* Student Digital ID Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                  {/* Branch / Department Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4">
                    <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                      Department
                    </span>
                    <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                      {studentInfo?.branchName || "Engineering"}
                    </span>
                    {studentInfo?.branchCode && (
                      <span className="inline-block mt-2 rounded-md bg-[#f20089]/15 border border-[#f20089]/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#f20089]">
                        {studentInfo.branchCode}
                      </span>
                    )}
                  </div>

                  {/* Current Year of Study & Batch Tile */}
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4">
                    <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                      Year of Study
                    </span>
                    <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                      {studentInfo?.academicYear || "3rd Year"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap font-mono">
                      <span className="rounded-md bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                        {studentInfo?.batch || "Class of 2028"}
                      </span>
                    </div>
                  </div>

                  {/* Campus Affiliation */}
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-0.5">
                          Campus
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

                  {/* Registered Events & Teams Tile */}
                  {registrations && registrations.length > 0 && (
                    <div className="rounded-2xl border border-white/15 bg-[#121216] p-4 sm:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#f20089]">
                          My Registered Events ({registrations.length})
                        </span>
                        <Link
                          href="/events"
                          className="text-[10px] font-mono font-bold text-zinc-400 hover:text-white"
                        >
                          View Events →
                        </Link>
                      </div>

                      <div className="space-y-2 pt-1">
                        {registrations.map((reg, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-[#09090b] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white">{reg.eventTitle}</span>
                                <span className="rounded-full bg-[#f20089]/15 border border-[#f20089]/30 px-2 py-0.5 text-[9px] font-mono font-bold text-[#f20089] uppercase">
                                  {reg.eventTag}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-400 block mt-0.5 font-mono">
                                Team: <strong className="text-white">{reg.team?.teamName}</strong> ({reg.team?.membersCount} Members)
                              </span>
                            </div>
                            <Link
                              href="/events"
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold whitespace-nowrap transition-all ${
                                reg.team?.status === "pending"
                                  ? "bg-white/10 border border-white/15 text-zinc-300 hover:bg-white/15"
                                  : "bg-[#f20089]/20 border border-[#f20089]/40 text-pink-300 hover:bg-[#f20089]/30"
                              }`}
                            >
                              {reg.team?.status === "pending" ? "Team Incomplete" : "Confirmed"}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                  {isAdmin && (
                    <Link
                      href="/portal"
                      className="w-full rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/40 transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center gap-1.5"
                    >
                      <span>Admin Dashboard →</span>
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center"
                  >
                    Homepage →
                  </Link>
                  <Link
                    href="/events"
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center"
                  >
                    View Events
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/register" })}
                    className="w-full rounded-2xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-5 py-3 text-xs sm:text-sm font-semibold text-red-300 transition-all cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center justify-center"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}
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

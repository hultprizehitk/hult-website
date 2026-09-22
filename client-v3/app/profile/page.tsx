"use client";

import React from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { CheckCircle2, Building, Calendar, Award, LogOut, ArrowRight, Lock } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import GrainOverlay from "@/components/hero/GrainOverlay";
import KolkataHero from "@/components/hero/KolkataHero";

export default function StudentProfilePage() {
  const { data: session, status } = useSession();

  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        department?: string;
        year?: string;
      }
    | undefined;

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

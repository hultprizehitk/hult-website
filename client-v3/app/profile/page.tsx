"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Building, Calendar, Award } from "lucide-react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import SiteHeader from "@/components/layout/SiteHeader";

export default function StudentProfilePage() {
  const student = {
    name: "HITK Student Scholar",
    email: "student.scholar@heritageit.edu.in",
    department: "Computer Science & Engineering",
    branchCode: "CSE",
    academicYear: "3rd Year",
    batch: "Class of 2028",
    campus: "Heritage Institute of Technology, Kolkata",
  };

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
          {/* Glassmorphic ID Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-6 sm:p-10 md:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-all duration-500 text-center">
            {/* Top Iridescent Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Ambient Aurora Glow Spheres behind Glass */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#f20089]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-900/30 blur-3xl" />

            <div className="relative z-10 py-2 animate-fadeIn font-sans">
              {/* Avatar with Glow Ring */}
              <div className="relative mx-auto mb-4 flex items-center justify-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#f20089] to-purple-600 text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(242,0,137,0.6)] border-2 border-white/40 font-[family-name:var(--font-google-sans)] overflow-hidden">
                  H
                </div>
              </div>

              {/* Verified Pill */}
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Verified HITK Scholar</span>
                </div>
              </div>

              {/* Student Name */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] mb-1">
                {student.name}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mb-6 font-mono font-medium tracking-tight">
                {student.email}
              </p>

              {/* Student Digital ID Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                {/* Branch / Department Tile */}
                <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 flex flex-col justify-between">
                  <div>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                      <Building size={12} className="text-[#f20089]" />
                      <span>Department</span>
                    </span>
                    <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                      {student.department}
                    </span>
                  </div>
                  <span className="inline-block mt-3 w-fit rounded-md bg-[#f20089]/15 border border-[#f20089]/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#f20089]">
                    {student.branchCode}
                  </span>
                </div>

                {/* Current Year of Study & Batch Tile */}
                <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 flex flex-col justify-between">
                  <div>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                      <Calendar size={12} className="text-[#f20089]" />
                      <span>Academic Year</span>
                    </span>
                    <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                      {student.academicYear}
                    </span>
                  </div>
                  <span className="inline-block mt-3 w-fit rounded-md bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-200">
                    {student.batch}
                  </span>
                </div>

                {/* Campus Affiliation */}
                <div className="rounded-2xl border border-white/10 bg-[#121216] p-4 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-0.5">
                        <Award size={12} className="text-[#f20089]" />
                        <span>Campus Affiliation</span>
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {student.campus}
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
                <Link
                  href="/register"
                  className="w-full rounded-2xl bg-white hover:bg-neutral-100 px-4 py-3 text-xs sm:text-sm font-bold text-neutral-950 transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center text-center"
                >
                  Portal Sign-In
                </Link>
              </div>
            </div>
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

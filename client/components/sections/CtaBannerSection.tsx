"use client";

import React from "react";
import Link from "next/link";

export default function CtaBannerSection() {
  return (
    <section className="relative w-full py-16 sm:py-24 px-5 sm:px-10 lg:px-16 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white bg-black font-[family-name:var(--font-google-sans)] border-t border-white/10">
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[2.5rem] border border-[#f20089]/50 bg-gradient-to-r from-[#f20089]/25 via-purple-950/40 to-black p-8 sm:p-14 text-center backdrop-blur-3xl shadow-[0_20px_60px_rgba(242,0,137,0.3)] space-y-6">
        {/* Iridescent Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#f20089]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-600/30 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
            <span>🚀</span>
            <span>Join Hult Prize HITK 2026/2027</span>
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Have an Idea That Could Change{" "}
            <span className="bg-gradient-to-r from-white via-pink-200 to-[#f20089] bg-clip-text text-transparent">
              1,000,000 Lives?
            </span>
          </h2>

          <p className="text-xs sm:text-base text-white/80 font-sans font-medium leading-relaxed max-w-2xl mx-auto">
            Register your venture team today or join an existing team using a Team Code. Access top-tier mentorship, pitch on-campus, and represent Heritage Institute of Technology globally.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-4 flex-wrap pt-2">
          <Link
            href="/register"
            className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-[#f20089]/40 transition-all hover:scale-105 active:scale-95"
          >
            Register Your Venture Team →
          </Link>

          <Link
            href="/events"
            className="rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
          >
            Explore Events & RSVP
          </Link>
        </div>
      </div>
    </section>
  );
}

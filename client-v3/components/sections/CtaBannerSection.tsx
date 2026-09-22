"use client";

import React from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function CtaBannerSection() {
  return (
    <section className="relative w-full py-20 sm:py-28 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)]">
      <ScrollReveal direction="scale">
        <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.04] p-8 sm:p-14 text-center backdrop-blur-3xl shadow-2xl space-y-6">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/30 backdrop-blur-xl px-4 py-1.5 shadow-inner">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f20089] animate-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-pink-300">
                HULT PRIZE HITK 2026/2027
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] font-[family-name:var(--font-google-sans)]">
              Build a Startup That Changes{" "}
              <span className="bg-gradient-to-r from-white via-pink-100 to-[#f20089] bg-clip-text text-transparent font-mono tabular-nums">
                1,000,000 Lives
              </span>
            </h2>

            <p className="text-xs sm:text-base text-white/80 font-sans leading-relaxed max-w-2xl mx-auto">
              Register your venture team or join an existing team using a Team Code to access top-tier campus mentorship and global summit representation.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link
              href="/register"
              className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95 font-mono"
            >
              Register Venture Team →
            </Link>

            <Link
              href="/events"
              className="rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 font-mono"
            >
              Explore Events & RSVP
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

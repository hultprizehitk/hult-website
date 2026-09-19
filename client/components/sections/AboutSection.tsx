"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import TiltCard from "@/components/ui/TiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)] border-y border-white/10 bg-gradient-to-b from-white/[0.02] via-white/[0.01] to-white/[0.02] backdrop-blur-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
    >
      {/* Photo Background Layer with Soft Seamless Radial Blend */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/about-section.png"
          alt="Hult Prize On Campus Ceremony at Heritage Institute of Technology"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-25 mix-blend-screen scale-102"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-black/50 to-black" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-[#f20089] animate-pulse" />
              <span>Hult Prize at HITK</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
              About{" "}
              <span className="bg-gradient-to-r from-white via-pink-100 to-[#f20089] bg-clip-text text-transparent">
                Hult Prize HITK
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/85 font-sans font-medium leading-relaxed">
              The <strong className="text-white">Hult Prize OnCampus</strong> at{" "}
              <strong className="text-[#f20089]">Heritage Institute of Technology</strong> is the world’s premier student-led social entrepreneurship movement. We empower student founders to turn bold ideas into high-impact, market-driven ventures.
            </p>
          </div>
        </ScrollReveal>

        {/* ========================================================================= */}
        {/* POINT 4: LUXURY BENTO GRID & VISUAL STORYTELLING (CUSTOM 3D ASSETS)      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* Bento Tile 1 (Featured Large Tile - Spans 2 Cols) */}
          <ScrollReveal direction="up" delay={100} className="md:col-span-2 lg:col-span-2">
            <div className="h-full rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between group hover:border-[#f20089]/60 transition-all duration-300 relative overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#f20089]/20 blur-3xl group-hover:bg-[#f20089]/35 transition-all" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="font-mono text-xs font-bold text-[#f20089] uppercase tracking-widest bg-[#f20089]/15 border border-[#f20089]/30 px-3 py-1 rounded-full">
                      Global Flagship
                    </span>
                    <span className="text-[11px] font-mono text-white/50">
                      UN Headquarters Final Stage
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors">
                    $1,000,000 USD Global Seed Fund
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-6">
                    Winning teams from Heritage Institute advance from our OnCampus competition to Global Regional Summits and pitch directly at the United Nations Headquarters in New York City.
                  </p>
                </div>

                {/* Original Right-Side 3D Shield Emblem */}
                <div className="relative h-44 w-full flex items-center justify-center sm:col-span-1">
                  <Image
                    src="/assets/bento/shield.png"
                    alt="Hult Prize 3D Shield Emblem"
                    width={180}
                    height={180}
                    unoptimized
                    className="object-contain hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_30px_rgba(242,0,137,0.5)]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="block text-white/50 text-[10px] uppercase">Heritage Impact</span>
                    <strong className="text-white text-sm font-bold">100+ Founders</strong>
                  </div>
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div>
                    <span className="block text-white/50 text-[10px] uppercase">UN Alignment</span>
                    <strong className="text-[#f20089] text-sm font-bold">17 SDGs</strong>
                  </div>
                </div>

                <Link
                  href="/register"
                  className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105"
                >
                  Join OnCampus 2027 →
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Bento Tile 2 (Pillar 01 - Rocket) */}
          <ScrollReveal direction="up" delay={200} className="md:col-span-1 lg:col-span-1">
            <TiltCard glowColor="rgba(242, 0, 137, 0.4)" className="h-full flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#f20089] uppercase tracking-widest block mb-1">
                  Pillar 01
                </span>
                <h3 className="text-xl font-bold text-white mb-3">Social Impact</h3>

                {/* Featured 3D Rocket Asset (10% Larger) */}
                <div className="relative h-38 sm:h-40 w-full flex items-center justify-center my-2">
                  <Image
                    src="/assets/bento/rocket.png"
                    alt="Venture Rocket"
                    width={155}
                    height={155}
                    unoptimized
                    className="object-contain drop-shadow-[0_8px_25px_rgba(242,0,137,0.5)] hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Description Text Below Logo */}
                <p className="text-xs text-white/70 leading-relaxed font-sans mt-2">
                  Building sustainable, market-driven startups that directly solve environmental, social, and economic challenges.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-white/50">
                SDG Aligned Ventures
              </div>
            </TiltCard>
          </ScrollReveal>

          {/* Bento Tile 3 (Pillar 02 - Founder Pass) */}
          <ScrollReveal direction="up" delay={300} className="md:col-span-1 lg:col-span-1">
            <TiltCard glowColor="rgba(168, 85, 247, 0.4)" className="h-full flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">
                  Pillar 02
                </span>
                <h3 className="text-xl font-bold text-white mb-3">Incubation & Mentorship</h3>

                {/* Featured 3D Founder Pass Asset */}
                <div className="relative h-36 w-full flex items-center justify-center my-2">
                  <Image
                    src="/assets/bento/pass.png"
                    alt="Founder Pass"
                    width={140}
                    height={140}
                    unoptimized
                    className="object-contain drop-shadow-[0_8px_25px_rgba(168,85,247,0.5)] hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Description Text Below Logo */}
                <p className="text-xs text-white/70 leading-relaxed font-sans mt-2">
                  Direct access to venture builders, pitch coaches, and industry mentors throughout the competition lifecycle.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-white/50">
                1-on-1 Founder Guidance
              </div>
            </TiltCard>
          </ScrollReveal>

          {/* Bento Tile 4 (Full Width Bottom Strip - Spans 4 Cols with Orb) */}
          <ScrollReveal direction="up" delay={400} className="md:col-span-3 lg:col-span-4">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-purple-950/30 via-white/[0.03] to-black p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-1 relative z-10 max-w-2xl">
                <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-widest block">
                  Pillar 03 • Global Accelerator Network
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-google-sans)]">
                  From Heritage Campus Champion to Global Founder
                </h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                  Every winning team from Heritage Institute of Technology receives fast-track entry into international summits, global press exposure, and continuous mentorship.
                </p>
              </div>

              {/* Proportional 3D Global Orb Graphic (550% Larger & Centered) */}
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 shrink-0">
                <div className="relative h-64 w-64 sm:h-72 sm:w-72 md:h-80 md:w-80 flex items-center justify-center shrink-0">
                  <Image
                    src="/assets/bento/orb.png"
                    alt="Global Network Orb"
                    width={495}
                    height={495}
                    unoptimized
                    className="object-contain drop-shadow-[0_10px_40px_rgba(56,189,248,0.5)] hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <Link
                  href="/events"
                  className="rounded-2xl border border-white/20 bg-white/[0.08] hover:bg-white/15 px-6 py-3 text-xs font-bold text-white transition-all whitespace-nowrap hover:scale-105 shrink-0"
                >
                  Explore Events →
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}


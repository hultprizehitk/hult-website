"use client";

import React from "react";
import Link from "next/link";
import TiltCard from "@/components/ui/TiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

const tracks = [
  {
    code: "TRACK 01",
    title: "Clean Energy & Climate Resilience",
    sdg: "SDG 7 & 13",
    desc: "Solutions focused on renewable energy deployment, circular waste upcycling, carbon footprint reduction, and sustainable infrastructure.",
    glow: "rgba(16, 185, 129, 0.35)",
  },
  {
    code: "TRACK 02",
    title: "EdTech & Skill Access",
    sdg: "SDG 4 & 9",
    desc: "Platforms and technologies expanding quality education, vocational training, and AI-driven tools for equal opportunity.",
    glow: "rgba(14, 165, 233, 0.35)",
  },
  {
    code: "TRACK 03",
    title: "Food Security & Life Sciences",
    sdg: "SDG 2 & 3",
    desc: "Innovations in agritech, nutrition supply chains, biotechnology, and accessible health services for high-density communities.",
    glow: "rgba(242, 0, 137, 0.35)",
  },
  {
    code: "TRACK 04",
    title: "Open Track: Social Impact Enterprise",
    sdg: "SDG 17",
    desc: "Any market-driven venture addressing a critical social or environmental challenge aligned with the United Nations SDGs.",
    glow: "rgba(168, 85, 247, 0.35)",
  },
];

export default function ChallengeSection() {
  return (
    <section
      id="challenge"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)] border-y border-white/10 bg-gradient-to-b from-purple-950/20 via-white/[0.015] to-black/30 backdrop-blur-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 shadow-inner">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                <span>UN Sustainable Development Goals</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
                The Global Challenge
              </h2>

              <p className="text-sm sm:text-base text-white/75 font-sans leading-relaxed">
                Build a scalable enterprise aligned with the United Nations SDGs to tackle global challenges with sustainable market solutions.
              </p>
            </div>

            <Link
              href="/register"
              className="self-start md:self-auto rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95"
            >
              Submit Pitch Idea →
            </Link>
          </div>
        </ScrollReveal>

        {/* 3D Tilt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((track, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 150}>
              <TiltCard glowColor={track.glow} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#f20089] tracking-widest uppercase">
                    {track.code}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-mono font-bold text-white/80">
                    {track.sdg}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-pink-100 transition-colors">
                  {track.title}
                </h3>

                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                  {track.desc}
                </p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

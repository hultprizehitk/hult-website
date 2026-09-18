"use client";

import React from "react";
import TiltCard from "@/components/ui/TiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

const steps = [
  {
    step: "01",
    title: "Registration & Team Pass",
    desc: "Form your team, generate your unique Team Invite Code, and complete team roster verification.",
    phase: "Phase 1 • Active",
    glow: "rgba(16, 185, 129, 0.35)",
  },
  {
    step: "02",
    title: "Hult Ascend Auditorium Challenge",
    desc: "Scan the projected QR code in Auditorium Room 1 to log attendance and compete in the live quiz & pitch.",
    phase: "Phase 2",
    glow: "rgba(168, 85, 247, 0.35)",
  },
  {
    step: "03",
    title: "OnCampus Championship Finale",
    desc: "Present your business model before venture capitalists and judges to compete for the campus title.",
    phase: "Phase 3",
    glow: "rgba(242, 0, 137, 0.35)",
  },
  {
    step: "04",
    title: "Global Regional Summits",
    desc: "Represent Heritage Institute of Technology at international summits across Europe, Asia, or America.",
    phase: "Phase 4",
    glow: "rgba(14, 165, 233, 0.35)",
  },
  {
    step: "05",
    title: "Global Accelerator & UN HQ Finals",
    desc: "Pitch at the United Nations HQ in New York for $1,000,000 USD in seed capital.",
    phase: "Grand Finale",
    glow: "rgba(245, 158, 11, 0.35)",
  },
];

export default function TimelineSection() {
  return (
    <section
      id="timeline"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)] border-y border-white/10 bg-gradient-to-b from-sky-950/20 via-white/[0.015] to-black/30 backdrop-blur-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Competition Stepper</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Roadmap to the Global Stage
            </h2>

            <p className="text-sm sm:text-base text-white/75 font-sans leading-relaxed">
              From campus registration at Heritage Institute of Technology to the United Nations HQ.
            </p>
          </div>
        </ScrollReveal>

        {/* 3D Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((item, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 120}>
              <TiltCard glowColor={item.glow} className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-2xl font-black text-[#f20089]">
                      {item.step}
                    </span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                      {item.phase}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-pink-100 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

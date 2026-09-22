"use client";

import React from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Trophy, Globe2, Rocket, Sparkles, ArrowUpRight, Target, Compass, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  const metrics = [
    {
      value: "$1,000,000",
      label: "Global Seed Capital",
      sublabel: "Annual Grand Prize award",
      icon: Trophy,
      accent: "from-pink-500/20 to-purple-500/10",
      textColor: "text-pink-400",
    },
    {
      value: "120+",
      label: "Partner Nations",
      sublabel: "Worldwide university network",
      icon: Globe2,
      accent: "from-emerald-500/20 to-teal-500/10",
      textColor: "text-emerald-400",
    },
    {
      value: "HITK",
      label: "OnCampus Hub",
      sublabel: "Direct pathway to regionals",
      icon: Rocket,
      accent: "from-amber-500/20 to-orange-500/10",
      textColor: "text-amber-400",
    },
    {
      value: "UN SDGs",
      label: "Impact Framework",
      sublabel: "Social venture benchmark",
      icon: Sparkles,
      accent: "from-sky-500/20 to-blue-500/10",
      textColor: "text-sky-400",
    },
  ];

  const pillars = [
    {
      step: "01",
      tag: "IDEATE",
      title: "Problem Discovery & Validation",
      desc: "Architect market-viable ventures tackling acute global sustainability challenges.",
      icon: Target,
    },
    {
      step: "02",
      tag: "ACCELERATE",
      title: "Founder Mentorship Sprints",
      desc: "Rigorous pitch deck reviews, financial modeling, and guidance from industry operators.",
      icon: Compass,
    },
    {
      step: "03",
      tag: "COMPETE",
      title: "Global Summit Pipeline",
      desc: "Winning campus teams fast-track directly to international Hult Prize Regional Summits.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)]"
    >
      {/* Soft Ambient Radial Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-pink-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-purple-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left Column: Chapter Badge & High-Contrast Serif Headline */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] backdrop-blur-xl px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-pink-300 shadow-inner">
                <span className="h-2 w-2 rounded-full bg-[#f20089] animate-pulse" />
                <span>01 / OnCampus Chapter</span>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white leading-[1.08] drop-shadow-sm">
                Catalyzing Student Founders For A Brighter World
              </h2>
            </div>

            {/* Right Column: Narrative & Italic Motto */}
            <div className="lg:col-span-5 lg:pt-14 space-y-6">
              <p className="text-base sm:text-lg text-white/80 font-sans leading-relaxed font-normal">
                The world&apos;s premier student social entrepreneurship incubator at{" "}
                <strong className="text-white font-semibold">Heritage Institute of Technology</strong>, turning bold
                ideas into scalable, investment-ready enterprises.
              </p>

              <div className="pt-2 border-t border-white/10">
                <p className="text-lg sm:text-xl font-serif italic text-pink-200/90 tracking-wide">
                  Ideas for a brighter tomorrow
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Metrics Grid */}
        <ScrollReveal direction="up" delay={120}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 hover:border-pink-500/40 hover:bg-white/[0.06] hover:-translate-y-1 shadow-lg shadow-black/40"
                >
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                  />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/[0.06] flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${m.textColor}`} />
                      </div>
                      <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">0{idx + 1}</span>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                        {m.value}
                      </div>
                      <div className="text-xs font-semibold text-white/90 uppercase tracking-wide mt-1">
                        {m.label}
                      </div>
                      <div className="text-[11px] text-white/50 font-sans mt-0.5">
                        {m.sublabel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* 3 Technical Innovation Pillars */}
        <ScrollReveal direction="up" delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-7 sm:p-8 transition-all duration-300 hover:border-[#f20089]/40 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-[#f20089]/10"
                >
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <span className="font-mono text-xs font-bold text-[#f20089] tracking-widest">
                      PHASE {pillar.step}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-0.5 text-[9px] font-mono uppercase tracking-widest text-white/70">
                      {pillar.tag}
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#f20089]/10 border border-[#f20089]/30 flex items-center justify-center text-[#f20089]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

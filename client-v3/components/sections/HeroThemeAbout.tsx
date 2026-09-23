"use client";

import React from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Trophy, Globe2, Rocket, Sparkles, ArrowRight, Target, Compass, Award } from "lucide-react";
import { useThemeTuner } from "@/context/ThemeTunerContext";

interface MetricItem {
  index: string;
  value: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  accent: string;
}

interface PillarItem {
  step: string;
  tag: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

function MetricCard({ m }: { m: MetricItem }) {
  const Icon = m.icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-[#0b0e17]/85 border border-white/15 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-[#E8396E]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      {/* Subtle top inner glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div>
        <div className="flex items-center justify-between mb-5">
          <div
            className="h-11 w-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md"
            style={{ color: m.accent }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-mono text-xs font-semibold text-white/50 tracking-widest">
            {m.index}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="font-monumental text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {m.value}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#E8396E]">
            {m.label}
          </div>
        </div>
      </div>

      <div className="text-xs font-medium text-white/70 pt-3 border-t border-white/10 mt-3">
        {m.sublabel}
      </div>
    </div>
  );
}

function PillarCard({ pillar, idx }: { pillar: PillarItem; idx: number }) {
  const Icon = pillar.icon;
  return (
    <div className="group relative min-h-[320px] sm:min-h-[380px] overflow-hidden rounded-3xl p-7 sm:p-8 bg-[#0b0e17]/85 border border-white/15 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-[#E8396E]/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
      {/* Subtle top inner glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <span className="font-mono text-[11px] font-bold text-white tracking-widest">
            PHASE {pillar.step}
          </span>
          <span className="rounded-full border border-[#E8396E]/40 bg-[#E8396E]/15 px-3 py-0.5 text-[9px] font-mono uppercase tracking-widest text-pink-300 font-bold backdrop-blur-sm">
            {pillar.tag}
          </span>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFAA5C] shadow-md group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h3 className="font-monumental text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
            {pillar.title}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans font-medium">
            {pillar.desc}
          </p>
        </div>
      </div>

      <div className="pt-4 flex items-center gap-2 text-xs font-mono font-semibold text-white/90 group-hover:text-white border-t border-white/10 mt-4">
        <span>Track Stage 0{idx + 1}</span>
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform text-[#E8396E]" />
      </div>
    </div>
  );
}

export default function HeroThemeAbout() {
  const { getHeaderShadow } = useThemeTuner();

  const metrics: MetricItem[] = [
    {
      index: "01",
      value: "$1,000,000",
      label: "Global Seed Capital",
      sublabel: "Annual Grand Prize award",
      icon: Trophy,
      accent: "#FFD166",
    },
    {
      index: "02",
      value: "120+",
      label: "Partner Nations",
      sublabel: "Worldwide university network",
      icon: Globe2,
      accent: "#4CC9F0",
    },
    {
      index: "03",
      value: "HITK",
      label: "OnCampus Hub",
      sublabel: "Direct pathway to regionals",
      icon: Rocket,
      accent: "#E8396E",
    },
    {
      index: "04",
      value: "UN SDGs",
      label: "Impact Framework",
      sublabel: "Social venture benchmark",
      icon: Sparkles,
      accent: "#06D6A0",
    },
  ];

  const pillars: PillarItem[] = [
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
      icon: Award,
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full py-20 sm:py-28 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-transparent text-white"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">


        {/* 4 Metric Cards — Simple, High Visibility */}
        <ScrollReveal direction="up" delay={120}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((m, idx) => (
              <MetricCard key={idx} m={m} />
            ))}
          </div>
        </ScrollReveal>

        {/* 3 Acceleration Pillar Cards */}
        <ScrollReveal direction="up" delay={200}>
          <div className="space-y-8 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] font-semibold text-[#E8396E]">
                  METHODOLOGY
                </span>
                <h3
                  className="font-monumental text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]"
                  style={{
                    textShadow: getHeaderShadow(),
                  }}
                >
                  The Founder Incubation Pathway
                </h3>
              </div>
              <span className="hidden sm:inline-block font-mono text-xs text-white/60 tracking-wider">
                Three Strategic Acceleration Sprints
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((pillar, idx) => (
                <PillarCard key={idx} pillar={pillar} idx={idx} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

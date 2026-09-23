"use client";

import React from "react";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Trophy, Globe2, Rocket, Sparkles, ArrowRight, Target, Compass, Award } from "lucide-react";

export default function HeroThemeAbout() {
  const metrics = [
    {
      index: "01",
      value: "$1,000,000",
      label: "Global Seed Capital",
      sublabel: "Annual Grand Prize award",
      icon: Trophy,
    },
    {
      index: "02",
      value: "120+",
      label: "Partner Nations",
      sublabel: "Worldwide university network",
      icon: Globe2,
    },
    {
      index: "03",
      value: "HITK",
      label: "OnCampus Hub",
      sublabel: "Direct pathway to regionals",
      icon: Rocket,
    },
    {
      index: "04",
      value: "UN SDGs",
      label: "Impact Framework",
      sublabel: "Social venture benchmark",
      icon: Sparkles,
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
      icon: Award,
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-gradient-to-b from-[#f7eef2] via-[#faf4f6] to-[#fbf7f8] text-[#211B1C]"
    >
      {/* ========================================================= */}
      {/* LAYERED BACKGROUND ELEMENTS (Sakura, Water, Zen Rings)     */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Delicate Water Ripple Shimmer Plane */}
        <div
          className="absolute bottom-0 left-0 right-0 h-96 opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: "url('/assets/hult-prize-hero/water/water-reflection.png')",
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
          }}
        />

        {/* Top-Right Framing Sakura Branch */}
        <div className="absolute -top-16 -right-16 w-72 md:w-[420px] opacity-25 pointer-events-none rotate-[14deg]">
          <img
            src="/assets/hult-prize-hero/branches/cherry-branch-right.png"
            alt=""
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>

        {/* Bottom-Left Framing Sakura Branch */}
        <div className="absolute -bottom-24 -left-20 w-80 md:w-[460px] opacity-20 pointer-events-none -rotate-[18deg]">
          <img
            src="/assets/hult-prize-hero/branches/cherry-branch-left.png"
            alt=""
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>

        {/* Concentric Zen Rings Background Accents */}
        <div className="absolute top-1/4 right-1/4 w-[480px] h-[480px] rounded-full border border-[#6F302B]/[0.07] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 translate-x-12 translate-y-12 w-[380px] h-[380px] rounded-full border border-[#6F302B]/[0.05] pointer-events-none" />

        {/* Soft Radial Ambient Lighting */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-r from-pink-200/35 via-rose-100/25 to-transparent blur-[120px] rounded-full" />

        {/* Floating Decorative Petal Decals */}
        <div className="absolute top-20 left-[18%] w-6 h-6 opacity-30 rotate-45">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path
              d="M50 12 C72 16, 92 38, 85 66 C79 84, 58 89, 46 85 C28 77, 18 56, 22 34 C25 18, 36 9, 50 12 Z"
              fill="#e96f82"
            />
          </svg>
        </div>
        <div className="absolute bottom-28 right-[15%] w-7 h-7 opacity-25 -rotate-12">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path
              d="M50 12 C72 16, 92 38, 85 66 C79 84, 58 89, 46 85 C28 77, 18 56, 22 34 C25 18, 36 9, 50 12 Z"
              fill="#e96f82"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Editorial Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-[#6F302B]/15">
            <div className="max-w-2xl space-y-3">
              {/* Eyebrow Label with Hairlines & Official Logo */}
              <div className="flex items-center gap-3">
                <Image
                  src="/ef-hult-prize-logo.png"
                  alt="EF Hult Prize Logo"
                  width={42}
                  height={28}
                  className="h-6 w-auto object-contain drop-shadow-sm"
                />
                <span className="h-px w-6 bg-[#6F302B]/30" />
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-[#6F302B] uppercase font-mono">
                  01 / OnCampus Chapter
                </span>
              </div>

              <h2 className="font-jomolhari text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight hult-title-gradient leading-[1.05]">
                Catalyzing Student Founders For A Brighter World
              </h2>
            </div>

            <div className="max-w-md space-y-2">
              <p className="text-xs sm:text-sm font-medium text-[#4a3b3e] leading-relaxed">
                The world’s premier student social entrepreneurship incubator at Heritage Institute of Technology, turning bold ideas into scalable, investment-ready enterprises.
              </p>

            </div>
          </div>
        </ScrollReveal>

        {/* 4 Glassy Floral Metrics Cards */}
        <ScrollReveal direction="up" delay={120}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-[#f0cbd6]/80 bg-gradient-to-br from-white/95 via-[#fff9fb]/85 to-[#fdf1f6]/95 backdrop-blur-xl p-6 transition-all duration-500 hover:border-[#e66c8b]/60 hover:bg-white hover:-translate-y-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_8px_25px_rgba(217,67,91,0.05)] hover:shadow-[0_16px_35px_rgba(217,67,91,0.12)]"
                >
                  {/* Subtle Floral Sprig Accent in Corner */}
                  <div className="absolute -top-6 -right-6 w-32 pointer-events-none opacity-45 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500 select-none">
                    <img
                      src="/assets/hult-prize-hero/branches/branch-left-secondary.png"
                      alt=""
                      className="w-full h-auto object-contain scale-x-[-1]"
                      draggable={false}
                    />
                  </div>

                  {/* Soft Radial Ambient Rose Glow */}
                  <div className="absolute -top-8 -right-8 w-28 h-28 bg-pink-300/20 blur-2xl rounded-full pointer-events-none" />

                  {/* Floating Delicate Petal Accent */}
                  <div className="absolute bottom-3 right-4 w-4 h-4 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity">
                    <img
                      src="/assets/hult-prize-hero/particles/extracted/petal-2.png"
                      alt=""
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-white/90 border border-[#f0cad5] flex items-center justify-center text-[#D9435B] group-hover:scale-110 transition-transform shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-mono tracking-widest text-[#6F302B]/60 uppercase font-semibold">
                        {m.index}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-jomolhari text-2xl sm:text-3xl font-bold hult-title-gradient tracking-tight tabular-nums">
                        {m.value}
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#211B1C]">
                        {m.label}
                      </div>
                      <div className="text-[10.5px] text-[#6F302B]/75 font-sans">
                        {m.sublabel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* 3 Phased Incubation Pillars Styled as Glassy Floral Vertical Banners */}
        <ScrollReveal direction="up" delay={180}>
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-[#6F302B]/15 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-[#6F302B] uppercase font-mono">
                  The Incubation Pipeline
                </span>
                <h3 className="font-jomolhari text-2xl sm:text-3xl font-normal text-[#211B1C]">
                  From Campus Idea to Global Enterprise
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={idx}
                    className="group relative min-h-[420px] sm:min-h-[460px] overflow-hidden rounded-3xl border border-[#f0cbd6]/80 bg-gradient-to-b from-[#fff6f8]/95 via-white/85 to-[#fdf0f5]/95 backdrop-blur-xl p-8 sm:p-10 transition-all duration-500 hover:border-[#e66c8b]/60 hover:bg-white hover:-translate-y-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_12px_36px_rgba(217,67,91,0.06)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_20px_48px_rgba(217,67,91,0.14)] flex flex-col justify-between"
                  >
                    {/* Top Delicate Cherry Blossom Branch Creeping In */}
                    <div className="absolute -top-8 -right-8 w-52 sm:w-60 pointer-events-none opacity-65 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out select-none">
                      <img
                        src={
                          idx === 0
                            ? "/assets/hult-prize-hero/branches/cherry-branch-right.png"
                            : idx === 1
                              ? "/assets/hult-prize-hero/branches/branch-left-secondary.png"
                              : "/assets/hult-prize-hero/branches/cherry-branch-left.png"
                        }
                        alt=""
                        className="w-full h-auto object-contain drop-shadow-sm"
                        draggable={false}
                      />
                    </div>

                    {/* Bottom Cherry Blossom Branch Cluster Reaching Up */}
                    <div className="absolute -bottom-10 -left-8 w-56 sm:w-64 pointer-events-none opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 ease-out select-none">
                      <img
                        src={
                          idx === 0
                            ? "/assets/hult-prize-hero/branches/cherry-blossoms-left-bottom.png"
                            : idx === 1
                              ? "/assets/hult-prize-hero/branches/branch-left-bottom.png"
                              : "/assets/hult-prize-hero/foreground/foreground-blossoms-right.png"
                        }
                        alt=""
                        className="w-full h-auto object-contain drop-shadow-sm"
                        draggable={false}
                      />
                    </div>

                    {/* Floating Cherry Petal Accents */}
                    <div className="absolute top-1/3 right-4 w-4 h-4 pointer-events-none opacity-35 group-hover:translate-y-1 transition-transform duration-500 select-none">
                      <img
                        src={`/assets/hult-prize-hero/particles/extracted/petal-${(idx % 3) + 1}.png`}
                        alt=""
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <div className="absolute bottom-1/4 left-5 w-4 h-4 pointer-events-none opacity-30 group-hover:-translate-y-1 transition-transform duration-500 select-none">
                      <img
                        src={`/assets/hult-prize-hero/particles/extracted/petal-${(idx % 3) + 4}.png`}
                        alt=""
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>

                    {/* Soft Ambient Rose Atmosphere */}
                    <div className="absolute -top-12 -right-12 w-44 h-44 bg-pink-300/25 blur-3xl rounded-full pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-rose-200/30 blur-3xl rounded-full pointer-events-none" />

                    {/* Card Content Top */}
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-[#6F302B]/12">
                        <span className="font-mono text-[11px] font-bold text-[#D9435B] tracking-widest">
                          PHASE {pillar.step}
                        </span>
                        <span className="rounded-full border border-[#6F302B]/15 bg-white/70 backdrop-blur-sm px-3 py-0.5 text-[9px] font-mono uppercase tracking-widest text-[#6F302B] font-semibold">
                          {pillar.tag}
                        </span>
                      </div>

                      <div className="h-12 w-12 rounded-2xl bg-white/90 border border-[#f0cad5] flex items-center justify-center text-[#D9435B] shadow-sm group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Card Content Center / Bottom */}
                    <div className="relative z-10 space-y-3 pt-6 pb-2">
                      <h3 className="font-jomolhari text-2xl sm:text-3xl font-bold text-[#211B1C] tracking-tight group-hover:text-[#D9435B] transition-colors leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4a3b3e] leading-relaxed font-sans font-medium">
                        {pillar.desc}
                      </p>

                      <div className="pt-4 flex items-center gap-2 text-[10.5px] font-mono font-semibold text-[#D9435B]">
                        <span>Track Stage 0{idx + 1}</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

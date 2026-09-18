"use client";

import React from "react";
import Image from "next/image";

const stats = [
  { value: "$1,000,000", label: "Global Seed Capital", icon: "🏆" },
  { value: "120+", label: "Countries Participating", icon: "🌍" },
  { value: "100K+", label: "Student Entrepreneurs", icon: "🎓" },
  { value: "25 Years", label: "HITK Campus Excellence", icon: "🏛️" },
];

const pillars = [
  {
    title: "Social Innovation",
    desc: "Transforming ambitious ideas into sustainable business models that target the UN Sustainable Development Goals.",
    icon: "💡",
  },
  {
    title: "Mentorship & Pitch Studio",
    desc: "Direct guidance from seasoned venture builders, startup founders, and industry executives throughout your journey.",
    icon: "🚀",
  },
  {
    title: "Global Ecosystem Access",
    desc: "Represent Heritage Institute of Technology at international summits and pitch for $1M USD at the United Nations HQ.",
    icon: "🌐",
  },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white bg-black font-[family-name:var(--font-google-sans)]"
    >
      {/* Background Hero Photo Layer with Soft Vignette Blends */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/about-section.png"
          alt="Hult Prize On Campus Ceremony at Heritage Institute of Technology"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-35 scale-105"
        />

        {/* Smooth Top & Bottom Gradients for Zero-Seam Transition */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-[1]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/60 to-black z-[1]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f20089]/40 bg-[#f20089]/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-pink-300 backdrop-blur-md">
            <span>✨</span>
            <span>About The Movement</span>
          </span>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Empowering the Next Generation of{" "}
            <span className="bg-gradient-to-r from-white via-pink-200 to-[#f20089] bg-clip-text text-transparent">
              Social Entrepreneurs
            </span>
          </h2>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed font-sans font-medium">
            The <strong className="text-white">Hult Prize on Campus</strong> at{" "}
            <strong className="text-[#f20089]">Heritage Institute of Technology</strong> is the world’s largest student-led social entrepreneurship accelerator. We challenge students to solve pressingly urgent global problems through high-impact, market-driven enterprise.
          </p>
        </div>

        {/* Metrics Counter Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-2xl hover:border-[#f20089]/50 hover:bg-white/[0.08] transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center justify-between text-2xl mb-3">
                <span>{stat.icon}</span>
                <span className="h-2 w-2 rounded-full bg-[#f20089] animate-ping" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1 font-mono">
                {stat.value}
              </div>
              <div className="text-xs text-white/60 font-semibold font-sans">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Pillars Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Our 3 Pillars of Impact
            </h3>
            <span className="text-xs text-[#f20089] font-mono uppercase tracking-wider font-semibold">
              HULT PRIZE HITK 2026/2027
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-7 backdrop-blur-2xl hover:border-[#f20089]/60 hover:shadow-[0_15px_40px_rgba(242,0,137,0.2)] transition-all duration-300 space-y-4"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f20089]/20 border border-[#f20089]/40 text-2xl">
                  {pillar.icon}
                </div>

                <h4 className="text-lg font-bold text-white group-hover:text-pink-200 transition-colors">
                  {pillar.title}
                </h4>

                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

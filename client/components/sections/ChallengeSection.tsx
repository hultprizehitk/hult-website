"use client";

import React from "react";
import Link from "next/link";

const challenges = [
  {
    sdg: "SDG 7 & 13",
    title: "Clean Energy & Climate Action",
    category: "Sustainability",
    desc: "Ventures tackling renewable energy deployment, circular waste upcycling, carbon reduction, and climate-resilient infrastructure.",
    badgeColor: "from-amber-500/20 to-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: "🌱",
  },
  {
    sdg: "SDG 4 & 9",
    title: "EdTech & Equitable Access",
    category: "Education & Tech",
    desc: "Platforms expanding quality education, vocational skill development, and AI-driven tools for underserved student communities.",
    badgeColor: "from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/40",
    icon: "🎓",
  },
  {
    sdg: "SDG 2 & 3",
    title: "Food Security & Healthcare",
    category: "Life Sciences",
    desc: "Innovations in sustainable agriculture, BioTech, nutrition logistics, and affordable healthcare for high-density populations.",
    badgeColor: "from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/40",
    icon: "🌾",
  },
  {
    sdg: "SDG 17",
    title: "Open Track: Unlimited Social Impact",
    category: "Wildcard",
    desc: "Any game-changing business model that addresses a critical social or environmental issue aligned with the United Nations SDGs.",
    badgeColor: "from-purple-500/20 to-[#f20089]/20 text-purple-300 border-purple-500/40",
    icon: "🚀",
  },
];

export default function ChallengeSection() {
  return (
    <section
      id="challenge"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white bg-black font-[family-name:var(--font-google-sans)] border-t border-white/10"
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-purple-900/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#f20089]/15 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-purple-300 backdrop-blur-md">
              <span>🎯</span>
              <span>2026/2027 Theme</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              The Global Challenge:{" "}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-[#f20089] bg-clip-text text-transparent">
                UN SDGs
              </span>
            </h2>

            <p className="text-sm sm:text-base text-white/75 font-sans font-medium leading-relaxed">
              Build a scalable, market-viable startup that directly advances one or more of the United Nations Sustainable Development Goals.
            </p>
          </div>

          <Link
            href="/register"
            className="self-start md:self-auto rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Submit Your Pitch Idea →
          </Link>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-black p-8 backdrop-blur-2xl hover:border-[#f20089]/60 hover:shadow-[0_20px_45px_rgba(242,0,137,0.18)] transition-all duration-300 space-y-4"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089]/50 to-transparent" />

              <div className="flex items-center justify-between">
                <span className="text-3xl">{item.icon}</span>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-mono font-bold bg-gradient-to-r ${item.badgeColor}`}
                >
                  {item.sdg}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1 font-mono">
                  {item.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-pink-100 transition-colors">
                  {item.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                {item.desc}
              </p>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f20089] hover:underline font-sans"
                >
                  <span>Register team under this track</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

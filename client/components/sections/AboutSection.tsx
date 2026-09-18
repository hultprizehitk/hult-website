"use client";

import React from "react";
import Image from "next/image";
import TiltCard from "@/components/ui/TiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)]"
    >
      {/* Photo Background Layer with Soft Seamless Radial Blend */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/about-section.png"
          alt="Hult Prize On Campus Ceremony at Heritage Institute of Technology"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-30 mix-blend-screen scale-102"
        />

        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-[#f20089] animate-pulse" />
              <span>Campus Accelerator</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
              About{" "}
              <span className="bg-gradient-to-r from-white via-pink-100 to-[#f20089] bg-clip-text text-transparent">
                Hult Prize HITK
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/85 font-sans font-medium leading-relaxed">
              The <strong className="text-white">Hult Prize on Campus</strong> at{" "}
              <strong className="text-[#f20089]">Heritage Institute of Technology</strong> is the world’s largest student-led social entrepreneurship movement. We empower student founders to build scalable, market-driven startups that tackle pressing global issues.
            </p>
          </div>
        </ScrollReveal>

        {/* 3D Interactive Tilt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal direction="up" delay={100}>
            <TiltCard glowColor="rgba(242, 0, 137, 0.4)">
              <span className="font-mono text-xs font-bold text-[#f20089] uppercase tracking-widest block mb-2">
                Pillar 01
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Social Entrepreneurship</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                Transforming innovative ideas into self-sustaining ventures that directly support the United Nations Sustainable Development Goals.
              </p>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250}>
            <TiltCard glowColor="rgba(168, 85, 247, 0.4)">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest block mb-2">
                Pillar 02
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Mentorship & Incubation</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                Access to industry leaders, venture builders, and technical workshops to refine business models and elevator pitches.
              </p>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={400}>
            <TiltCard glowColor="rgba(14, 165, 233, 0.4)">
              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-widest block mb-2">
                Pillar 03
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Global Stage Access</h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                Campus champions advance to international regional summits and pitch for $1,000,000 USD in seed capital at the United Nations HQ.
              </p>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

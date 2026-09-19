"use client";

import React from "react";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full py-20 sm:py-28 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)]"
    >
      {/* Real Ceremony Photo Background Layer with Seamless Radial Blend */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/about-section.png"
          alt="Hult Prize On Campus Ceremony at Heritage Institute of Technology"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-20 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/50 to-black" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-left">
        <ScrollReveal direction="up">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-3.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-pink-300 shadow-inner">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f20089] animate-pulse" />
              <span>Hult Prize at HITK</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
              About{" "}
              <span className="bg-gradient-to-r from-white via-pink-100 to-[#f20089] bg-clip-text text-transparent">
                Hult Prize HITK
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/80 font-sans font-medium leading-relaxed">
              The <strong className="text-white font-semibold">Hult Prize OnCampus</strong> at{" "}
              <strong className="text-[#f20089] font-semibold">Heritage Institute of Technology</strong> is the world’s premier student-led social entrepreneurship movement. We empower student founders to turn bold ideas into high-impact, market-driven ventures.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

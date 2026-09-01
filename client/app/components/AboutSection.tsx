"use client";

import React from "react";
import Image from "next/image";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full min-h-screen pt-24 sm:pt-32 pb-8 sm:pb-20 lg:pb-24 px-5 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white flex flex-col justify-end items-start"
    >
      {/* 
        ========================================================================
        FULL PHOTO BACKGROUND LAYER (Heritage Institute Stage Ceremony)
        ========================================================================
      */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/about-section.png"
          alt="Hult Prize On Campus Ceremony at Heritage Institute of Technology"
          fill
          sizes="100vw"
          priority
          className="object-cover object-center scale-100"
        />

        {/* Slim subtle edge gradient strictly between the seam line */}
        <div className="absolute inset-x-0 top-0 h-8 sm:h-12 bg-gradient-to-b from-black to-transparent z-[1]" />

        {/* Ambient gradients ensuring text contrast at the bottom-left corner while keeping stage photo bright above */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
      </div>

      {/* 
        ========================================================================
        BOTTOM CORNER TEXT COMPOSITION (Pure Title and Statement in bottom corner)
        ========================================================================
      */}
      <div className="relative z-10 max-w-xl sm:max-w-2xl lg:max-w-3xl flex flex-col items-start text-left">
        {/* Heading */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] font-[family-name:var(--font-syne)]">
          About{" "}
          <span className="bg-gradient-to-r from-white via-pink-100 to-[#f20089] bg-clip-text text-transparent">
            Us
          </span>
        </h2>

        {/* Direct Statement written cleanly in bottom corner */}
        <p className="text-xs sm:text-base md:text-lg lg:text-[1.15rem] font-medium leading-relaxed sm:leading-loose text-white/95 font-sans tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] max-w-2xl">
          The <span className="font-bold text-white">Hult Prize on Campus</span> at{" "}
          <span className="text-[#f20089] font-semibold">Heritage Institute of Technology</span> is
          world&apos;s largest student-led social entrepreneurship competition. It empowers students to create innovative, entrepreneurial solutions for pressing global challenges. Through workshops, competitions, mentorship, and community initiatives, we foster leadership and impact-driven development on campus.
        </p>
      </div>
    </section>
  );
}

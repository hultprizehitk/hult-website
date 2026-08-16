"use client";

import { useState } from "react";
import HultLogoIntro from "./components/HultLogoIntro";

export default function Home() {
  const [introEnded, setIntroEnded] = useState(false);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 py-16 text-white selection:bg-white selection:text-black overflow-hidden select-none">
      {/* Centered Composition Container with Optimal Optical Alignment */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-[300px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[480px]">
        {/* Animated Hult Prize Logo (H outline-to-fill + right text reveal) */}
        <div className="w-full">
          <HultLogoIntro
            className="w-full"
            onEnded={() => setIntroEnded(true)}
          />
        </div>

        {/* 
          Heritage Institute of Technology Subtitle:
          - Precisely positioned right beneath the logo graphic baseline
          - Fixed position (zero layout shift or vertical translation)
          - Fades in smoothly (0.7s) once the logo reveal finishes
          - Clean uppercase typography with 0.24em tracking
        */}
        <p
          className={`fade-in-heritage -mt-3 sm:-mt-5 md:-mt-6 w-full text-center text-[10px] sm:text-xs md:text-sm font-medium tracking-[0.24em] text-white/90 uppercase select-none ${
            introEnded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          Heritage Institute of Technology
        </p>
      </div>
    </main>
  );
}

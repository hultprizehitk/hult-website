"use client";

import { useState } from "react";
import HultLogoIntro from "./components/HultLogoIntro";

export default function Home() {
  const [introEnded, setIntroEnded] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-sans text-white selection:bg-white selection:text-black">
      <main className="flex w-full flex-col items-center justify-center px-4 py-16 text-center">
        {/* Unified Centered Composition (Logo + Fixed Subtitle) */}
        <div className="flex flex-col items-center w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px]">
          {/* Animated Hult Prize Logo Intro (1.5s sequence) */}
          <div className="w-full">
            <HultLogoIntro
              className="w-full"
              onEnded={() => setIntroEnded(true)}
            />
          </div>

          {/* 
            Heritage Institute of Technology Text:
            - Pulled tightly beneath the visible white logo elements (offsetting internal image padding)
            - Fixed position with zero layout shift
            - Smooth opacity transition on intro end
          */}
          <p
            className={`fade-in-heritage -mt-3 sm:-mt-5 md:-mt-7 w-full text-center text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.18em] sm:tracking-[0.24em] text-white uppercase select-none ${
              introEnded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            Heritage Institute of Technology
          </p>
        </div>
      </main>
    </div>
  );
}

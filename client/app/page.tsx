"use client";

import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import GrainOverlay from "@/components/hero/GrainOverlay";
import HeroInterfaceOverlay, { HeroCenterpiece, HeroNavbar } from "@/components/hero/HeroInterfaceOverlay";
import HeroThemeAbout from "@/components/sections/HeroThemeAbout";
import HeroThemeEvents from "@/components/sections/HeroThemeEvents";
import HeroThemeFooter from "@/components/sections/HeroThemeFooter";
import CardThemeDevTool from "@/components/dev/CardThemeDevTool";
import { ThemeTunerProvider, useThemeTuner } from "@/context/ThemeTunerContext";
import { KOLKATA_LAYERS } from "@/lib/kolkata-layers-config";

export default function Home() {
  return (
    <ThemeTunerProvider>
      <HomeContent />
      <CardThemeDevTool />
    </ThemeTunerProvider>
  );
}

function HomeContent() {
  const { config } = useThemeTuner();
  const [isGrainEnabled] = useState(true);
  const [grainOpacity] = useState(0.75);

  const [isSkyLoaded, setIsSkyLoaded] = useState(false);
  const [assembledCount, setAssembledCount] = useState(0);
  const [isAssemblyComplete, setIsAssemblyComplete] = useState(false);

  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const skyTimer = setTimeout(() => setIsSkyLoaded(true), 80);

    let currentCount = 0;
    const popInterval = setInterval(() => {
      currentCount++;
      setAssembledCount(currentCount);
      if (currentCount >= KOLKATA_LAYERS.length) {
        clearInterval(popInterval);
        setTimeout(() => setIsAssemblyComplete(true), 2200);
      }
    }, 52);

    // Initialize Lenis with gentle, luxurious momentum
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const windowH = window.innerHeight || 800;
      // Spread progress over 1.45x viewport height for extended, stately pacing
      const progress = Math.min(1, Math.max(0, currentScrollY / (windowH * 1.45)));
      setScrollY(currentScrollY);
      setScrollProgress(progress);
    };

    lenis.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(skyTimer);
      clearInterval(popInterval);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes marvelPopIn {
          0%   { opacity: 0; transform: scale(0.8) translateY(18px); }
          65%  { opacity: 1; transform: scale(1.035) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes boatFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-2.8px) rotate(0.4deg); }
        }
      `}</style>

      {/*
        ┌─────────────────────────────────────────────────────────┐
        │  HERO  (position: fixed, inset-0)                       │
        │  THE one permanent background for the entire page.      │
        │  Sections scroll over it at z-20 with transparent bg.   │
        └─────────────────────────────────────────────────────────┘
      */}
      <div className="fixed inset-0 z-10 overflow-hidden">
        {/* Full-bleed aspect-ratio preserved canvas */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ overflow: "hidden" }}
        >
          <div
            className="relative pointer-events-none"
            style={{
              width: "max(100vw, calc(100vh * (1672 / 941)))",
              height: "max(100vh, calc(100vw * (941 / 1672)))",
              aspectRatio: "1672 / 941",
              transform: "translate3d(0, -4%, 0)",
            }}
          >
            {/* Base sky — LOCKED, never moves */}
            <img
              src="/assets/kolkata-ui/extreme-background.png"
              alt="Kolkata Base Sky"
              className="absolute inset-0 w-full h-full block select-none pointer-events-none"
              draggable={false}
              style={{
                zIndex: 1,
                opacity: isSkyLoaded ? 1 : 0,
                transition: "opacity 1.2s ease-out",
              }}
            />

            {/* 26 cutout layers — parallax movement based on layer.parallax */}
            {KOLKATA_LAYERS.map((layer, idx) => {
              const isPopped = idx < assembledCount;
              const sy = scrollY * layer.parallax * (config.parallaxMultiplier ?? 0.28);
              const isBoat = layer.id.includes("boat");

              return (
                <div
                  key={layer.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${layer.leftPct}%`,
                    top: `${layer.topPct}%`,
                    width: `${layer.widthPct}%`,
                    height: `${layer.heightPct}%`,
                    zIndex: layer.zIndex,
                    opacity: isPopped ? 1 : 0,
                    transform: `translate3d(0, ${sy}px, 0)`,
                    transition: isAssemblyComplete ? "transform 0.1s ease-out" : undefined,
                  }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      animation: isPopped
                        ? "marvelPopIn 0.38s cubic-bezier(0.34, 1.4, 0.64, 1) forwards"
                        : undefined,
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        animation:
                          isAssemblyComplete && isBoat
                            ? `boatFloat ${3.4 + (idx % 3) * 0.8}s ease-in-out infinite ${(idx % 2) * 0.6}s`
                            : undefined,
                      }}
                    >
                      <img
                        src={layer.src}
                        alt={layer.id}
                        className="w-full h-full block select-none pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Monumental Centerpiece Typography (zIndex: 8 — layered behind Z09, Z10 people, in front of background/monuments) */}
            <HeroCenterpiece scrollProgress={scrollProgress} />
          </div>
        </div>

        {/* Film grain */}
        <GrainOverlay enabled={isGrainEnabled} opacity={grainOpacity} zIndex={82} />

        {/* Scroll Dimmer Overlay — smoothly darkens background as cards scroll up */}
        <div
          className="pointer-events-none absolute inset-0 z-[73] bg-[#08090d] transition-opacity duration-150 ease-out"
          style={{
            opacity: Math.min(config.dimmerMax ?? 0.80, scrollProgress * 1.15),
          }}
        />

        {/* Bottom mist — hero fades softly into sections */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-48 z-[74]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.55) 75%, rgba(255,255,255,0.82) 100%)",
            opacity: Math.max(0, 1 - scrollProgress * 1.5),
            transition: "opacity 0.2s ease-out",
          }}
        />

        {/* Hero typography & side accents */}
        <HeroInterfaceOverlay scrollProgress={scrollProgress} />
      </div>

      {/*
        ┌─────────────────────────────────────────────────────────┐
        │  PAGE SCROLL CONTAINER                                  │
        │  h-screen spacer reserves space for the fixed hero.     │
        │  Sections scroll up over it at z-20, bg-transparent     │
        │  so the fixed hero scene shows behind glass cards.      │
        └─────────────────────────────────────────────────────────┘
      */}
      <div className="relative select-none text-[#111827] font-[family-name:var(--font-google-sans)]">
        {/* Transparent Top Navbar — non-sticky, naturally scrolls away */}
        <HeroNavbar />

        {/* Spacer — extended runway for elegant, deliberate hero exploration */}
        <div className="h-[170vh] pointer-events-none" />

        {/* Sections — transparent, scroll over the fixed hero */}
        <div className="relative z-20 bg-transparent">
          <HeroThemeAbout />
          <HeroThemeEvents />
          <HeroThemeFooter />
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import GrainOverlay from "@/components/hero/GrainOverlay";
import HeroInterfaceOverlay, { HeroCenterpiece, HeroNavbar } from "@/components/hero/HeroInterfaceOverlay";
import HeroThemeAbout from "@/components/sections/HeroThemeAbout";
import HeroThemeEvents from "@/components/sections/HeroThemeEvents";
import HeroThemeFooter from "@/components/sections/HeroThemeFooter";
import CardThemeDevTool from "@/components/dev/CardThemeDevTool";
import { ThemeTunerProvider, useThemeTuner } from "@/context/ThemeTunerContext";
import { KOLKATA_LAYERS } from "@/lib/kolkata-layers-config";

export default function Home() {
  const [showDevTool, setShowDevTool] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("tweak")) {
      setShowDevTool(true);
    }
  }, []);

  return (
    <ThemeTunerProvider>
      <HomeContent />
      {showDevTool && <CardThemeDevTool />}
    </ThemeTunerProvider>
  );
}

function HomeContent() {
  const { config } = useThemeTuner();
  const [isGrainEnabled] = useState(false);
  const [grainOpacity] = useState(0.04);

  const [isSkyLoaded, setIsSkyLoaded] = useState(false);
  const [assembledCount, setAssembledCount] = useState(0);
  const [isAssemblyComplete, setIsAssemblyComplete] = useState(false);

  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const skyTimer = setTimeout(() => setIsSkyLoaded(true), 60);

    let currentCount = 0;
    // Sequential layer slide-in interval: smooth, cascading arrival from the very bottom outside
    const slideInterval = setInterval(() => {
      currentCount++;
      setAssembledCount(currentCount);
      if (currentCount >= KOLKATA_LAYERS.length) {
        clearInterval(slideInterval);
        setTimeout(() => setIsAssemblyComplete(true), 1800);
      }
    }, 46);

    // Silky-smooth RAF momentum scroll tracking
    let targetScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let currentSmoothY = targetScrollY;
    let rafId: number;

    const onScroll = () => {
      targetScrollY = window.scrollY;
    };

    const updateSmoothScroll = () => {
      currentSmoothY += (targetScrollY - currentSmoothY) * 0.12;
      const windowH = window.innerHeight || 800;
      // Spread progress over 1.45x viewport height for extended, stately pacing
      const progress = Math.min(1, Math.max(0, currentSmoothY / (windowH * 1.45)));
      setScrollY(currentSmoothY);
      setScrollProgress(progress);
      rafId = requestAnimationFrame(updateSmoothScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(updateSmoothScroll);

    return () => {
      clearTimeout(skyTimer);
      clearInterval(slideInterval);
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        /* True bottom off-screen slide-in: starts 100% outside the viewport at the bottom */
        @keyframes slideFromBottomOutside {
          0% {
            transform: translate3d(0, 115vh, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes boatFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-2.8px) rotate(0.4deg); }
        }
        /* Smooth high-definition rendering (no crisp-edges nearest-neighbor pixelation) */
        .kolkata-smooth-layer {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
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
              className="absolute inset-0 w-full h-full block select-none pointer-events-none kolkata-smooth-layer"
              draggable={false}
              style={{
                zIndex: 1,
                opacity: isSkyLoaded ? 1 : 0,
                transition: "opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
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
                    opacity: 1,
                    transform: isAssemblyComplete
                      ? `translate3d(0, ${sy}px, 0)`
                      : isPopped
                      ? "translate3d(0, 0, 0)"
                      : "translate3d(0, 115vh, 0)",
                    transition: isAssemblyComplete ? "transform 0.1s ease-out" : undefined,
                    willChange: "transform",
                  }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      transform: isPopped ? "translate3d(0, 0, 0)" : "translate3d(0, 115vh, 0)",
                      animation: isPopped && !isAssemblyComplete
                        ? "slideFromBottomOutside 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
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
                        className="w-full h-full block select-none pointer-events-none kolkata-smooth-layer"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Monumental Centerpiece Typography (zIndex: 50 — elevated in FRONT of all 26 cutout layers) */}
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

        {/* Bottom subtle gradient — hero fades softly into sections */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-48 z-[74]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(8,9,13,0.3) 40%, rgba(8,9,13,0.85) 100%)",
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
      <div className="relative select-none text-white font-[family-name:var(--font-google-sans)]">
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

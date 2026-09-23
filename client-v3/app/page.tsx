"use client";

import React, { useState, useEffect } from "react";
import GrainOverlay from "@/components/hero/GrainOverlay";
import HeroInterfaceOverlay, { HeroCenterpiece, HeroNavbar } from "@/components/hero/HeroInterfaceOverlay";
import HeroThemeAbout from "@/components/sections/HeroThemeAbout";
import HeroThemeEvents from "@/components/sections/HeroThemeEvents";
import HeroThemeFooter from "@/components/sections/HeroThemeFooter";
import CardThemeDevTool from "@/components/dev/CardThemeDevTool";
import FallingLeaves from "@/components/hero/FallingLeaves";
import ClothHumanLayer from "@/components/hero/ClothHumanLayer";
import { ThemeTunerProvider, useThemeTuner } from "@/context/ThemeTunerContext";
import { HERO_LAYERS, HeroLayer } from "@/lib/hero-layers-config";

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

/**
 * Returns the CSS transform for a layer's entrance animation
 * BEFORE it has entered (the "from" state).
 */
function getEntranceFromTransform(entrance: HeroLayer["entrance"]): string {
  switch (entrance) {
    case "fade":
      return "translate3d(0, 0, 0)";
    case "slide-up":
      return "translate3d(0, 100vh, 0)";
    case "slide-right":
      return "translate3d(-100vw, 0, 0)";
    case "zoom-in":
      return "scale(1.3) translate3d(0, 0, 0)";
    default:
      return "translate3d(0, 0, 0)";
  }
}

function HomeContent() {
  const { config } = useThemeTuner();
  const [isGrainEnabled] = useState(false);
  const [grainOpacity] = useState(0.04);

  // Track which layers have "entered" — cascading one-by-one
  const [enteredLayers, setEnteredLayers] = useState<Set<string>>(new Set());
  const [allLayersEntered, setAllLayersEntered] = useState(false);

  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Background layer enters on mount
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const layer of HERO_LAYERS) {
      if (layer.id === "human-layer" || layer.id === "trees-front") continue; // only background enters initially
      const timer = setTimeout(() => {
        setEnteredLayers((prev) => new Set(prev).add(layer.id));
      }, layer.entranceDelay);
      timers.push(timer);
    }

    // Mark layers entered
    const allDoneTimer = setTimeout(() => {
      setAllLayersEntered(true);
    }, 1200);
    timers.push(allDoneTimer);

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
      const progress = Math.min(1, Math.max(0, currentSmoothY / (windowH * 1.45)));
      setScrollY(currentSmoothY);
      setScrollProgress(progress);
      rafId = requestAnimationFrame(updateSmoothScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(updateSmoothScroll);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // ── Scroll-driven layer transitions ──
  // Screen 1 (scrollProgress < 0.02): Pure background + Screen 1 monumental text
  // Screen 2 (scrollProgress 0.02 -> 0.35): Text shifts left, human layer & trees fade in
  const humanHasEntered = scrollProgress >= 0.015;

  // Human layer opacity curve:
  // - scrollProgress < 0.02: 0 (completely hidden initially)
  // - scrollProgress 0.02 -> 0.20: simple clean fade-in (0 -> 1)
  // - scrollProgress 0.20 -> 0.35: steady (1)
  // - scrollProgress > 0.35: exits (1 -> 0)
  const humanOpacity =
    scrollProgress < 0.02
      ? 0
      : scrollProgress <= 0.35
      ? Math.min(1, (scrollProgress - 0.02) / 0.16)
      : Math.max(0, 1 - (scrollProgress - 0.35) / 0.28);

  // Trees opacity curve:
  // - scrollProgress < 0.02: 0 (hidden initially)
  // - scrollProgress 0.02 -> 0.20: fades in (0 -> 1)
  // - scrollProgress 0.20 -> 0.35: steady (1)
  // - scrollProgress > 0.35: splits and fades out (1 -> 0)
  const treeSplitProgress = Math.min(1, Math.max(0, (scrollProgress - 0.35) / 0.35));
  const treeSplitAmount = treeSplitProgress;
  const treesOpacity =
    scrollProgress < 0.02
      ? 0
      : scrollProgress <= 0.35
      ? Math.min(1, (scrollProgress - 0.02) / 0.16)
      : Math.max(0, 1 - treeSplitProgress * 1.5);

  // Leaves: active and visible only when trees are visible
  const leavesActive = scrollProgress >= 0.06 && scrollProgress <= 0.60;
  const leavesOpacity = treesOpacity;

  return (
    <>
      <style>{`
        /* Entrance animations */
        @keyframes heroFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes heroSlideUp {
          0% { transform: translate3d(0, 100vh, 0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }

        @keyframes heroSlideRight {
          0% { transform: translate3d(-100vw, 0, 0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }

        @keyframes heroZoomIn {
          0% { transform: scale(1.3); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .hero-smooth-layer {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
        }
      `}</style>

      {/*
        ┌─────────────────────────────────────────────────────────┐
        │  HERO  (position: fixed, inset-0)                       │
        │  THE one permanent background for the entire page.      │
        │  Layers transition on scroll — no dimmer overlay.       │
        └─────────────────────────────────────────────────────────┘
      */}
      <div className="fixed inset-0 z-10 overflow-hidden bg-[#0a0c14]">
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
            }}
          >
            {/* ============================================================
                HERO LAYERS — with scroll-driven transitions
                ============================================================ */}
            {HERO_LAYERS.map((layer) => {
              const hasEntered = enteredLayers.has(layer.id);

              // Determine entrance animation
              const entranceAnimationMap: Record<HeroLayer["entrance"], string> = {
                fade: `heroFadeIn ${layer.entranceDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                "slide-up": `heroSlideUp ${layer.entranceDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                "slide-right": `heroSlideRight ${layer.entranceDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                "zoom-in": `heroZoomIn ${layer.entranceDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              };

              // ── Per-layer scroll transforms ──
              if (layer.id === "trees-front") {
                // Trees split into left and right halves
                return (
                  <React.Fragment key={layer.id}>
                    {/* Left half of trees — slides left */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: layer.position.left,
                        top: layer.position.top,
                        width: layer.position.width,
                        height: layer.position.height,
                        zIndex: layer.zIndex,
                        clipPath: "inset(0 50% 0 0)",
                        opacity: treesOpacity,
                        transform: `translate3d(${-treeSplitAmount * 110}%, 0, 0)`,
                        transition: "opacity 0.2s ease-out",
                        willChange: "transform, opacity",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={layer.src}
                        alt={`${layer.id}-left`}
                        className="w-full h-full block select-none pointer-events-none hero-smooth-layer"
                        draggable={false}
                        style={{ objectFit: layer.objectFit, objectPosition: layer.objectPosition }}
                      />
                    </div>
                    {/* Right half of trees — slides right */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: layer.position.left,
                        top: layer.position.top,
                        width: layer.position.width,
                        height: layer.position.height,
                        zIndex: layer.zIndex,
                        clipPath: "inset(0 0 0 50%)",
                        opacity: treesOpacity,
                        transform: `translate3d(${treeSplitAmount * 110}%, 0, 0)`,
                        transition: "opacity 0.2s ease-out",
                        willChange: "transform, opacity",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={layer.src}
                        alt={`${layer.id}-right`}
                        className="w-full h-full block select-none pointer-events-none hero-smooth-layer"
                        draggable={false}
                        style={{ objectFit: layer.objectFit, objectPosition: layer.objectPosition }}
                      />
                    </div>
                  </React.Fragment>
                );
              }

              // Human layer — clean, simple opacity fade-in
              if (layer.id === "human-layer") {
                return (
                  <ClothHumanLayer
                    key={layer.id}
                    src={layer.src}
                    hasEntered={humanHasEntered}
                    humanOpacity={humanOpacity}
                    position={layer.position}
                    zIndex={layer.zIndex}
                    objectFit={layer.objectFit}
                    objectPosition={layer.objectPosition}
                  />
                );
              }

              // Base layer — stays permanently, no scroll transform
              return (
                <div
                  key={layer.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: layer.position.left,
                    top: layer.position.top,
                    width: layer.position.width,
                    height: layer.position.height,
                    zIndex: layer.zIndex,
                    opacity: hasEntered ? undefined : 0,
                    transform: hasEntered ? undefined : getEntranceFromTransform(layer.entrance),
                    animation: hasEntered && !allLayersEntered
                      ? entranceAnimationMap[layer.entrance]
                      : undefined,
                    willChange: "transform, opacity",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={layer.src}
                    alt={layer.id}
                    className="w-full h-full block select-none pointer-events-none hero-smooth-layer"
                    draggable={false}
                    style={{ objectFit: layer.objectFit, objectPosition: layer.objectPosition }}
                  />
                </div>
              );
            })}

            {/* Falling Leaves — z-index 5, fades with trees */}
            <div style={{ opacity: leavesOpacity, transition: "opacity 0.15s ease-out" }}>
              <FallingLeaves active={leavesActive} count={14} />
            </div>

            {/* Monumental Hero Headline — exact Figma coordinates within 1672x941 canvas */}
            <HeroCenterpiece scrollProgress={scrollProgress} />
          </div>
        </div>

        {/* Film grain */}
        <GrainOverlay enabled={isGrainEnabled} opacity={grainOpacity} zIndex={82} />

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

        {/* Hero scroll cue */}
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

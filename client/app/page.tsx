"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import ThreeBirds from "@/components/hero/ThreeBirds";
import CloudRevealTransition from "@/components/hero/CloudRevealTransition";
import ClothWindOverlay from "@/components/sections/ClothWindOverlay";
import AboutSection from "@/components/sections/AboutSection";
import ChallengeSection from "@/components/sections/ChallengeSection";
import EventsHighlightSection from "@/components/sections/EventsHighlightSection";
import TimelineSection from "@/components/sections/TimelineSection";
import CtaBannerSection from "@/components/sections/CtaBannerSection";
import SiteFooter from "@/components/sections/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AnimatedGradient from "@/components/ui/animated-gradient";
import { debug } from "@/lib/debug-logger";

const HultLogoIntro = dynamic(() => import("@/components/hero/HultLogoIntro"), {
  ssr: false,
});

// In-memory session flag: resets on browser refresh, persists across Next.js route transitions
let hasIntroPlayedGlobal = false;

function checkHasIntroPlayed(): boolean {
  if (hasIntroPlayedGlobal) return true;
  if (typeof window !== "undefined") {
    try {
      return sessionStorage.getItem("hult_intro_played") === "true";
    } catch {
      return false;
    }
  }
  return false;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [introLogoEnded, setIntroLogoEnded] = useState(() => checkHasIntroPlayed());
  const [isCloudTransitionActive, setIsCloudTransitionActive] = useState(false);
  const [introOverlayActive, setIntroOverlayActive] = useState(() => !checkHasIntroPlayed());
  const [isLandingRevealed, setIsLandingRevealed] = useState(() => checkHasIntroPlayed());

  // If user is already authenticated or intro played in this session, skip intro overlay immediately
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (status === "authenticated" || sessionStorage.getItem("hult_intro_played") === "true") {
        hasIntroPlayedGlobal = true;
        try {
          sessionStorage.setItem("hult_intro_played", "true");
        } catch {}
        setIntroOverlayActive(false);
        setIsLandingRevealed(true);
        setIntroLogoEnded(true);
        setIsCloudTransitionActive(false);
      }
    }
  }, [status]);

  // Mouse Parallax coordinates (subtle offsets in pixels)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger Cloud Transition ~400ms after logo intro sequence ends (only if intro hasn't already played)
  useEffect(() => {
    if (checkHasIntroPlayed()) return;
    if (introLogoEnded) {
      debug.log(
        "intro",
        "introLogoEnded=true -> scheduling cloud transition in 400ms"
      );
      const timer = setTimeout(() => {
        debug.log("intro", "400ms elapsed -> isCloudTransitionActive=true");
        setIsCloudTransitionActive(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [introLogoEnded]);

  // Watchdog: if intro hasn't ended naturally within 3s, force-end it
  useEffect(() => {
    if (hasIntroPlayedGlobal || introLogoEnded) return;
    const timer = setTimeout(() => {
      debug.warn(
        "intro",
        "Watchdog: forcing intro end after 3000ms"
      );
      setIntroLogoEnded(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [introLogoEnded]);

  // Subtle Mouse Parallax Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Normalized offset from -1 to 1
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;

    setMouseOffset({ x, y });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bgEl = document.getElementById("hero-layer-bg");
    const textEl = document.getElementById("hero-layer-text");
    const bldgEl = document.getElementById("hero-layer-building");

    if (bgEl && textEl && bldgEl) {
      const bgStyle = window.getComputedStyle(bgEl);
      const textStyle = window.getComputedStyle(textEl);
      const bldgStyle = window.getComputedStyle(bldgEl);
      const bldgImg = bldgEl.querySelector("img");

      debug.log("zindex", "[HERO Z-INDEX DIAGNOSTICS]", {
        isLandingRevealed,
        layer1_bg: {
          id: "hero-layer-bg",
          zIndex: bgStyle.zIndex,
          position: bgStyle.position,
          transform: bgStyle.transform,
        },
        layer2_text: {
          id: "hero-layer-text",
          zIndex: textStyle.zIndex,
          position: textStyle.position,
          transform: textStyle.transform,
          rect: textEl.getBoundingClientRect(),
        },
        layer3_building: {
          id: "hero-layer-building",
          zIndex: bldgStyle.zIndex,
          position: bldgStyle.position,
          transform: bldgStyle.transform,
          rect: bldgEl.getBoundingClientRect(),
          img: bldgImg
            ? {
                src: bldgImg.currentSrc || bldgImg.src,
                complete: bldgImg.complete,
                naturalWidth: bldgImg.naturalWidth,
                naturalHeight: bldgImg.naturalHeight,
              }
            : "No <img> element found inside Layer 3",
        },
      });
    }
  }, [isLandingRevealed]);

  return (
    <div
      suppressHydrationWarning
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans text-white selection:bg-[#f20089] selection:text-white"
    >
      {/* 
        ========================================================================
        PERMANENT WEBGL ANIMATED BACKGROUND LAYER (Aurora Shader)
        - Stays active behind the entire site (hero and all sections below)
        ========================================================================
      */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 14,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black pointer-events-none" />
      </div>

      {/* 
        ========================================================================
        1. MAIN LANDING PAGE (Features Campus View, Sky Title, Clouds & Birds)
        ========================================================================
      */}
      <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
        {/* 
          ========================================================================
          LAYER 1: Full-Screen Campus Photograph & Sky Background (z-0)
          ========================================================================
        */}
        <div
          id="hero-layer-bg"
          className="absolute inset-0 z-0 parallax-smooth"
          style={{
            transform: `translate3d(${mouseOffset.x * 2}px, ${mouseOffset.y * 1.5}px, 0) scale(1.02)`,
          }}
        >
          <Image
            src="/heritage-landing.png"
            alt="Heritage Institute of Technology Campus Sky & Background"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center animate-landing-hero"
          />

          {/* Slim subtle edge gradient strictly between the seam line */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 sm:h-12 bg-gradient-to-t from-black to-transparent z-[2]" />
        </div>

        {/* 
          ========================================================================
          Natural Subtle Cloud Drift Parallax Layers (Over Upper Sky Area)
          ========================================================================
        */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[45%] z-5 overflow-hidden parallax-smooth opacity-20 mix-blend-screen"
          style={{
            transform: `translate3d(${mouseOffset.x * 6}px, ${mouseOffset.y * 4}px, 0)`,
          }}
        >
          {/* Drifting Cloud Layer 1 */}
          <div className="absolute -inset-x-32 top-4 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-3xl animate-cloud-drift-1" />

          {/* Drifting Cloud Layer 2 */}
          <div className="absolute -inset-x-40 top-12 h-full bg-gradient-to-r from-transparent via-sky-100/30 to-transparent blur-2xl animate-cloud-drift-2" />
        </div>

        {/* 
          ========================================================================
          Three.js Realistic Bird Flock Animation Layer (Only rendered after reveal)
          ========================================================================
        */}
        {isLandingRevealed && <ThreeBirds />}

        {/* 
          ========================================================================
          LAYER 2: Upper Sky "HULT PRIZE" Cinematic Bold Typography (z-10)
          - Positioned behind the foreground building cutout
          - Slides up smoothly from behind the roofline when revealed
          ========================================================================
        */}
        <div
          id="hero-layer-text"
          className={`pointer-events-none absolute inset-x-0 top-[9%] sm:top-[10%] md:top-[11%] lg:top-[12%] xl:top-[13%] z-10 flex items-center justify-center px-2 sm:px-4 parallax-smooth ${isLandingRevealed ? "animate-sky-entrance" : "opacity-0"
            }`}
          style={{
            transform: `translate3d(${mouseOffset.x * 4}px, ${mouseOffset.y * 3}px, 0)`,
          }}
        >
          <div className="animate-sky-floating flex items-center justify-center">
            <h1 className="sky-hult-title text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[9.5rem] 2xl:text-[11rem] font-bold uppercase tracking-[0.04em] sm:tracking-[0.08em] leading-none text-center select-none whitespace-nowrap">
              HULT PRIZE
            </h1>
          </div>
        </div>

        {/* 
          ========================================================================
          LAYER 3: Foreground Campus Building Cutout Layer (z-15)
          - Sky area is transparent, keeping building structure opaque on top of text
          - Micro-parallax transforms match Layer 1 for 100% pixel-perfect alignment
          - Houses 3D cloth waving banners over the building facade
          ========================================================================
        */}
        <div
          id="hero-layer-building"
          className="pointer-events-none absolute inset-0 z-[15] parallax-smooth"
          style={{
            transform: `translate3d(${mouseOffset.x * 2}px, ${mouseOffset.y * 1.5}px, 0) scale(1.02)`,
          }}
        >
          <Image
            src="/heritage-landing_bg_removed.png"
            alt="Heritage Institute of Technology Campus Building Foreground"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center animate-landing-hero"
          />

          {/* 3D Waving Banners with Three.js Cloth & Drop-Unfurl Physics */}
          <ClothWindOverlay mouseOffset={mouseOffset} isRevealed={isLandingRevealed} />
        </div>

        {/* 
          ========================================================================
          Constant Header Navigation (100% Pure Transparent, No Blur - z-50)
          ========================================================================
        */}
        <SiteHeader transparentUntilScroll={true} isLandingRevealed={isLandingRevealed} />

        {/* Main Area with subtle scroll down indicator (z-20) */}
        <main className="flex-1 relative z-20 flex flex-col items-center justify-end pb-6 sm:pb-10">
          <a
            href="#about"
            aria-label="Scroll down to About section"
            className={`group flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${
              isLandingRevealed ? "opacity-75 hover:opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-[0.25em] text-white/70 uppercase select-none group-hover:text-white transition-colors">
              Explore More
            </span>
            <div className="w-5 h-9 rounded-full border-2 border-white/40 flex items-start justify-center p-1 group-hover:border-white/80 transition-colors">
              <span className="w-1 h-2 rounded-full bg-white animate-bounce" />
            </div>
          </a>
        </main>
      </div>

      {/* 
        ========================================================================
        MAIN PAGE SECTIONS (About, Events, Registration CTA, Footer)
        ========================================================================
      */}
      <AboutSection />
      <EventsHighlightSection />
      <CtaBannerSection />
      <SiteFooter />

      {/* 
        ========================================================================
        2. FULL-SCREEN INITIAL LOGO INTRO OVERLAY (Smooth Logo Effect on Black)
        ========================================================================
      */}
      {introOverlayActive && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black px-6 py-16 text-center select-none overflow-hidden">
          {/* WebGL Animated Aurora Gradient in Background */}
          <div className="absolute inset-0 z-0 opacity-75">
            <AnimatedGradient
              config={{
                preset: "Aurora",
                speed: 18,
              }}
              noise={{ opacity: 0.12, scale: 1 }}
            />
            {/* Smooth Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/85 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90 pointer-events-none" />
          </div>

          {/* Centered Composition Container */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[300px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[480px]">
            {/* Animated Hult Prize Logo */}
            <div className="w-full">
              <HultLogoIntro
                className="w-full"
                onEnded={() => {
                  debug.log(
                    "intro",
                    "HultLogoIntro.onEnded fired -> setIntroLogoEnded(true)"
                  );
                  setIntroLogoEnded(true);
                }}
              />
            </div>

            {/* Subtitle Under Logo */}
            <p
              className={`fade-in-heritage -mt-3 sm:-mt-5 md:-mt-6 w-full text-center text-[10px] sm:text-xs md:text-sm font-medium tracking-[0.24em] text-white/90 uppercase select-none ${introLogoEnded ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              Heritage Institute of Technology
            </p>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        3. CINEMATIC THREE.JS CLOUD REVEAL TRANSITION OVERLAY
        - Volumetric fluffy clouds enter from LEFT & RIGHT
        - 100% full-screen cloud whiteout cover hold (~400ms)
        - Parting center split curtain reveal: Sky -> HULT PRIZE -> Campus
        ========================================================================
      */}
      <CloudRevealTransition
        isActive={isCloudTransitionActive}
        onCovered={() => {
          hasIntroPlayedGlobal = true;
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("hult_intro_played", "true");
            } catch {}
          }
          debug.log(
            "intro",
            "Cloud onCovered -> removing intro overlay, revealing landing"
          );
          setIntroOverlayActive(false);
          setIsLandingRevealed(true);
        }}
        onComplete={() => {
          hasIntroPlayedGlobal = true;
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("hult_intro_played", "true");
            } catch {}
          }
          debug.log("intro", "Cloud onComplete -> intro sequence finished");
          setIsCloudTransitionActive(false);
        }}
      />
    </div>
  );
}

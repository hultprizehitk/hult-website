"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import HultLogoIntro from "./components/HultLogoIntro";
import ThreeBirds from "./components/ThreeBirds";
import CloudRevealTransition from "./components/CloudRevealTransition";
import ClothWindOverlay from "./components/ClothWindOverlay";
import AboutSection from "./components/AboutSection";
import AnimatedGradient from "@/components/ui/animated-gradient";
import { debug } from "@/lib/debug-logger";

// In-memory session flag: resets on browser refresh, persists across Next.js route transitions
let hasIntroPlayedGlobal = false;

export default function Home() {
  const [introLogoEnded, setIntroLogoEnded] = useState(() => hasIntroPlayedGlobal);
  const [isCloudTransitionActive, setIsCloudTransitionActive] = useState(false);
  const [introOverlayActive, setIntroOverlayActive] = useState(() => !hasIntroPlayedGlobal);
  const [isLandingRevealed, setIsLandingRevealed] = useState(() => hasIntroPlayedGlobal);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mouse Parallax coordinates (subtle offsets in pixels)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll listener to update header glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trigger Cloud Transition ~400ms after logo intro sequence ends (only if intro hasn't already played)
  useEffect(() => {
    if (hasIntroPlayedGlobal) return;
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
        <header
          className={`fixed top-0 inset-x-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-syne)] bg-transparent border-none ${
            isLandingRevealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          {/* Brand Logos */}
          <div className="flex items-center gap-2 sm:gap-3 transition-opacity duration-700">
            <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8 md:h-9">
              <Image
                src="/Hult-Prize.png"
                alt="Hult Prize Logo"
                fill
                sizes="(max-width: 640px) 46px, 66px"
                priority
                className="object-contain drop-shadow-md"
              />
            </Link>
            <div className="relative aspect-[1024/895] h-7 sm:h-8 md:h-9">
              <Image
                src="/hitk-25-logo.png"
                alt="Heritage Institute of Technology 25 Years Logo"
                fill
                sizes="(max-width: 640px) 40px, 56px"
                priority
                className="object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-[family-name:var(--font-syne)]">
            <a
              href="#about"
              className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
            >
              About
            </a>
            <Link
              href="/events"
              className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
            >
              Events
            </Link>
            <a
              href="#challenge"
              className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
            >
              Challenge
            </a>
            <a
              href="#timeline"
              className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
            >
              Timeline
            </a>
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-[#f20089]/40 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
            >
              Register Now
            </Link>
          </nav>

          {/* Mobile Right Bar: Compact Register + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md shadow-[#f20089]/40 active:scale-95"
            >
              Register
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Slide-Down Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-[52px] z-45 md:hidden bg-black/95 backdrop-blur-3xl border-b border-white/15 px-6 py-6 shadow-2xl flex flex-col gap-4 font-[family-name:var(--font-syne)] animate-in fade-in slide-in-from-top-2 duration-200">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
            >
              About
            </a>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
            >
              Events Calendar
            </Link>
            <a
              href="#challenge"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
            >
              Challenge
            </a>
            <a
              href="#timeline"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
            >
              Timeline
            </a>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 text-center rounded-full bg-[#f20089] py-3 text-sm font-bold text-white shadow-lg shadow-[#f20089]/40"
            >
              Register for OnCampus 2027
            </Link>
          </div>
        )}

        {/* Main Area with subtle scroll down indicator (z-20) */}
        <main className="flex-1 relative z-20 flex flex-col items-center justify-end pb-6 sm:pb-10">
          <a
            href="#about"
            aria-label="Scroll down to About Us section"
            className={`group flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${
              isLandingRevealed ? "opacity-75 hover:opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-[0.25em] text-white/70 uppercase select-none group-hover:text-white transition-colors">
              Explore
            </span>
            <div className="w-5 h-9 rounded-full border-2 border-white/40 flex items-start justify-center p-1 group-hover:border-white/80 transition-colors">
              <span className="w-1 h-2 rounded-full bg-white animate-bounce" />
            </div>
          </a>
        </main>
      </div>

      {/* 
        ========================================================================
        ABOUT US SECTION (Features social entrepreneurship, mission, and pillars)
        ========================================================================
      */}
      <AboutSection />

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
          debug.log(
            "intro",
            "Cloud onCovered -> removing intro overlay, revealing landing"
          );
          setIntroOverlayActive(false);
          setIsLandingRevealed(true);
        }}
        onComplete={() => {
          hasIntroPlayedGlobal = true;
          debug.log("intro", "Cloud onComplete -> intro sequence finished");
          setIsCloudTransitionActive(false);
        }}
      />
    </div>
  );
}

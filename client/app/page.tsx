"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import HultLogoIntro from "./components/HultLogoIntro";
import ThreeBirds from "./components/ThreeBirds";
import CloudRevealTransition from "./components/CloudRevealTransition";
import AnimatedGradient from "@/components/ui/animated-gradient";

export default function Home() {
  const [introLogoEnded, setIntroLogoEnded] = useState(false);
  const [isCloudTransitionActive, setIsCloudTransitionActive] = useState(false);
  const [introOverlayActive, setIntroOverlayActive] = useState(true);
  const [isLandingRevealed, setIsLandingRevealed] = useState(false);

  // Mouse Parallax coordinates (subtle offsets in pixels)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger Cloud Transition ~400ms after logo intro sequence ends
  useEffect(() => {
    if (introLogoEnded) {
      const timer = setTimeout(() => {
        setIsCloudTransitionActive(true);
      }, 400);
      return () => clearTimeout(timer);
    }
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

  return (
    <div
      suppressHydrationWarning
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-white selection:text-black"
    >
      {/* 
        ========================================================================
        1. MAIN LANDING PAGE (Features Campus View, Sky Title, Clouds & Birds)
        ========================================================================
      */}
      <div className="relative min-h-screen w-full flex flex-col justify-between">
        {/* Full-Screen Campus Photograph Background Layer with Micro-Parallax */}
        <div
          className="absolute inset-0 z-0 parallax-smooth"
          style={{
            transform: `translate3d(${mouseOffset.x * 2}px, ${mouseOffset.y * 1.5}px, 0) scale(1.02)`,
          }}
        >
          <Image
            src="/heritage-landing.png"
            alt="Heritage Institute of Technology Campus"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center animate-landing-hero"
          />

          {/* 
            ====================================================================
            Vertical Hult Prize Banners on Two Sides of the Building
            - Positioned relative to the exact coordinate space of the building
            - z-index: sits right on the building facade (below clouds & birds)
            - Inherits building parallax so it stays 100% pinned to the walls
            ====================================================================
          */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-[1]">
            <div className="relative aspect-[3344/1882] min-w-full min-h-full w-auto h-auto shrink-0">
              {/* Left Side Building Banner */}
              <div 
                className="absolute top-[32.8%] left-[13.8%] w-[1.7%] h-[48%] transition-transform duration-500 hover:scale-105"
                style={{
                  filter: "drop-shadow(2px 4px 10px rgba(0, 0, 0, 0.45))",
                }}
              >
                <Image
                  src="/hult-banner-vertical.png"
                  alt="HULT PRIZE HITK 2027 Left Banner"
                  fill
                  sizes="40px"
                  priority
                  className="object-contain object-top"
                />
              </div>

              {/* Right Side Building Banner */}
              <div 
                className="absolute top-[32.8%] right-[13.8%] w-[1.7%] h-[48%] transition-transform duration-500 hover:scale-105"
                style={{
                  filter: "drop-shadow(-2px 4px 10px rgba(0, 0, 0, 0.45))",
                }}
              >
                <Image
                  src="/hult-banner-vertical.png"
                  alt="HULT PRIZE HITK 2027 Right Banner"
                  fill
                  sizes="40px"
                  priority
                  className="object-contain object-top"
                />
              </div>
            </div>
          </div>

          {/* Very subtle top gradient to ensure navbar clarity */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent z-[2]" />
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
          Upper Sky "HULT PRIZE" Cinematic Bold Typography
          - Positioned higher in the sky to clear the roofline gracefully
          - Translucent white/light-blue gradient so clouds remain visible
          - 1.5s Entrance animation starts when landing page is revealed
          - Micro-parallax responds smoothly to mouse motion
          ========================================================================
        */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-[9%] sm:top-[10%] md:top-[11%] lg:top-[12%] xl:top-[13%] z-10 flex items-center justify-center px-4 parallax-smooth ${
            isLandingRevealed ? "animate-sky-entrance" : "opacity-0"
          }`}
          style={{
            transform: `translate3d(${mouseOffset.x * 4}px, ${mouseOffset.y * 3}px, 0)`,
          }}
        >
          <div className="animate-sky-floating flex items-center justify-center">
            <h1 className="sky-hult-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[9.5rem] 2xl:text-[11rem] font-bold uppercase tracking-[0.06em] sm:tracking-[0.08em] leading-none text-center select-none">
              HULT PRIZE
            </h1>
          </div>
        </div>

        {/* 
          ========================================================================
          Header Navigation (Stable, Glassmorphic, and Responsive)
          ========================================================================
        */}
        <header className="relative z-20 flex w-full items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-8">
          <div className="flex items-center gap-2.5 sm:gap-3 transition-opacity duration-700">
            {/* Official Hult Prize Logo Image */}
            <div className="relative aspect-[1080/659] h-7 sm:h-9 md:h-10">
              <Image
                src="/Hult-Prize.png"
                alt="Hult Prize Logo"
                fill
                sizes="(max-width: 640px) 46px, 66px"
                priority
                className="object-contain drop-shadow-md"
              />
            </div>

            {/* Heritage Institute 25 Years Celebration Logo */}
            <div className="relative aspect-[1024/895] h-7 sm:h-9 md:h-10">
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

          <nav className="flex items-center gap-4 sm:gap-6">
            <a
              href="#about"
              className="text-sm font-medium text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
            >
              About
            </a>
            <a
              href="#challenge"
              className="text-sm font-medium text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
            >
              Challenge
            </a>
            <a
              href="#timeline"
              className="hidden text-sm font-medium text-white/85 drop-shadow transition-colors duration-200 hover:text-white sm:inline-block"
            >
              Timeline
            </a>
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#f20089]/40 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98] sm:text-sm"
            >
              Register Now
            </Link>
          </nav>
        </header>

        {/* Empty Main Area to allow the photo, sky title, and birds to shine unobstructed */}
        <main className="flex-1 relative z-10" />
      </div>

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
                onEnded={() => setIntroLogoEnded(true)}
              />
            </div>

            {/* Subtitle Under Logo */}
            <p
              className={`fade-in-heritage -mt-3 sm:-mt-5 md:-mt-6 w-full text-center text-[10px] sm:text-xs md:text-sm font-medium tracking-[0.24em] text-white/90 uppercase select-none ${
                introLogoEnded ? "opacity-100" : "opacity-0 pointer-events-none"
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
          setIntroOverlayActive(false);
          setIsLandingRevealed(true);
        }}
        onComplete={() => {
          setIsCloudTransitionActive(false);
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import SiteHeader from "@/components/layout/SiteHeader";

interface HeroInterfaceOverlayProps {
  scrollProgress?: number;
}

export default function HeroInterfaceOverlay({ scrollProgress = 0 }: HeroInterfaceOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const sideOpacity = Math.max(0, 1 - scrollProgress * 2.6);
  const bottomOpacity = Math.max(0, 1 - scrollProgress * 10.0);

  return (
    <>
      {/* External Bodoni Moda, Cinzel, & Script Calligraphy Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,700;0,6..96,800;0,6..96,900;1,6..96,700;1,6..96,800&family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,600&family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        @font-face {
          font-family: 'Jomolhari';
          src: url('/assets/hult-prize-hero/source-generations/Jomolhari-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .font-monumental {
          font-family: 'Cinzel', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
          letter-spacing: 0.03em;
        }

        .font-jomolhari {
          font-family: 'Cinzel', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        }

        .font-bodoni,
        .font-bidoni {
          font-family: 'Cinzel', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        }

        .font-del-rose {
          font-family: 'DelRose', 'Cinzel', 'Bodoni Moda', Georgia, serif;
        }

        .font-hult-serif {
          font-family: 'Cinzel', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        }

        .font-hult-script {
          font-family: 'Caveat', cursive;
        }

        /* Luminous Light White / Platinum Ivory Headlines */
        .hult-title-gradient {
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 80%, #CBD5E1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          filter: drop-shadow(0 2px 24px rgba(255, 255, 255, 0.28)) drop-shadow(0 8px 32px rgba(0, 0, 0, 0.85));
        }

        .prize-title-gradient {
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 80%, #94A3B8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          filter: drop-shadow(0 2px 24px rgba(255, 255, 255, 0.28)) drop-shadow(0 8px 32px rgba(0, 0, 0, 0.85));
        }
      `}</style>

      {/* ========================================================= */}
      {/* 1. LEFT COLUMN ACCENTS (z-[55])                           */}
      {/* ========================================================= */}
      <div
        className={`absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-[55] hidden sm:flex flex-col items-center pointer-events-none select-none transition-all duration-1000 delay-800 ease-out ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
        }`}
        style={{
          opacity: mounted ? sideOpacity : 0,
          transform: `translate3d(${-scrollProgress * 45 + (mounted ? 0 : -24)}px, -50%, 0)`,
        }}
      >
        <span className="font-bold text-xs text-white/90 tracking-wider drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">01</span>
        <div className="my-3 flex flex-col items-center gap-1.5 opacity-80">
          <span className="h-1 w-1 rounded-full bg-white/70" />
          <span className="h-1 w-1 rounded-full bg-white/70" />
          <span className="h-1 w-1 rounded-full bg-white/70" />
          <span className="h-1 w-1 rounded-full bg-white/70" />
          <span className="h-10 w-px bg-white/30 my-1" />
        </div>
        <div className="flex flex-col text-[8.5px] font-bold text-white/75 uppercase tracking-[0.25em] leading-loose text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          <span>Young</span>
          <span>Minds</span>
          <span>Bigger</span>
          <span>Possibilities</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. RIGHT COLUMN ACCENTS & SCRIPT CALLIGRAPHY (z-[55])     */}
      {/* ========================================================= */}
      <div
        className={`absolute right-8 sm:right-16 md:right-24 top-[32%] sm:top-[35%] z-[55] pointer-events-none select-none flex flex-col items-start transition-all duration-1000 delay-800 ease-out ${
          mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
        }`}
        style={{
          opacity: mounted ? sideOpacity : 0,
          transform: `translate3d(${scrollProgress * 45 + (mounted ? 0 : 24)}px, 0, 0)`,
        }}
      >
        {/* Soft Circular Glass Ring Background */}
        <div className="absolute -top-16 -left-12 w-64 sm:w-80 h-64 sm:h-80 rounded-full border border-white/20 bg-white/[0.02] backdrop-blur-[2px] pointer-events-none -z-10" />

        {/* Signature Script Calligraphy */}
        <div className="font-hult-script text-3xl sm:text-4xl text-white/95 leading-[1.05] tracking-wide rotate-[-3deg] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          <div>People</div>
          <div className="ml-1.5">Ideas</div>
          <div className="ml-3">Impact</div>
        </div>

        {/* Lower Right Microcopy */}
        <div className="mt-20 sm:mt-28 flex flex-col text-[8.5px] font-bold text-white/75 uppercase tracking-[0.25em] leading-loose drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          <span>From</span>
          <span>Heritage</span>
          <span>To A Brighter</span>
          <span>World</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. BOTTOM BAR (z-[90])                                    */}
      {/* ========================================================= */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-between px-6 sm:px-10 md:px-14 py-4 select-none transition-all duration-1000 delay-1000 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{
          opacity: mounted ? bottomOpacity : 0,
          pointerEvents: scrollProgress > 0.08 ? "none" : "auto",
        }}
      >
        {/* Left Scroll Cue */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("about");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors pointer-events-auto cursor-pointer group"
          aria-label="Scroll down to About section"
        >
          <div className="h-7 w-5 rounded-full border border-white/40 p-0.5 flex justify-center group-hover:border-white">
            <span className="h-1.5 w-0.5 rounded-full bg-white group-hover:bg-white animate-bounce" />
          </div>
          <div className="flex flex-col text-[9px] leading-none tracking-widest font-semibold uppercase text-left drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            <span className="text-white group-hover:text-white">Scroll</span>
            <span className="text-white/60 lowercase text-[8px]">to explore</span>
          </div>
        </button>

        {/* Center Heritage Tagline */}
        <div className="hidden md:flex items-center gap-3 pointer-events-none">
          <span className="h-px w-8 bg-white/30" />
          <span className="text-[9.5px] font-semibold tracking-[0.22em] text-white/75 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            Hult Prize At Heritage Institute Of Technology
          </span>
          <span className="h-px w-8 bg-white/30" />
        </div>

        {/* Right Socials & Motto */}
        <div className="flex items-center gap-4 text-white/80 pointer-events-auto">
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              aria-label="Instagram"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              aria-label="LinkedIn"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              aria-label="YouTube"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          <span className="hidden xl:inline-block text-[8px] font-semibold text-white/70 uppercase tracking-[0.2em] max-w-[150px] leading-tight text-right drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            A More Inclusive Sustainable And Thriving World
          </span>
        </div>
      </footer>
    </>
  );
}

export function HeroCenterpiece({ scrollProgress = 0 }: HeroInterfaceOverlayProps) {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const contentOpacity = Math.max(0, 1 - scrollProgress * 2.2);

  return (
    <>
      {/* Centerpiece Monumental Typography at z-index 50 (elevated in FRONT of all cutout layers) */}
      <div
        className="absolute inset-0 z-[50] flex flex-col items-center justify-center pt-12 sm:pt-16 pointer-events-none select-none px-4 transition-transform duration-75 ease-out"
        style={{
          opacity: contentOpacity,
          transform: `translate3d(0, ${-scrollProgress * 110}px, 0) scale(${Math.max(0.88, 1 - scrollProgress * 0.08)})`,
        }}
      >
        {/* Subtle luminous ambient glow behind letters */}
        <div
          className={`absolute pointer-events-none -z-10 transition-opacity duration-1000 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: "32%",
            left: "52%",
            width: "560px",
            height: "360px",
            background:
              "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12) 0%, rgba(226, 232, 240, 0.03) 45%, transparent 75%)",
            filter: "blur(48px)",
            transform: "translate3d(-50%, -50%, 0)",
          }}
        />

        {/* Top Eyebrow Hairline Bar (Entrance Slide Down) */}
        <div
          className={`flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3 transition-all duration-1000 delay-300 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
          }`}
        >
          <span className="h-px w-10 sm:w-16 bg-white/60" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            A Global Movement For A Better Tomorrow
          </span>
          <span className="h-px w-10 sm:w-16 bg-white/60" />
        </div>

        {/* Main Double-Row Headline */}
        <div className="relative flex flex-col items-center text-center leading-[0.85] tracking-tight">
          {/* Row 1: HULT (Entrance glide down from top) */}
          <div
            className={`relative transition-all duration-1000 delay-500 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
            }`}
          >
            <h1 className="font-monumental text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11rem] font-bold tracking-wider hult-title-gradient">
              HULT
            </h1>
          </div>

          {/* Row 2: PRIZE (Entrance glide up from bottom) */}
          <div
            className={`relative mt-1 sm:mt-2 md:mt-3 transition-all duration-1000 delay-700 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <span className="font-monumental text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11rem] font-bold tracking-wider prize-title-gradient">
              PRIZE
            </span>
          </div>
        </div>

        {/* Primary CTA — high-contrast white pill */}
        <div
          className={`relative z-[60] mt-6 sm:mt-8 pointer-events-auto transition-all duration-1000 delay-900 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link
            href={status === "authenticated" ? "/profile" : "/register"}
            className="flex items-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-8 py-3.5 text-sm font-semibold text-neutral-950 shadow-xl shadow-black/40 border border-white/80 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>{status === "authenticated" ? "View Student Pass" : "Be the Change"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

export function HeroNavbar() {
  return <SiteHeader />;
}


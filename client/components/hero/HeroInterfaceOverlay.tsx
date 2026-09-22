"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

interface HeroInterfaceOverlayProps {
  scrollProgress?: number;
}

export default function HeroInterfaceOverlay({ scrollProgress = 0 }: HeroInterfaceOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const isScrolled = scrollProgress > 0.05;
  const contentOpacity = Math.max(0, 1 - scrollProgress * 2.2);
  const sideOpacity = Math.max(0, 1 - scrollProgress * 2.6);
  const bottomOpacity = Math.max(0, 1 - scrollProgress * 10.0);

  return (
    <>
      {/* External Perandory, Bodoni Moda, & Script Calligraphy Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,700;0,6..96,800;0,6..96,900;1,6..96,700;1,6..96,800&family=Libre+Bodoni:ital,wght@0,700;1,700&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,600&family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        @font-face {
          font-family: 'Jomolhari';
          src: url('/assets/hult-prize-hero/source-generations/Jomolhari-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .font-jomolhari {
          font-family: 'Jomolhari', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        }

        .font-bodoni,
        .font-bidoni {
          font-family: 'Jomolhari', 'Bodoni Moda', 'Libre Bodoni', 'Bodoni MT', Didot, serif;
        }

        .font-del-rose {
          font-family: 'DelRose', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        }

        .font-hult-serif {
          font-family: 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        }

        .font-hult-script {
          font-family: 'Caveat', cursive;
        }

        /* HULT: Deep Heritage Charcoal-Black */
        .hult-title-gradient {
          background: linear-gradient(148deg, #090d16 0%, #1e293b 52%, #0f172a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        /* PRIZE: Deep Monumental Heritage Charcoal-Slate */
        .prize-title-gradient {
          background: linear-gradient(148deg, #090d16 0%, #1e293b 50%, #0f172a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
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
        <span className="font-bold text-xs text-neutral-900 tracking-wider">01</span>
        <div className="my-3 flex flex-col items-center gap-1.5 opacity-60">
          <span className="h-1 w-1 rounded-full bg-neutral-800" />
          <span className="h-1 w-1 rounded-full bg-neutral-800" />
          <span className="h-1 w-1 rounded-full bg-neutral-800" />
          <span className="h-1 w-1 rounded-full bg-neutral-800" />
          <span className="h-10 w-px bg-neutral-800/30 my-1" />
        </div>
        <div className="flex flex-col text-[8.5px] font-bold text-neutral-700 uppercase tracking-[0.25em] leading-loose text-center">
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
        <div className="absolute -top-16 -left-12 w-64 sm:w-80 h-64 sm:h-80 rounded-full border border-white/40 bg-white/[0.03] backdrop-blur-[1px] pointer-events-none -z-10" />

        {/* Signature Script Calligraphy */}
        <div className="font-hult-script text-3xl sm:text-4xl text-[#65535e] leading-[1.05] tracking-wide rotate-[-3deg] drop-shadow-sm">
          <div>People</div>
          <div className="ml-1.5">Ideas</div>
          <div className="ml-3">Impact</div>
        </div>

        {/* Lower Right Microcopy */}
        <div className="mt-20 sm:mt-28 flex flex-col text-[8.5px] font-bold text-neutral-700 uppercase tracking-[0.25em] leading-loose">
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
          className="flex items-center gap-2 text-neutral-700 hover:text-neutral-950 transition-colors pointer-events-auto cursor-pointer group"
          aria-label="Scroll down to About section"
        >
          <div className="h-7 w-5 rounded-full border border-neutral-600/70 p-0.5 flex justify-center group-hover:border-neutral-900">
            <span className="h-1.5 w-0.5 rounded-full bg-neutral-700 group-hover:bg-neutral-900 animate-bounce" />
          </div>
          <div className="flex flex-col text-[9px] leading-none tracking-widest font-semibold uppercase text-left">
            <span className="text-neutral-900 group-hover:text-black">Scroll</span>
            <span className="text-neutral-500 lowercase text-[8px]">to explore</span>
          </div>
        </button>

        {/* Center Heritage Tagline */}
        <div className="hidden md:flex items-center gap-3 pointer-events-none">
          <span className="h-px w-8 bg-neutral-700/30" />
          <span className="text-[9.5px] font-semibold tracking-[0.22em] text-neutral-800 uppercase">
            Hult Prize At Heritage Institute Of Technology
          </span>
          <span className="h-px w-8 bg-neutral-700/30" />
        </div>

        {/* Right Socials & Motto */}
        <div className="flex items-center gap-4 text-neutral-700 pointer-events-auto">
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-neutral-950"
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
              className="transition-colors hover:text-neutral-950"
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
              className="transition-colors hover:text-neutral-950"
              aria-label="YouTube"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          <span className="hidden xl:inline-block text-[8px] font-semibold text-neutral-600 uppercase tracking-[0.2em] max-w-[150px] leading-tight text-right">
            A More Inclusive Sustainable And Thriving World
          </span>
        </div>
      </footer>
    </>
  );
}

export function HeroCenterpiece({ scrollProgress = 0 }: HeroInterfaceOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const contentOpacity = Math.max(0, 1 - scrollProgress * 2.2);

  return (
    <>
      {/* Centerpiece Monumental Typography at z-index 8 (layered behind Z09 and Z10 people) */}
      <div
        className="absolute inset-0 z-[8] flex flex-col items-center justify-center pt-12 sm:pt-16 pointer-events-none select-none px-4 transition-transform duration-75 ease-out"
        style={{
          opacity: contentOpacity,
          transform: `translate3d(0, ${-scrollProgress * 110}px, 0) scale(${Math.max(0.88, 1 - scrollProgress * 0.08)})`,
        }}
      >
        {/* Subtle neutral radial glow behind letters */}
        <div
          className={`absolute pointer-events-none -z-10 transition-opacity duration-1000 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: "32%",
            left: "52%",
            width: "420px",
            height: "280px",
            background:
              "radial-gradient(ellipse at center, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.01) 42%, transparent 75%)",
            filter: "blur(38px)",
            transform: "translate3d(-15%, -8%, 0)",
          }}
        />

        {/* Top Eyebrow Hairline Bar (Entrance Slide Down) */}
        <div
          className={`flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3 transition-all duration-1000 delay-300 ease-out ${
            mounted ? "opacity-95 translate-y-0" : "opacity-0 -translate-y-3"
          }`}
        >
          <span className="h-px w-10 sm:w-16 bg-white/50" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-white uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
            A Global Movement For A Better Tomorrow
          </span>
          <span className="h-px w-10 sm:w-16 bg-white/50" />
        </div>

        {/* Main Double-Row Headline */}
        <div className="relative flex flex-col items-center text-center leading-[0.82] tracking-tight">
          {/* Row 1: HULT (Entrance glide down from top) */}
          <div
            className={`relative transition-all duration-1000 delay-500 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
            }`}
          >
            <h1 className="font-jomolhari text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] xl:text-[10rem] font-normal tracking-tight hult-title-gradient drop-shadow-[0_2px_18px_rgba(0,0,0,0.08)]">
              HULT
            </h1>
          </div>

          {/* Row 2: PRIZE™ (Entrance glide up from bottom) */}
          <div
            className={`relative mt-1 sm:mt-2 md:mt-3 transition-all duration-1000 delay-700 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <span className="font-jomolhari text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] xl:text-[10rem] font-normal tracking-tight prize-title-gradient drop-shadow-[0_2px_18px_rgba(0,0,0,0.08)]">
              PRIZE
            </span>
          </div>
        </div>

        {/* Primary CTA — standalone, high z-index, no backing box */}
        <div
          className={`relative z-[60] mt-6 sm:mt-8 pointer-events-auto transition-all duration-1000 delay-900 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-full bg-neutral-900 hover:bg-neutral-800 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-neutral-900/40 border border-neutral-700/50 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span>Be the Change</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

export function HeroNavbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-10 md:px-14 py-5 bg-transparent text-neutral-900 pointer-events-auto select-none">
      {/* Brand Lockup Left */}
      <div className="flex items-center gap-3 select-none">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-9 w-[54px] transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/ef-hult-prize-logo.png"
              alt="EF Hult Prize Logo"
              fill
              sizes="54px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Thin Hairline Divider */}
        <div className="h-6 w-px bg-[#6F302B]/20" />

        {/* 25 Heritage Institute of Technology Badge */}
        <div className="flex items-center gap-2">
          <span className="font-hult-serif text-2xl font-bold leading-none text-neutral-900">
            25
          </span>
          <div className="flex flex-col text-[8.5px] font-semibold uppercase tracking-[0.14em] leading-tight max-w-[125px] text-neutral-800">
            <span>Heritage</span>
            <span>Institute of Technology</span>
          </div>
        </div>
      </div>

      {/* Navigation Links Center */}
      <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium select-none text-neutral-800">
        <Link
          href="/"
          className="relative transition-colors duration-200 hover:text-neutral-900 after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-neutral-900 hover:after:w-full after:transition-all after:duration-200"
        >
          Home
        </Link>
        <Link
          href="#about"
          className="relative transition-colors duration-200 hover:text-neutral-900 after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-neutral-900 hover:after:w-full after:transition-all after:duration-200"
        >
          About
        </Link>
        <Link
          href="/events"
          className="relative transition-colors duration-200 hover:text-neutral-900 after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-neutral-900 hover:after:w-full after:transition-all after:duration-200"
        >
          Events
        </Link>
      </nav>

      {/* Right CTA Group */}
      <div className="flex items-center gap-4 select-none">
        <span className="hidden lg:inline-block font-serif italic text-xs text-neutral-500 tracking-wide">
          Ideas for a Brighter Tomorrow
        </span>
        <Link
          href="/register"
          className="flex items-center gap-2 rounded-full bg-neutral-900 hover:bg-neutral-800 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-neutral-900/20 border border-neutral-700/40 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span>Register Now</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

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

  const bottomOpacity = Math.max(0, 1 - scrollProgress * 10.0);

  return (
    <>
      {/* External IM Fell Double Pica, Arizonia, Cinzel, & Script Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Arizonia&family=IM+Fell+Double+Pica:ital@0;1&family=Bodoni+Moda:ital,opsz,wght@0,6..96,700;0,6..96,800;0,6..96,900;1,6..96,700;1,6..96,800&family=Cinzel:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,400;1,600;1,700&family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        @font-face {
          font-family: 'Jomolhari';
          src: url('/assets/hult-prize-hero/source-generations/Jomolhari-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .font-im-fell {
          font-family: 'IM Fell Double Pica', Georgia, serif;
        }

        .font-arizonia {
          font-family: 'Arizonia', cursive;
        }

        .font-monumental {
          font-family: 'Cinzel', 'Bodoni Moda', 'Playfair Display', Georgia, serif;
          letter-spacing: 0.03em;
        }

        .font-cinzel {
          font-family: 'Cinzel', 'Bodoni Moda', Georgia, serif;
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
          font-family: 'Arizonia', 'Caveat', cursive;
        }
      `}</style>

      {/* ========================================================= */}
      {/* BOTTOM SCROLL CUE (z-[90]) — minimal                      */}
      {/* ========================================================= */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-center px-6 sm:px-10 md:px-14 py-4 select-none transition-all duration-1000 delay-1000 ease-out ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        style={{
          opacity: mounted ? bottomOpacity : 0,
          pointerEvents: scrollProgress > 0.08 ? "none" : "auto",
        }}
      >
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

  // ── Scroll Phase Calculations ──
  const p1 = Math.min(1, scrollProgress / 0.32);
  const ease1 = Math.sin((p1 * Math.PI) / 2);

  const currentLeft = 126 - ease1 * 38; // 126px -> 88px (left aligned)
  const currentTop = 215 - ease1 * 55; // 215px -> 160px (shifted downwards into hero section space)
  const currentScale = 1.0 - ease1 * 0.18; // Overall container scale adjustment

  // 1. "HERITAGE INSTITUTE OF TECHNOLOGY" & "presents" fade out completely on scroll
  const heritageFadeProgress = Math.min(1, Math.max(0, (scrollProgress - 0.02) / 0.14));
  const heritageOpacity = Math.max(0, 1 - heritageFadeProgress);
  const heritageY = -heritageFadeProgress * 18;

  // 2. Direct Text Morphing Progress: "7TH Edition of" -> "ABOUT"
  const morphProgress = Math.min(1, Math.max(0, (scrollProgress - 0.02) / 0.20));
  const easeMorph = Math.sin((morphProgress * Math.PI) / 2);

  const editionOpacity = Math.max(0, 1 - easeMorph * 1.2);
  const editionY = -easeMorph * 14;
  const editionScale = 1.0 - easeMorph * 0.12;
  const editionBlur = easeMorph * 4;

  const aboutOpacity = Math.min(1, easeMorph * 1.2);
  const aboutY = (1 - easeMorph) * 14;
  const aboutScale = 0.88 + easeMorph * 0.12;
  const aboutBlur = (1 - easeMorph) * 4;

  // 3. "HULT PRIZE" scale down (FIXED baseline, zero independent upward motion!)
  const hultPrizeTop = 138; 
  const hultPrizeScale = 1.0 - ease1 * 0.26; // Scales down ("thoda small") smoothly with diagonal scroll

  // 4. Paragraph & Frosted Pills fade in under HULT PRIZE
  const paragraphOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.10) / 0.18));
  const paragraphY = (1 - paragraphOpacity) * 20;

  // Exit Phase (0.48+): Disappears smoothly as trees/human layer exit
  const exitProgress = Math.min(1, Math.max(0, (scrollProgress - 0.48) / 0.22));
  const overallOpacity = Math.max(0, 1 - exitProgress * 1.4);

  return (
    <div
      className="absolute pointer-events-none select-none z-[50]"
      style={{
        left: `${currentLeft}px`,
        top: `${currentTop}px`,
        width: "970px",
        height: "480px",
        transformOrigin: "left top",
        transform: `scale(${currentScale})`,
        opacity: mounted ? overallOpacity : 0,
        visibility: overallOpacity > 0.005 ? "visible" : "hidden",
        transition: "opacity 0.15s ease-out",
        willChange: "transform, opacity",
      }}
    >
      {/* HERITAGE INSTITUTE OF TECHNOLOGY — Fades out and completely removed in ABOUT phase */}
      <div
        style={{
          position: "absolute",
          width: "969px",
          height: "57px",
          left: "0px",
          top: "0px",
          fontFamily: "'IM Fell Double Pica', Georgia, serif",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "45.185px",
          lineHeight: "57px",
          color: "#2D052A",
          whiteSpace: "nowrap",
          opacity: heritageOpacity,
          transform: `translate3d(0, ${heritageY}px, 0)`,
          visibility: heritageOpacity > 0.005 ? "visible" : "hidden",
          transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
          pointerEvents: "none",
        }}
      >
        HERITAGE INSTITUTE OF TECHNOLOGY
      </div>

      {/* presents — Fades out and completely removed in ABOUT phase */}
      <div
        style={{
          position: "absolute",
          width: "180px",
          height: "70px",
          left: "394.5px",
          top: "48px",
          fontFamily: "'Arizonia', cursive",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "42.6698px",
          lineHeight: "60px",
          paddingTop: "4px",
          overflow: "visible",
          background: "linear-gradient(180deg, #501F00 0%, #B64700 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          whiteSpace: "nowrap",
          opacity: heritageOpacity,
          transform: `translate3d(0, ${heritageY}px, 0)`,
          visibility: heritageOpacity > 0.005 ? "visible" : "hidden",
          transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
          pointerEvents: "none",
        }}
      >
        presents
      </div>

      {/* 7th Edition -> ABOUT Morphing Container */}
      <div
        style={{
          position: "absolute",
          left: "0px",
          top: "92px",
          width: "200px",
          height: "43px",
          pointerEvents: "none",
        }}
      >
        {/* 7TH Edition of (Morph Out) */}
        <div
          style={{
            position: "absolute",
            left: "0px",
            top: "10.68px",
            opacity: editionOpacity,
            transform: `translate3d(0, ${editionY}px, 0) scale(${editionScale})`,
            filter: `blur(${editionBlur}px)`,
            transformOrigin: "left center",
            willChange: "transform, opacity, filter",
          }}
        >
          {/* 7 */}
          <div
            style={{
              position: "absolute",
              width: "16px",
              height: "43px",
              left: "4.19px",
              top: "-10.68px",
              fontFamily: "'IM Fell Double Pica', Georgia, serif",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: "34.1052px",
              lineHeight: "43px",
              color: "#000000",
            }}
          >
            7
          </div>

          {/* TH */}
          <div
            style={{
              position: "absolute",
              width: "9px",
              height: "7px",
              left: "20.03px",
              top: "4.73px",
              fontFamily: "'IM Fell Double Pica', Georgia, serif",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: "5.274px",
              lineHeight: "7px",
              color: "#000000",
            }}
          >
            TH
          </div>

          {/* Edition of */}
          <div
            style={{
              position: "absolute",
              width: "114px",
              height: "35px",
              left: "31.95px",
              top: "0px",
              fontFamily: "'IM Fell Double Pica', Georgia, serif",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: "27.772px",
              lineHeight: "35px",
              color: "#000000",
              whiteSpace: "nowrap",
            }}
          >
            Edition of
          </div>
        </div>

        {/* ABOUT (Morph In) — Sit cleanly at top: 0px without overlapping HULT PRIZE */}
        <div
          style={{
            position: "absolute",
            left: "4.19px",
            top: "0px",
            opacity: aboutOpacity,
            transform: `translate3d(0, ${aboutY}px, 0) scale(${aboutScale})`,
            filter: `blur(${aboutBlur}px)`,
            transformOrigin: "left center",
            fontFamily: "'IM Fell Double Pica', Georgia, serif",
            fontWeight: 400,
            fontSize: "27.772px",
            lineHeight: "35px",
            color: "#000000",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            willChange: "transform, opacity, filter",
          }}
        >
          ABOUT
        </div>
      </div>

      {/* HULT PRIZE — FIXED baseline (no independent upward motion!), smooth scale down */}
      <div
        style={{
          position: "absolute",
          width: "941.17px",
          height: "179px",
          left: "0px",
          top: `${hultPrizeTop}px`,
          transformOrigin: "left top",
          transform: `scale(${hultPrizeScale})`,
          fontFamily: "'IM Fell Double Pica', Georgia, serif",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "142.49px",
          lineHeight: "179px",
          background: "linear-gradient(180deg, #2D052A 17.76%, #931289 132.71%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          whiteSpace: "nowrap",
          transition: "transform 0.1s linear",
        }}
      >
        HULT PRIZE
      </div>

      {/* Soothing Paragraph & 3 Frost Movement Pills — Fades in under HULT PRIZE on scroll */}
      <div
        style={{
          position: "absolute",
          left: "4px",
          top: `${hultPrizeTop + 142 * hultPrizeScale + 16}px`,
          width: "600px",
          opacity: paragraphOpacity,
          transform: `translate3d(0, ${paragraphY}px, 0)`,
          transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
          pointerEvents: "none",
        }}
        className="space-y-4"
      >
        <p
          className="font-lora text-[#2D052A] text-base sm:text-lg leading-[1.75] font-medium tracking-wide"
          style={{
            fontFamily: "'Lora', 'IM Fell Double Pica', Georgia, serif",
          }}
        >
          The Hult Prize Foundation transforms how young people envision their own possibilities as leaders of change in the world around them. With a US$1,000,000 global startup prize as its anchor activity, the Hult Prize has brought impact-focused programs, events and trainings to over a million students globally, creating a pathway for youth everywhere to take action to build a better world.
        </p>

        {/* 3 Movement Taglines — Frosted Glass with Dark Violet Text */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 max-w-[580px]">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/80 bg-white/70 backdrop-blur-md text-xs font-bold tracking-wider text-[#2D052A] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#E8396E] animate-pulse" />
            <span>Join The Movement</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/80 bg-white/70 backdrop-blur-md text-xs font-bold tracking-wider text-[#2D052A] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#D97706]" />
            <span>Bring The Change</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/80 bg-white/70 backdrop-blur-md text-xs font-bold tracking-wider text-[#2D052A] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#059669]" />
            <span>Be The Changemaker</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroNavbar() {
  return <SiteHeader />;
}

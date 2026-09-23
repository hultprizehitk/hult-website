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
  // Phase 1 (0.0 -> 0.28): Screen 1 (Figma initial) transitions into Screen 2 (Figma compact)
  // Screen 1: left 126px, top 156px, scale 1.0 (Hult Prize 142.49px, Heritage 45.185px)
  // Screen 2: left 88px, top 128px, scale 0.7161 (Hult Prize 102.041px, Heritage 32.358px)
  const p1 = Math.min(1, scrollProgress / 0.28);
  const ease1 = Math.sin((p1 * Math.PI) / 2);

  const currentLeft = 126 - ease1 * 38; // 126px -> 88px
  const currentTop = 156 - ease1 * 28; // 156px -> 128px
  const currentScale = 1.0 - ease1 * 0.2839; // 1.0 -> 0.7161

  // Exit Phase (0.35+): Entire group disappears together as trees and human layer exit
  const exitProgress = Math.min(1, Math.max(0, (scrollProgress - 0.35) / 0.22));
  const overallOpacity = Math.max(0, 1 - exitProgress * 1.4);

  return (
    <div
      className="absolute pointer-events-none select-none z-[50]"
      style={{
        left: `${currentLeft}px`,
        top: `${currentTop}px`,
        width: "970px",
        height: "312px",
        transformOrigin: "left top",
        transform: `scale(${currentScale})`,
        opacity: mounted ? overallOpacity : 0,
        visibility: overallOpacity > 0.005 ? "visible" : "hidden",
        transition: "opacity 0.15s ease-out",
        willChange: "transform, opacity",
      }}
    >
      {/* HERITAGE INSTITUTE OF TECHNOLOGY */}
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
        }}
      >
        HERITAGE INSTITUTE OF TECHNOLOGY
      </div>

      {/* presents */}
      <div
        style={{
          position: "absolute",
          width: "117px",
          height: "53px",
          left: "425.9px",
          top: "50.27px",
          fontFamily: "'Arizonia', cursive",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "42.6698px",
          lineHeight: "53px",
          background: "linear-gradient(180deg, #501F00 0%, #B64700 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        presents
      </div>

      {/* Group 2087324526 (7th Edition of) */}
      {/* 7 */}
      <div
        style={{
          position: "absolute",
          width: "16px",
          height: "43px",
          left: "4.19px",
          top: "103.33px",
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
          top: "118.74px",
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
          top: "114.01px",
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

      {/* HULT PRIZE */}
      <div
        style={{
          position: "absolute",
          width: "941.17px",
          height: "179px",
          left: "0px",
          top: "131.26px",
          fontFamily: "'IM Fell Double Pica', Georgia, serif",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "142.49px",
          lineHeight: "179px",
          background: "linear-gradient(180deg, #2D052A 17.76%, #931289 132.71%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          whiteSpace: "nowrap",
        }}
      >
        HULT PRIZE
      </div>
    </div>
  );
}

export function HeroNavbar() {
  return <SiteHeader />;
}

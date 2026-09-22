"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { KOLKATA_LAYERS, KolkataLayer } from "@/lib/kolkata-layers-config";

interface KolkataHeroProps {
  mouseOffset: { x: number; y: number };
  isRevealed: boolean;
  hideText?: boolean;
  hideForeground?: boolean;
}

export default function KolkataHero({ mouseOffset, isRevealed, hideText, hideForeground }: KolkataHeroProps) {
  // Split layers into background (below text) and foreground (above text)
  const { bgLayers, fgLayers } = useMemo(() => {
    const bg: KolkataLayer[] = [];
    const fg: KolkataLayer[] = [];

    for (const layer of KOLKATA_LAYERS) {
      if (layer.rawZ <= 7) {
        bg.push(layer);
      } else {
        fg.push(layer);
      }
    }
    return { bgLayers: bg, fgLayers: fg };
  }, []);

  return (
    <div className="relative w-full h-screen min-h-[640px] max-h-[1200px] overflow-hidden select-none bg-black flex items-center justify-center">
      {/* 
        ========================================================================
        SCALED CANVAS CONTAINER (1672x941 aspect ratio maintained)
        - Mathematically preserves 1672:941 aspect ratio on all viewports
        - Zero letterboxing, zero distortion, full-bleed coverage
        ========================================================================
      */}
      <div
        className="relative shrink-0 pointer-events-none"
        style={{
          width: "max(100vw, calc(100vh * (1672 / 941)))",
          height: "max(100vh, calc(100vw * (941 / 1672)))",
          aspectRatio: "1672 / 941",
        }}
      >
        {/* 
          ====================================================================
          LAYER 0: Base Extreme Background (River Hooghly & Sky, z-1)
          ====================================================================
        */}
        <div
          className="absolute inset-0 z-[1] transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translate3d(${mouseOffset.x * 2}px, ${mouseOffset.y * 1.5}px, 0) scale(1.02)`,
          }}
        >
          <Image
            src="/assets/kolkata-ui/extreme-background.png"
            alt="Kolkata Skyline & River Hooghly Background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* 
          ====================================================================
          Subtle Drifting Ambient Cloud Layer (Sky Depth)
          ====================================================================
        */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[40%] z-[2] overflow-hidden opacity-25 mix-blend-screen transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(${mouseOffset.x * 4}px, ${mouseOffset.y * 2.5}px, 0)`,
          }}
        >
          <div className="absolute -inset-x-32 top-2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-3xl animate-cloud-drift-1" />
          <div className="absolute -inset-x-40 top-10 h-full bg-gradient-to-r from-transparent via-sky-100/40 to-transparent blur-2xl animate-cloud-drift-2" />
        </div>

        {/* 
          ====================================================================
          BACKGROUND ASSET LAYERS (Z02 - Z07: Skyline, Buildings, Bridge, Birds)
          - Rendered as 100% fill image elements within calibrated percentage bounds
          ====================================================================
        */}
        {bgLayers.map((layer) => {
          const offsetX = mouseOffset.x * layer.parallax * 12;
          const offsetY = mouseOffset.y * layer.parallax * 8;

          return (
            <div
              key={layer.id}
              className="absolute transition-transform duration-200 ease-out will-change-transform"
              style={{
                left: `${layer.leftPct}%`,
                top: `${layer.topPct}%`,
                width: `${layer.widthPct}%`,
                height: `${layer.heightPct}%`,
                zIndex: layer.zIndex,
                transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layer.src}
                alt={layer.id}
                className="w-full h-full block select-none pointer-events-none"
                loading="eager"
              />
            </div>
          );
        })}

        {/* 
          ====================================================================
          CINEMATIC "HULT PRIZE" EDITORIAL TYPOGRAPHY PLANE (z-[8] - In Upper Sky)
          - High-contrast luxury serif matching last commit / Screenshot 3 aesthetic
          - Positioned in upper sky plane behind foreground crowd & Howrah bridge
          ====================================================================
        */}
        {!hideText && (
          <div
            id="hero-layer-text"
            className={`pointer-events-none absolute inset-x-0 top-[8%] sm:top-[9%] md:top-[10%] lg:top-[11%] z-[8] flex items-center justify-center px-4 transition-all duration-700 ease-out ${
              isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              transform: `translate3d(${mouseOffset.x * 6}px, ${mouseOffset.y * 4}px, 0)`,
            }}
          >
            <div className="flex flex-col items-center justify-center text-center">
            {/* Elegant Chapter Badge */}
            <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3.5 py-1 text-[9px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-pink-200">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f20089] animate-pulse" />
              <span>01 / OnCampus Chapter</span>
            </div>

            {/* High-Contrast Editorial Serif Title */}
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[10.5rem] font-bold tracking-[0.04em] sm:tracking-[0.10em] leading-none uppercase select-none text-white drop-shadow-[0_12px_40px_rgba(0,0,0,0.95)]">
              HULT PRIZE
            </h1>

            {/* Subtitle & Italic Motto */}
            <div className="mt-2 sm:mt-3 flex items-center gap-3">
              <span className="h-[1px] w-6 sm:w-16 bg-gradient-to-r from-transparent to-[#f20089]" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.25em] sm:tracking-[0.35em] uppercase text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                Heritage Institute of Technology
              </span>
              <span className="h-[1px] w-6 sm:w-16 bg-gradient-to-l from-transparent to-[#f20089]" />
            </div>

            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base font-serif italic text-pink-200/90 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Ideas for a brighter tomorrow
            </p>
          </div>
        </div>
        )}

        {/* 
          ====================================================================
          FOREGROUND ASSET LAYERS (Z08 - Z13: Boats, Innovators, Red Cloth, Rocks)
          - Overlaps typography gracefully for true 3D stereoscopic depth
          ====================================================================
        */}
        {!hideForeground && fgLayers.map((layer) => {
          const offsetX = mouseOffset.x * layer.parallax * 15;
          const offsetY = mouseOffset.y * layer.parallax * 10;

          return (
            <div
              key={layer.id}
              className="absolute transition-transform duration-150 ease-out will-change-transform"
              style={{
                left: `${layer.leftPct}%`,
                top: `${layer.topPct}%`,
                width: `${layer.widthPct}%`,
                height: `${layer.heightPct}%`,
                zIndex: layer.zIndex + 10,
                transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layer.src}
                alt={layer.id}
                className="w-full h-full block select-none pointer-events-none"
                loading="eager"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

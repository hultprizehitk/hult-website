"use client";

import React from "react";

/**
 * EventHeroBackground
 * Renders the homepage hero background using ONLY:
 * 1. Base Layer (Kolkata Sunset Skyline)
 * 2. Tree Layer (Banyan Canopy & Foreground Foliage)
 * Preserves the exact 1672:941 canvas ratio with seamless full-bleed coverage.
 */
export default function EventHeroBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0c14] pointer-events-none select-none">
      {/* Mobile Portrait Background Illustration (sm:hidden) */}
      <div className="absolute inset-0 z-[1] block sm:hidden pointer-events-none overflow-hidden bg-[#ECE1CF]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/responsive.png"
          alt="Mobile Hero Background"
          className="w-full h-full object-cover object-bottom select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Full-bleed aspect-ratio preserved canvas for Desktop */}
      <div
        className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none"
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
          {/* Base Layer: Kolkata Sunset Skyline */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-layers/main-base-layer.png"
              alt="Kolkata Sunset Skyline"
              className="w-full h-full block select-none pointer-events-none"
              draggable={false}
              style={{ objectFit: "cover", objectPosition: "center center" }}
            />
          </div>

          {/* Tree Layer: Banyan Canopy and Foreground Foliage (No human layer) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 4 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-layers/trees-front.png"
              alt="Banyan Canopy and Foliage Frame"
              className="w-full h-full block select-none pointer-events-none"
              draggable={false}
              style={{ objectFit: "cover", objectPosition: "center center" }}
            />
          </div>
        </div>
      </div>

      {/* Atmospheric subtle vignette for card contrast & header readability */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10, 12, 20, 0.25) 0%, rgba(10, 12, 20, 0.6) 100%), linear-gradient(to bottom, rgba(10, 12, 20, 0.45) 0%, transparent 22%, transparent 78%, rgba(10, 12, 20, 0.75) 100%)",
        }}
      />
    </div>
  );
}

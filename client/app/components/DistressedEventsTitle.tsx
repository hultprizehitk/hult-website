"use client";

import React from "react";

interface DistressedTitleProps {
  text?: string;
  className?: string;
}

export default function DistressedEventsTitle({
  text = "EVENTS",
  className = "",
}: DistressedTitleProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SVG Distressed Filters & Noise */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="distressed-grunge" x="-10%" y="-10%" width="120%" height="150%">
            {/* Fractal noise for distressed texture wear */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.08"
              numOctaves="4"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3.5"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feComposite
              operator="in"
              in="displaced"
              in2="SourceGraphic"
              result="texturedText"
            />
          </filter>
        </defs>
      </svg>

      {/* Main Distressed Ornate Letterforms Container */}
      <div className="relative inline-block text-center filter drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
        {/* Render letters with ornate Victorian spurs and dripping stem tails */}
        <div className="flex items-center justify-center tracking-[0.08em] sm:tracking-[0.12em] font-[family-name:var(--font-rye)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white font-normal uppercase relative">
          {text.split("").map((char, index) => (
            <span
              key={index}
              className="relative inline-block px-1 sm:px-2 transition-transform duration-300 hover:scale-105"
              style={{
                filter: "url(#distressed-grunge)",
                textShadow: "0 4px 15px rgba(0,0,0,0.8), 0 0 2px rgba(255,255,255,0.6)",
              }}
            >
              {char}

              {/* Hanging Drip Sprites for authentic vintage drip aesthetics */}
              {(char === "T" || char === "I" || char === "E" || char === "P" || char === "N" || char === "S") && (
                <svg
                  className="absolute left-1/2 -bottom-4 sm:-bottom-7 -translate-x-1/2 w-3 sm:w-5 h-5 sm:h-9 pointer-events-none text-white fill-current opacity-90 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  viewBox="0 0 20 40"
                  aria-hidden="true"
                >
                  <path d="M7,0 L13,0 L13,12 C13,18 16,24 13,32 C11.5,36 8.5,36 7,32 C4,24 7,18 7,12 Z" />
                  <circle cx="10" cy="37" r="1.5" />
                </svg>
              )}

              {/* Secondary micro drip on E & V */}
              {(char === "V" || char === "M" || char === "O" || char === "C") && (
                <svg
                  className="absolute left-[35%] -bottom-3 sm:-bottom-5 w-2 sm:w-3.5 h-3.5 sm:h-6 pointer-events-none text-white fill-current opacity-85 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  viewBox="0 0 20 40"
                  aria-hidden="true"
                >
                  <path d="M8,0 L12,0 L12,10 C12,16 14,22 12,28 C11,31 9,31 8,28 C6,22 8,16 8,10 Z" />
                </svg>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

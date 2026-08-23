"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { debug } from "@/lib/debug-logger";

const H_PATH =
  "M 86 75 L 207 76 L 236 83 L 255 94 L 265 104 L 273 116 L 282 143 L 284 158 L 284 263 L 286 265 L 370 263 L 370 161 L 373 137 L 378 119 L 385 105 L 401 88 L 420 79 L 445 75 L 565 75 L 565 557 L 446 557 L 419 551 L 405 544 L 396 537 L 388 528 L 379 512 L 372 487 L 370 469 L 369 368 L 284 369 L 284 475 L 282 489 L 276 510 L 271 520 L 263 531 L 253 540 L 232 551 L 201 557 L 86 557 L 86 75 Z";

interface HultLogoIntroProps {
  className?: string;
  priority?: boolean;
  onEnded?: () => void;
}

export default function HultLogoIntro({
  className = "",
  priority = true,
  onEnded,
}: HultLogoIntroProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    debug.log("intro", "HultLogoIntro mounted -> CSS animations starting");
  }, []);

  return (
    <div
      suppressHydrationWarning
      className={`relative select-none ${className}`}
      style={{
        width: "100%",
        maxWidth: "480px",
        aspectRatio: "1080 / 659",
      }}
      aria-label="Hult Prize Logo"
    >
      {/* 
        ========================================================================
        1. Large H Monogram: Outline-to-Fill + Glide Left (0.00s -> 0.80s)
        ========================================================================
      */}
      <div className="absolute inset-0 h-full w-full">
        <svg
          viewBox="0 0 1080 659"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Clip path for the progressive left-to-right fill wipe */}
            <clipPath id="hFillClip">
              <rect
                x="80"
                y="70"
                height="495"
                className={isMounted ? "animate-h-fill-rect" : "w-0"}
              />
            </clipPath>
          </defs>

          {/* H Group: Holds in center, then glides to left from 0.20s to 0.80s */}
          <g className={isMounted ? "animate-h-translation" : "translate-h-center"}>
            {/* Solid White Fill Layer (Wiped left-to-right inside the H) */}
            <path
              d={H_PATH}
              fill="#FFFFFF"
              stroke="none"
              clipPath="url(#hFillClip)"
            />

            {/* White Outline Layer (Thin crisp stroke) */}
            <path
              d={H_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              className={isMounted ? "animate-h-outline-stroke" : "opacity-0"}
            />
          </g>
        </svg>
      </div>

      {/* 
        ========================================================================
        2. Right Side: "Hult Prize" Typography & Wheat Crest (Reveals 0.45s -> 1.25s)
        ========================================================================
      */}
      <div
        suppressHydrationWarning
        className={`absolute inset-0 h-full w-full will-change-[transform,opacity] ${
          isMounted ? "animate-hult-right" : "opacity-0"
        }`}
        style={{
          clipPath: "polygon(57% 0%, 100% 0%, 100% 100%, 57% 100%)",
          WebkitClipPath: "polygon(57% 0%, 100% 0%, 100% 100%, 57% 100%)",
        }}
        onAnimationEnd={(e) => {
          debug.log("intro", `animationend fired: ${e.animationName}`);
          if (e.animationName === "hultRightTextReveal") {
            debug.log(
              "intro",
              "hultRightTextReveal ended -> calling onEnded"
            );
            onEnded?.();
          }
        }}
      >
        <Image
          src="/Hult-Prize.png"
          alt="Hult Prize Text and Crest"
          fill
          sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 480px"
          priority={priority}
          className="object-contain"
        />
      </div>
    </div>
  );
}

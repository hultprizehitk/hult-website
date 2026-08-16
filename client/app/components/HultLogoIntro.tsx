"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

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
  }, []);

  return (
    <div
      className={`relative inline-block select-none overflow-hidden ${className}`}
      style={{
        width: "100%",
        maxWidth: "420px",
        aspectRatio: "1080 / 659",
      }}
      aria-label="Hult Prize Logo"
    >
      {/* 
        Container holding both animation layers.
        The full image size is 1080x659.
        H monogram is located in the left 57% (center at ~30.14% of total width).
        Text & Crest are located in the right 43% (starting at ~60.74% of total width).
      */}

      {/* Layer 1: The Large 'H' Monogram */}
      <div
        className={`absolute inset-0 h-full w-full will-change-transform ${
          isMounted ? "animate-hult-h" : ""
        }`}
        style={{
          clipPath: "polygon(0% 0%, 57% 0%, 57% 100%, 0% 100%)",
          WebkitClipPath: "polygon(0% 0%, 57% 0%, 57% 100%, 0% 100%)",
        }}
      >
        <Image
          src="/Hult-Prize.png"
          alt="Hult Prize 'H' Monogram"
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          priority={priority}
          className="object-contain"
        />
      </div>

      {/* Layer 2: The 'Hult Prize' Text and Wheat Logo */}
      <div
        className={`absolute inset-0 h-full w-full will-change-[transform,opacity] ${
          isMounted ? "animate-hult-text" : "opacity-0"
        }`}
        style={{
          clipPath: "polygon(57% 0%, 100% 0%, 100% 100%, 57% 100%)",
          WebkitClipPath: "polygon(57% 0%, 100% 0%, 100% 100%, 57% 100%)",
        }}
        onAnimationEnd={(e) => {
          // Trigger onEnded when the text animation completes
          if (e.animationName === "hultTextSlide" || e.animationName === "hultTextIntro") {
            onEnded?.();
          }
        }}
      >
        <Image
          src="/Hult-Prize.png"
          alt="Hult Prize Text and Crest"
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          priority={priority}
          className="object-contain"
        />
      </div>
    </div>
  );
}

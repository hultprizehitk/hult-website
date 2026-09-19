"use client";

import React from "react";
import Image from "next/image";

export interface TeamClanBadgeProps {
  shape?: "shield" | "banner" | "hexagon" | "diamond" | "crown";
  primaryColor?: string;
  accentColor?: string;
  pattern?: "stripes" | "hex" | "starburst" | "diagonal" | "gradient";
  icon?: "phoenix" | "crown" | "lightning" | "rocket" | "leaf" | "atom" | "sword" | "diamond";
  size?: number;
  crestImage?: string;
  className?: string;
}

export default function TeamClanBadgeSVG({
  shape = "shield",
  primaryColor = "#f20089",
  accentColor = "#a855f7",
  pattern = "gradient",
  icon = "crown",
  size = 48,
  crestImage,
  className = "",
}: TeamClanBadgeProps) {
  // If a 3D crest PNG image is provided, render it directly with glowing frame
  if (crestImage) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={crestImage}
          alt="3D Team Crest"
          width={size}
          height={size}
          unoptimized
          className="object-contain drop-shadow-[0_4px_12px_rgba(242,0,137,0.5)] hover:scale-110 transition-transform"
        />
      </div>
    );
  }

  // Dynamic SVG Flag Paths & Icons
  const gradientId = `crest-grad-${primaryColor.replace('#', '')}-${accentColor.replace('#', '')}`;
  const patternId = `crest-pat-${pattern}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 hover:scale-105 transition-transform ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Gradient fill */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Patterns */}
          <pattern id={`${patternId}-stripes`} width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
          </pattern>
        </defs>

        {/* Flag Frame Shapes */}
        {shape === "shield" && (
          <path
            d="M50 5 L85 20 V50 C85 72 50 95 50 95 C50 95 15 72 15 50 V20 L50 5 Z"
            fill={`url(#${gradientId})`}
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
        )}

        {shape === "banner" && (
          <path
            d="M20 5 H80 V75 L50 95 L20 75 V5 Z"
            fill={`url(#${gradientId})`}
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
        )}

        {shape === "hexagon" && (
          <path
            d="M50 5 L90 27.5 V72.5 L50 95 L10 72.5 V27.5 L50 5 Z"
            fill={`url(#${gradientId})`}
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
        )}

        {shape === "diamond" && (
          <path
            d="M50 5 L92 50 L50 95 L8 50 L50 5 Z"
            fill={`url(#${gradientId})`}
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
        )}

        {shape === "crown" && (
          <path
            d="M15 25 L35 40 L50 10 L65 40 L85 25 L80 85 H20 L15 25 Z"
            fill={`url(#${gradientId})`}
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
        )}

        {/* Inner Motif Layer */}
        {pattern === "stripes" && (
          <rect x="0" y="0" width="100" height="100" fill={`url(#${patternId}-stripes)`} opacity="0.3" />
        )}

        {/* Central Emblem Icon */}
        <g fill="#ffffff" opacity="0.95" transform="translate(25, 25) scale(0.5)">
          {icon === "crown" && (
            <path d="M50 15 L65 45 L90 25 L75 80 H25 L10 25 L35 45 Z" />
          )}

          {icon === "phoenix" && (
            <path d="M50 10 C30 30 10 35 10 65 C10 80 25 90 50 90 C75 90 90 80 90 65 C90 35 70 30 50 10 Z" />
          )}

          {icon === "lightning" && (
            <path d="M55 10 L20 55 H45 L35 90 L80 45 H55 L65 10 Z" />
          )}

          {icon === "rocket" && (
            <path d="M50 10 C35 30 30 50 30 75 L50 90 L70 75 C70 50 65 30 50 10 Z" />
          )}

          {icon === "leaf" && (
            <path d="M50 10 C20 30 15 65 50 90 C85 65 80 30 50 10 Z" />
          )}

          {icon === "atom" && (
            <polygon points="50,15 85,50 50,85 15,50" />
          )}

          {icon === "sword" && (
            <path d="M50 10 L60 30 L50 70 L40 30 Z M40 75 H60 V85 H40 Z" />
          )}
        </g>

        {/* Gloss Highlight Overlay */}
        <path
          d="M20 15 C40 10 60 10 80 15 C70 35 30 35 20 15 Z"
          fill="#ffffff"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}

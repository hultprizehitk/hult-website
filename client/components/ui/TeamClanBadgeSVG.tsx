"use client";

import React from "react";
import Image from "next/image";

export interface TeamClanBadgeProps {
  shape?: "shield" | "banner" | "hexagon" | "diamond" | "crown";
  primaryColor?: string;
  accentColor?: string;
  pattern?: "stripes" | "hex" | "starburst" | "diagonal" | "gradient";
  icon?: "phoenix" | "crown" | "lightning" | "rocket" | "leaf" | "atom" | "sword" | "dragon";
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
  // If a 3D crest PNG image is provided, render it directly
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

  // Generate unique IDs for SVG defs
  const safePrimary = primaryColor.replace("#", "");
  const safeAccent = accentColor.replace("#", "");
  const gradId = `badge-grad-${safePrimary}-${safeAccent}`;
  const goldGradId = `badge-gold-${safePrimary}`;
  const strokeGradId = `badge-stroke-${safePrimary}-${safeAccent}`;

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
        className="drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
      >
        <defs>
          {/* Main Primary Accent Gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={primaryColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Metallic Gold Frame Gradient */}
          <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Glowing Stroke Edge */}
          <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor={primaryColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>

          {/* Texture Patterns */}
          <pattern id={`pat-stripes-${safePrimary}`} width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
          </pattern>

          <pattern id={`pat-dots-${safePrimary}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.5" fill="rgba(255,255,255,0.25)" />
          </pattern>
        </defs>

        {/* ----------------------------------------------------------------- */}
        {/* LAYER 1: BASE METALLIC FRAME & SHAPE PATHS                         */}
        {/* ----------------------------------------------------------------- */}
        {shape === "shield" && (
          <>
            <path
              d="M50 3 L88 18 V48 C88 74 50 97 50 97 C50 97 12 74 12 48 V18 L50 3 Z"
              fill={`url(#${goldGradId})`}
            />
            <path
              d="M50 7 L84 21 V46 C84 70 50 92 50 92 C50 92 16 70 16 46 V21 L50 7 Z"
              fill={`url(#${gradId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.5"
            />
          </>
        )}

        {shape === "banner" && (
          <>
            <path
              d="M15 3 H85 V78 L50 97 L15 78 V3 Z"
              fill={`url(#${goldGradId})`}
            />
            <path
              d="M19 7 H81 V75 L50 92 L19 75 V7 Z"
              fill={`url(#${gradId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.5"
            />
          </>
        )}

        {shape === "hexagon" && (
          <>
            <path
              d="M50 3 L92 26 V74 L50 97 L8 74 V26 L50 3 Z"
              fill={`url(#${goldGradId})`}
            />
            <path
              d="M50 7 L88 28 V72 L50 93 L12 72 V28 L50 7 Z"
              fill={`url(#${gradId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.5"
            />
          </>
        )}

        {shape === "diamond" && (
          <>
            <path
              d="M50 3 L97 50 L50 97 L3 50 L50 3 Z"
              fill={`url(#${goldGradId})`}
            />
            <path
              d="M50 8 L92 50 L50 92 L8 50 L50 8 Z"
              fill={`url(#${gradId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.5"
            />
          </>
        )}

        {shape === "crown" && (
          <>
            <path
              d="M12 22 L35 38 L50 5 L65 38 L88 22 L82 88 H18 L12 22 Z"
              fill={`url(#${goldGradId})`}
            />
            <path
              d="M16 26 L36 40 L50 11 L64 40 L84 26 L79 84 H21 L16 26 Z"
              fill={`url(#${gradId})`}
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2.5"
            />
          </>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* LAYER 2: BACKGROUND MOTIF TEXTURES                                */}
        {/* ----------------------------------------------------------------- */}
        {pattern === "stripes" && (
          <rect x="15" y="15" width="70" height="70" fill={`url(#pat-stripes-${safePrimary})`} opacity="0.35" clipPath="url(#bg-clip)" />
        )}

        {/* Inner Radial Starburst Lines */}
        <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5">
          <line x1="50" y1="20" x2="50" y2="80" />
          <line x1="20" y1="50" x2="80" y2="50" />
          <line x1="28" y1="28" x2="72" y2="72" />
          <line x1="28" y1="72" x2="72" y2="28" />
        </g>

        {/* Inner Heraldic Ring Frame */}
        <circle cx="50" cy="50" r="24" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" fill="rgba(0,0,0,0.25)" />

        {/* ----------------------------------------------------------------- */}
        {/* LAYER 3: RICH COMPOSITE HERALDIC EMBLEM GRAPHICS                   */}
        {/* ----------------------------------------------------------------- */}
        <g fill="#ffffff" fillOpacity="0.95" stroke="#ffffff" strokeWidth="0.5">
          {/* EMBLEM 1: PHOENIX FLAME CREST */}
          {(icon === "phoenix" || icon === "lightning") && (
            <g transform="translate(50, 50)">
              {/* Flame Wings */}
              <path d="M0 -22 C-14 -12 -22 2 -18 16 C-12 22 -4 20 0 12 C4 20 12 22 18 16 C22 2 14 -12 0 -22 Z" fill={`url(#${goldGradId})`} />
              {/* Central Starburst Core */}
              <polygon points="0,-18 4,-6 16,-6 6,2 10,14 0,6 -10,14 -6,2 -16,-6 -4,-6" fill="#ffffff" />
              {/* Flame crown */}
              <path d="M-6 -18 L0 -26 L6 -18 L0 -14 Z" fill="#ffffff" />
            </g>
          )}

          {/* EMBLEM 2: IMPERIAL CROWN & CROSSED SWORDS */}
          {icon === "crown" && (
            <g transform="translate(50, 50)">
              {/* Crossed Swords Background */}
              <path d="M-18 -18 L18 18 M-14 -18 L-18 -14 M14 18 L18 14" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M18 -18 L-18 18 M14 -18 L18 -14 M-18 14 L-14 18" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
              {/* Imperial Crown */}
              <path d="M-14 -6 L-7 6 L0 -10 L7 6 L14 -6 L10 12 H-10 L-14 -6 Z" fill="#ffffff" />
              <circle cx="-14" cy="-8" r="2.5" fill="#fbbf24" />
              <circle cx="0" cy="-12" r="3" fill="#fbbf24" />
              <circle cx="14" cy="-8" r="2.5" fill="#fbbf24" />
              <rect x="-8" y="14" width="16" height="3" rx="1.5" fill="#fbbf24" />
            </g>
          )}

          {/* EMBLEM 3: QUANTUM ATOM TECH ENGINE */}
          {icon === "atom" && (
            <g transform="translate(50, 50)">
              <ellipse cx="0" cy="0" rx="20" ry="7" fill="none" stroke="#ffffff" strokeWidth="2" transform="rotate(30)" />
              <ellipse cx="0" cy="0" rx="20" ry="7" fill="none" stroke="#ffffff" strokeWidth="2" transform="rotate(90)" />
              <ellipse cx="0" cy="0" rx="20" ry="7" fill="none" stroke="#ffffff" strokeWidth="2" transform="rotate(150)" />
              <circle cx="0" cy="0" r="6" fill={`url(#${goldGradId})`} />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
            </g>
          )}

          {/* EMBLEM 4: VANGUARD DRAGON & SHIELD */}
          {(icon === "sword" || icon === "dragon") && (
            <g transform="translate(50, 50)">
              {/* Broadsword */}
              <path d="M0 -24 L4 -8 L2 14 H-2 L-4 -8 Z" fill="#ffffff" />
              <path d="M-10 -8 H10 V-5 H-10 Z" fill="#fbbf24" />
              <circle cx="0" cy="18" r="3" fill="#fbbf24" />
              {/* Dragon Wings */}
              <path d="M-4 -6 C-12 -18 -24 -14 -20 4 C-14 8 -6 2 -4 -6 Z" fill={`url(#${goldGradId})`} />
              <path d="M4 -6 C12 -18 24 -14 20 4 C14 8 6 2 4 -6 Z" fill={`url(#${goldGradId})`} />
            </g>
          )}

          {/* EMBLEM 5: GAIA BIO LEAF & SOLAR CIRCLE */}
          {icon === "leaf" && (
            <g transform="translate(50, 50)">
              <path d="M0 -20 C16 -12 18 10 0 20 C-18 10 -16 -12 0 -20 Z" fill="#ffffff" />
              <path d="M0 -15 C-8 -4 -6 8 0 15 C6 8 8 -4 0 -15 Z" fill={`url(#${goldGradId})`} />
              <line x1="0" y1="-15" x2="0" y2="15" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* EMBLEM 6: ROCKET LAUNCH CORE */}
          {icon === "rocket" && (
            <g transform="translate(50, 50)">
              <path d="M0 -22 C6 -12 8 2 8 12 L0 16 L-8 12 C-8 2 -6 -12 0 -22 Z" fill="#ffffff" />
              <path d="M-8 6 L-16 16 L-8 12 Z" fill={`url(#${goldGradId})`} />
              <path d="M8 6 L16 16 L8 12 Z" fill={`url(#${goldGradId})`} />
              <circle cx="0" cy="-4" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <path d="M-4 16 L0 24 L4 16 Z" fill="#f59e0b" />
            </g>
          )}
        </g>

        {/* ----------------------------------------------------------------- */}
        {/* LAYER 4: GLASS GLARE OVERLAY                                      */}
        {/* ----------------------------------------------------------------- */}
        <path
          d="M18 10 C45 6 70 10 82 22 C65 34 35 34 18 10 Z"
          fill="#ffffff"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}

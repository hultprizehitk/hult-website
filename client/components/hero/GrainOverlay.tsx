"use client";

import React from "react";

interface GrainOverlayProps {
  opacity?: number;
  blendMode?: "overlay" | "soft-light" | "screen" | "multiply" | "normal";
  zIndex?: number;
  tileSize?: number;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function GrainOverlay({
  opacity = 0.8,
  blendMode = "overlay",
  zIndex = 80,
  tileSize = 200,
  enabled = true,
  className = "",
  style = {},
}: GrainOverlayProps) {
  if (!enabled) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{
        zIndex,
        opacity,
        backgroundImage: "url('/assets/hult-prize-hero/textures/grain.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: `${tileSize}px ${tileSize}px`,
        mixBlendMode: blendMode,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

"use client";

import React from "react";

interface ClothHumanLayerProps {
  src: string;
  hasEntered: boolean;
  allLayersEntered?: boolean;
  scrollProgress?: number;
  humanOpacity: number;
  humanScale?: number;
  position: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
  zIndex: number;
  objectFit: "cover" | "contain";
  objectPosition: string;
}

export default function ClothHumanLayer({
  src,
  hasEntered,
  humanOpacity,
  position,
  zIndex,
  objectFit,
  objectPosition,
}: ClothHumanLayerProps) {
  // Simple, clean opacity fade-in as user scrolls down to screen 2
  const effectiveOpacity = hasEntered ? humanOpacity : 0;

  return (
    <div
      className="absolute pointer-events-none select-none hero-smooth-layer"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        zIndex,
        opacity: effectiveOpacity,
        visibility: effectiveOpacity > 0.005 ? "visible" : "hidden",
        transition: "opacity 0.2s ease-out",
        willChange: "opacity",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Human Layer"
        className="w-full h-full block select-none pointer-events-none"
        draggable={false}
        style={{
          objectFit,
          objectPosition,
        }}
      />
    </div>
  );
}

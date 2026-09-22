"use client";

import React, { useState, useEffect } from "react";
import GrainOverlay from "@/components/hero/GrainOverlay";
import { KOLKATA_LAYERS } from "@/lib/kolkata-layers-config";

interface KolkataFixedBackgroundProps {
  dimmerOpacity?: number;
}

export default function KolkataFixedBackground({
  dimmerOpacity = 0.25,
}: KolkataFixedBackgroundProps) {
  const [isSkyLoaded, setIsSkyLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSkyLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-black">
      {/* Full-bleed aspect-ratio preserved canvas — identical to home page hero */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ overflow: "hidden" }}
      >
        <div
          className="relative pointer-events-none"
          style={{
            width: "max(100vw, calc(100vh * (1672 / 941)))",
            height: "max(100vh, calc(100vw * (941 / 1672)))",
            aspectRatio: "1672 / 941",
            transform: "translate3d(0, -4%, 0)",
          }}
        >
          {/* Base sky */}
          <img
            src="/assets/kolkata-ui/extreme-background.png"
            alt="Kolkata Base Sky"
            className="absolute inset-0 w-full h-full block select-none pointer-events-none"
            draggable={false}
            style={{
              zIndex: 1,
              opacity: isSkyLoaded ? 1 : 0,
              transition: "opacity 1s ease-out",
            }}
          />

          {/* 26 cutout layers */}
          {KOLKATA_LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="absolute pointer-events-none"
              style={{
                left: `${layer.leftPct}%`,
                top: `${layer.topPct}%`,
                width: `${layer.widthPct}%`,
                height: `${layer.heightPct}%`,
                zIndex: layer.zIndex,
              }}
            >
              <img
                src={layer.src}
                alt={layer.id}
                className="w-full h-full block select-none pointer-events-none"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dimmer overlay for readable content */}
      {dimmerOpacity > 0 && (
        <div
          className="absolute inset-0 z-[73] bg-black pointer-events-none"
          style={{ opacity: dimmerOpacity }}
        />
      )}

      {/* Film grain overlay */}
      <GrainOverlay enabled={true} opacity={0.7} zIndex={82} />
    </div>
  );
}

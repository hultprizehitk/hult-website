"use client";

import React, { useState, useEffect, useRef } from "react";
import FallingPetals from "@/components/hero/FallingPetals";
import GrainOverlay from "@/components/hero/GrainOverlay";
import HeroInterfaceOverlay from "@/components/hero/HeroInterfaceOverlay";
import HeroThemeAbout from "@/components/sections/HeroThemeAbout";
import HeroThemeEvents from "@/components/sections/HeroThemeEvents";
import HeroThemeFooter from "@/components/sections/HeroThemeFooter";

interface LayerConfig {
  id: string;
  name: string;
  path: string;
  zIndex: number;
  opacity: number;
  scale: number;
  xOffset: number;
  yOffset: number;
  depthSpeed: number;
  visible: boolean;
  blendMode?: string;
  mask?: boolean;
  type: "cover" | "contain";
}

const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: "sky",
    name: "Base Sky Plane",
    path: "/assets/hult-prize-hero/environment/hero-sky.png",
    zIndex: 0,
    opacity: 0.86,
    scale: 1.02,
    xOffset: 0,
    yOffset: 0,
    depthSpeed: 2,
    visible: true,
    type: "cover",
  },
  {
    id: "mountains",
    name: "Distant Mountains",
    path: "/assets/hult-prize-hero/environment/hero-mountains.png",
    zIndex: 25,
    opacity: 1,
    scale: 1.02,
    xOffset: 0,
    yOffset: 0,
    depthSpeed: 6,
    visible: true,
    type: "cover",
  },
  {
    id: "cityscape",
    name: "City Skyline",
    path: "/assets/hult-prize-hero/environment/hero-cityscape.png",
    zIndex: 40,
    opacity: 1,
    scale: 1.02,
    xOffset: 0,
    yOffset: -24,
    depthSpeed: 9,
    visible: true,
    type: "cover",
  },
  {
    id: "tower",
    name: "Landmark Telecom Tower",
    path: "/assets/hult-prize-hero/environment/hero-landmark-tower.png",
    zIndex: 45,
    opacity: 1,
    scale: 1.5,
    xOffset: 0,
    yOffset: 56,
    depthSpeed: 10,
    visible: true,
    type: "contain",
  },
  {
    id: "water-ripples",
    name: "Water Ripples Surface",
    path: "/assets/hult-prize-hero/water/water-ripples.png",
    zIndex: 26,
    opacity: 1,
    scale: 1.04,
    xOffset: -8,
    yOffset: 186,
    depthSpeed: 7,
    visible: true,
    mask: true,
    type: "cover",
  },
  {
    id: "water-reflection",
    name: "Water Surface Reflection",
    path: "/assets/hult-prize-hero/water/water-reflection.png",
    zIndex: 28,
    opacity: 0.85,
    scale: 1.06,
    xOffset: 0,
    yOffset: 190,
    depthSpeed: 8,
    visible: true,
    mask: true,
    blendMode: "screen",
    type: "cover",
  },
  {
    id: "shore-rock",
    name: "Shoreline Volcanic Rock",
    path: "/assets/hult-prize-hero/environment/shore-rock-left.png",
    zIndex: 75,
    opacity: 1,
    scale: 1.42,
    xOffset: -64,
    yOffset: 0,
    depthSpeed: 18,
    visible: true,
    type: "contain",
  },
  {
    id: "branch-left-secondary",
    name: "Secondary Left Sakura Sprig",
    path: "/assets/hult-prize-hero/branches/branch-left-secondary.png",
    zIndex: 58,
    opacity: 0.9,
    scale: 1.85,
    xOffset: -24,
    yOffset: 8,
    depthSpeed: 20,
    visible: true,
    type: "contain",
  },
  {
    id: "branch-left",
    name: "Upper-Left Sakura Branch",
    path: "/assets/hult-prize-hero/branches/cherry-branch-left.png",
    zIndex: 60,
    opacity: 1,
    scale: 2.2,
    xOffset: -38,
    yOffset: 0,
    depthSpeed: 22,
    visible: true,
    type: "contain",
  },
  {
    id: "branch-right",
    name: "Upper-Right Sakura Branch",
    path: "/assets/hult-prize-hero/branches/cherry-branch-right.png",
    zIndex: 60,
    opacity: 1,
    scale: 1.92,
    xOffset: 0,
    yOffset: 0,
    depthSpeed: 24,
    visible: true,
    type: "contain",
  },
  {
    id: "blossoms-right",
    name: "Foreground Blossoms Right",
    path: "/assets/hult-prize-hero/foreground/foreground-blossoms-right.png",
    zIndex: 76,
    opacity: 0.65,
    scale: 1,
    xOffset: 0,
    yOffset: 0,
    depthSpeed: 20,
    visible: true,
    type: "contain",
  },
];

export default function Home() {
  const [layers] = useState<LayerConfig[]>(DEFAULT_LAYERS);

  // Atmospheric Overlay States
  const [isPetalsEnabled] = useState(true);
  const [petalDensity] = useState(16);
  const [isGrainEnabled] = useState(true);
  const [grainOpacity] = useState(0.75);

  // Staggered Load Entrance States
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);
  const [isEntranceAnimating, setIsEntranceAnimating] = useState(true);

  // Scroll tracking & physics
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const lastScrollYRef = useRef(0);
  const velocityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cinematic load entrance trigger
    const startTimer = setTimeout(() => {
      setIsHeroLoaded(true);
    }, 80);

    const finishTimer = setTimeout(() => {
      setIsEntranceAnimating(false);
    }, 2600);

    // Scroll listener for dynamic multi-layer parallax
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowH = window.innerHeight || 800;
      const progress = Math.min(1, Math.max(0, currentScrollY / windowH));

      // Calculate instant scroll velocity for dynamic wind gusts on petals
      const delta = Math.abs(currentScrollY - lastScrollYRef.current);
      lastScrollYRef.current = currentScrollY;
      const velocity = Math.min(1.5, delta / 18);
      setScrollVelocity(velocity);

      if (velocityTimeoutRef.current) clearTimeout(velocityTimeoutRef.current);
      velocityTimeoutRef.current = setTimeout(() => {
        setScrollVelocity(0);
      }, 150);

      setScrollY(currentScrollY);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(startTimer);
      clearTimeout(finishTimer);
      window.removeEventListener("scroll", handleScroll);
      if (velocityTimeoutRef.current) clearTimeout(velocityTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#f7eef2] overflow-x-hidden select-none text-[#211B1C] selection:bg-[#e60067] selection:text-white font-[family-name:var(--font-google-sans)]">
      {/* Dynamic Keyframes for Realistic Branch Wind Sway, Mountain Parallax, & Water Shimmer */}
      <style>{`
        /* Realistic Organic Wind Sway for Primary Sakura Branches */
        @keyframes realisticBranchWindLeft {
          0% {
            transform: rotate(0deg) skew(0deg, 0deg) translate3d(0, 0, 0);
          }
          14% {
            transform: rotate(0.42deg) skew(-0.12deg, 0.08deg) translate3d(1px, 1.2px, 0);
          }
          28% {
            transform: rotate(0.78deg) skew(-0.2deg, 0.15deg) translate3d(1.8px, 2px, 0);
          }
          42% {
            transform: rotate(-0.25deg) skew(0.08deg, -0.05deg) translate3d(-0.6px, -0.6px, 0);
          }
          56% {
            transform: rotate(0.28deg) skew(-0.07deg, 0.05deg) translate3d(0.7px, 0.7px, 0);
          }
          70% {
            transform: rotate(-0.09deg) skew(0.03deg, -0.02deg) translate3d(-0.2px, -0.2px, 0);
          }
          84% {
            transform: rotate(0.05deg) skew(-0.015deg, 0.01deg) translate3d(0.1px, 0.1px, 0);
          }
          100% {
            transform: rotate(0deg) skew(0deg, 0deg) translate3d(0, 0, 0);
          }
        }

        /* Staggered sway for secondary branch */
        @keyframes realisticBranchSecondaryLeft {
          0%, 100% {
            transform: rotate(0deg) skew(0deg, 0deg) translate3d(0, 0, 0);
          }
          50% {
            transform: rotate(0.65deg) skew(-0.14deg, 0.09deg) translate3d(1.4px, 1.6px, 0);
          }
        }

        @keyframes realisticBranchWindRight {
          0% {
            transform: rotate(0deg) skew(0deg, 0deg) translate3d(0, 0, 0);
          }
          16% {
            transform: rotate(-0.5deg) skew(0.15deg, -0.1deg) translate3d(-1px, 1.2px, 0);
          }
          30% {
            transform: rotate(-0.84deg) skew(0.24deg, -0.16deg) translate3d(-1.6px, 2px, 0);
          }
          46% {
            transform: rotate(0.26deg) skew(-0.07deg, 0.05deg) translate3d(0.5px, -0.5px, 0);
          }
          60% {
            transform: rotate(-0.28deg) skew(0.09deg, -0.05deg) translate3d(-0.6px, 0.6px, 0);
          }
          74% {
            transform: rotate(0.09deg) skew(-0.03deg, 0.02deg) translate3d(0.2px, -0.2px, 0);
          }
          88% {
            transform: rotate(-0.04deg) skew(0.01deg, -0.01deg) translate3d(-0.1px, 0.1px, 0);
          }
          100% {
            transform: rotate(0deg) skew(0deg, 0deg) translate3d(0, 0, 0);
          }
        }

        @keyframes mountainSlowParallax {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -6px, 0);
          }
        }

        /* Subtle Water Shimmer */
        @keyframes waterShimmer {
          0%, 100% {
            opacity: 0.72;
            transform: translate3d(0, 0, 0);
          }
          50% {
            opacity: 0.95;
            transform: translate3d(2px, 1px, 0);
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* 1. HERO VIEWPORT (2.5D ASSEMBLED MULTI-LAYER CANVAS)       */}
      {/* ========================================================= */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Layer 0: Base Sky Plane (Fade in) */}
        {(() => {
          const l = layers.find((x) => x.id === "sky")!;
          if (!l.visible) return null;
          const sy = scrollY * 0.12;
          return (
            <div
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? l.opacity : 0,
                transform: `translate3d(${l.xOffset}px, ${l.yOffset + sy}px, 0) scale(${l.scale + scrollProgress * 0.04})`,
                transition: isEntranceAnimating ? "opacity 1.8s ease-out" : "opacity 0.2s",
              }}
            >
              <img
                src={l.path}
                alt={l.name}
                className="h-full w-full object-cover object-[50%_50%]"
                draggable={false}
              />
            </div>
          );
        })()}

        {/* Layer 1: Distant Mountains (Smooth rise entrance) */}
        {(() => {
          const l = layers.find((x) => x.id === "mountains")!;
          if (!l.visible) return null;
          const sy = scrollY * 0.3;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 52;
          const entranceOpacity = isHeroLoaded ? l.opacity : 0.15;

          return (
            <div
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{
                zIndex: l.zIndex,
                opacity: entranceOpacity,
                transform: `translate3d(${l.xOffset}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 2s ease-out"
                  : "opacity 0.2s",
              }}
            >
              <div
                className="h-full w-full"
                style={{
                  animation: "mountainSlowParallax 11s ease-in-out infinite",
                }}
              >
                <img
                  src={l.path}
                  alt={l.name}
                  className="h-full w-full object-cover object-[50%_50%]"
                  draggable={false}
                />
              </div>
            </div>
          );
        })()}

        {/* Layer 2: City Skyline (Smooth rise entrance) */}
        {(() => {
          const l = layers.find((x) => x.id === "cityscape")!;
          if (!l.visible) return null;
          const sy = scrollY * 0.44;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 38;
          const entranceOpacity = isHeroLoaded ? l.opacity : 0;

          return (
            <div
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{
                zIndex: l.zIndex,
                opacity: entranceOpacity,
                transform: `translate3d(${l.xOffset}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.2s cubic-bezier(0.16, 1, 0.3, 1) 180ms, opacity 1.8s ease-out 180ms"
                  : "opacity 0.2s",
              }}
            >
              <img
                src={l.path}
                alt={l.name}
                className="h-full w-full object-cover object-[50%_50%]"
                draggable={false}
              />
            </div>
          );
        })()}

        {/* Layer 3: Landmark Telecom Tower (Smooth rise entrance) */}
        {(() => {
          const l = layers.find((x) => x.id === "tower")!;
          if (!l.visible) return null;
          const sy = scrollY * 0.48;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 48;
          const entranceOpacity = isHeroLoaded ? l.opacity : 0;

          return (
            <div
              className="absolute pointer-events-none"
              style={{
                left: "62.2%",
                bottom: "22%",
                height: "22vh",
                zIndex: l.zIndex,
                opacity: entranceOpacity,
                transform: `translate3d(calc(-50% + ${l.xOffset}px), ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) 300ms, opacity 1.8s ease-out 300ms"
                  : "opacity 0.2s",
              }}
            >
              <img
                src={l.path}
                alt={l.name}
                className="h-full w-auto object-contain"
                draggable={false}
              />
            </div>
          );
        })()}

        {/* Layer 4: Water Ripples (Glide entrance) */}
        {(() => {
          const l = layers.find((x) => x.id === "water-ripples")!;
          if (!l.visible) return null;
          const sy = scrollY * 0.38;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 32;
          const targetOpacity = Math.max(0.15, l.opacity - scrollProgress * 0.75);

          return (
            <div
              className="absolute bottom-0 left-0 right-0 h-[44%] w-full pointer-events-none"
              style={{
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${l.xOffset}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.95) 55%, transparent 92%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.95) 55%, transparent 92%)",
                transition: isEntranceAnimating
                  ? "transform 2.1s cubic-bezier(0.16, 1, 0.3, 1) 220ms, opacity 1.7s ease-out 220ms"
                  : "opacity 0.2s",
              }}
            >
              <img
                src={l.path}
                alt={l.name}
                className="h-full w-full object-cover object-center"
                draggable={false}
              />
            </div>
          );
        })()}

        {/* Layer 5: Water Surface Reflection (Glide shimmer entrance) */}
        {(() => {
          const l = layers.find((x) => x.id === "water-reflection")!;
          if (!l.visible) return null;
          const sy = scrollY * 0.4;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 32;
          const targetOpacity = Math.max(0.1, l.opacity - scrollProgress * 0.8);

          return (
            <div
              className="absolute bottom-0 left-0 right-0 h-[44%] w-full pointer-events-none mix-blend-screen"
              style={{
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${l.xOffset}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.95) 55%, transparent 92%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.95) 55%, transparent 92%)",
                transition: isEntranceAnimating
                  ? "transform 2.2s cubic-bezier(0.16, 1, 0.3, 1) 280ms, opacity 1.8s ease-out 280ms"
                  : "opacity 0.2s",
              }}
            >
              <div
                className="h-full w-full"
                style={{ animation: "waterShimmer 7s ease-in-out infinite" }}
              >
                <img
                  src={l.path}
                  alt={l.name}
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
              </div>
            </div>
          );
        })()}

        {/* Layer 6: Shoreline Rock (Rise from bottom-left entrance) */}
        {(() => {
          const l = layers.find((x) => x.id === "shore-rock")!;
          if (!l.visible) return null;
          const sx = -scrollY * 0.35;
          const sy = scrollY * 0.55;
          const entranceX = isHeroLoaded ? l.xOffset : l.xOffset - 28;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 42;
          const targetOpacity = Math.max(0, l.opacity - scrollProgress * 1.5);

          return (
            <div
              className="absolute bottom-0 left-0 pointer-events-none origin-bottom-left"
              style={{
                width: "32vw",
                maxWidth: "460px",
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${entranceX + sx}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.3s cubic-bezier(0.16, 1, 0.3, 1) 360ms, opacity 1.8s ease-out 360ms"
                  : "opacity 0.2s",
              }}
            >
              <img
                src={l.path}
                alt={l.name}
                className="h-auto w-full object-contain object-bottom-left"
                draggable={false}
              />
            </div>
          );
        })()}

        {/* Layer 7: Secondary Left Branch (Glide down from top-left) */}
        {(() => {
          const l = layers.find((x) => x.id === "branch-left-secondary")!;
          if (!l.visible) return null;
          const sx = -scrollY * 0.35;
          const sy = -scrollY * 0.15;
          const entranceX = isHeroLoaded ? l.xOffset : l.xOffset - 32;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset - 32;
          const targetOpacity = Math.max(0, l.opacity - scrollProgress * 1.8);

          return (
            <div
              className="absolute top-0 left-0 pointer-events-none origin-top-left"
              style={{
                width: "26vw",
                maxWidth: "380px",
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${entranceX + sx}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.3s cubic-bezier(0.16, 1, 0.3, 1) 320ms, opacity 1.8s ease-out 320ms"
                  : "opacity 0.2s",
              }}
            >
              <div
                className="h-full w-full"
                style={{
                  transformOrigin: "-20% -10%",
                  animation: "realisticBranchSecondaryLeft 9.2s cubic-bezier(0.42, 0, 0.58, 1) infinite",
                }}
              >
                <img
                  src={l.path}
                  alt={l.name}
                  className="h-auto w-full object-contain object-top-left"
                  draggable={false}
                />
              </div>
            </div>
          );
        })()}

        {/* Layer 8: Primary Upper-Left Branch (Glide down from top-left) */}
        {(() => {
          const l = layers.find((x) => x.id === "branch-left")!;
          if (!l.visible) return null;
          const sx = -scrollY * 0.45;
          const sy = -scrollY * 0.2;
          const entranceX = isHeroLoaded ? l.xOffset : l.xOffset - 38;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset - 38;
          const targetOpacity = Math.max(0, l.opacity - scrollProgress * 1.8);

          return (
            <div
              className="absolute top-0 left-0 pointer-events-none origin-top-left"
              style={{
                width: "22vw",
                maxWidth: "300px",
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${entranceX + sx}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) 420ms, opacity 1.9s ease-out 420ms"
                  : "opacity 0.2s",
              }}
            >
              <div
                className="h-full w-full"
                style={{
                  transformOrigin: "-35% -20%",
                  animation: "realisticBranchWindLeft 8.8s cubic-bezier(0.42, 0, 0.58, 1) infinite",
                }}
              >
                <img
                  src={l.path}
                  alt={l.name}
                  className="h-auto w-full object-contain object-top-left"
                  draggable={false}
                />
              </div>
            </div>
          );
        })()}

        {/* Layer 9: Primary Upper-Right Branch (Glide down from top-right) */}
        {(() => {
          const l = layers.find((x) => x.id === "branch-right")!;
          if (!l.visible) return null;
          const sx = scrollY * 0.45;
          const sy = -scrollY * 0.2;
          const entranceX = isHeroLoaded ? l.xOffset : l.xOffset + 38;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset - 38;
          const targetOpacity = Math.max(0, l.opacity - scrollProgress * 1.8);

          return (
            <div
              className="absolute top-0 right-0 pointer-events-none origin-top-right"
              style={{
                width: "19vw",
                maxWidth: "260px",
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${entranceX + sx}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) 480ms, opacity 1.9s ease-out 480ms"
                  : "opacity 0.2s",
              }}
            >
              <div
                className="h-full w-full"
                style={{
                  transformOrigin: "135% -15%",
                  animation: "realisticBranchWindRight 7.6s cubic-bezier(0.42, 0, 0.58, 1) infinite",
                }}
              >
                <img
                  src={l.path}
                  alt={l.name}
                  className="h-auto w-full object-contain object-top-right"
                  draggable={false}
                />
              </div>
            </div>
          );
        })()}

        {/* Layer 10: Foreground Blossoms Right (Bloom up from bottom-right) */}
        {(() => {
          const l = layers.find((x) => x.id === "blossoms-right")!;
          if (!l?.visible) return null;
          const sx = scrollY * 0.35;
          const sy = scrollY * 0.45;
          const entranceX = isHeroLoaded ? l.xOffset : l.xOffset + 28;
          const entranceY = isHeroLoaded ? l.yOffset : l.yOffset + 35;
          const targetOpacity = Math.max(0, l.opacity - scrollProgress * 1.6);

          return (
            <div
              className="absolute bottom-0 right-0 pointer-events-none origin-bottom-right"
              style={{
                width: "42vw",
                maxWidth: "660px",
                zIndex: l.zIndex,
                opacity: isHeroLoaded ? targetOpacity : 0,
                transform: `translate3d(${entranceX + sx}px, ${entranceY + sy}px, 0) scale(${l.scale})`,
                transition: isEntranceAnimating
                  ? "transform 2.3s cubic-bezier(0.16, 1, 0.3, 1) 520ms, opacity 1.8s ease-out 520ms"
                  : "opacity 0.2s",
              }}
            >
              <img
                src={l.path}
                alt={l.name}
                className="h-auto w-full object-contain object-bottom-right"
                draggable={false}
              />
            </div>
          );
        })()}

        {/* Falling Petals Particle Layer */}
        <FallingPetals
          enabled={isPetalsEnabled}
          density={petalDensity}
          speedMultiplier={0.7 + scrollVelocity * 0.3}
          windIntensity={1 + scrollVelocity * 1.2}
          zIndex={68}
        />

        {/* Grainy Texture Overlay */}
        <GrainOverlay
          enabled={isGrainEnabled}
          opacity={grainOpacity}
          zIndex={82}
        />

        {/* Hero Viewport Bottom Soft Feather Mist */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-44 z-[74]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(247, 238, 242, 0.3) 30%, rgba(247, 238, 242, 0.8) 75%, #f7eef2 100%)",
          }}
        />

        {/* Hero Interface Typography & Controls Overlay (Reacts cleanly to scrollProgress) */}
        <HeroInterfaceOverlay scrollProgress={scrollProgress} />
      </div>

      {/* ========================================================= */}
      {/* 2. ATMOSPHERIC FEATHERED BLUR & MIST TRANSITION SEAM       */}
      {/* ========================================================= */}
      <div className="relative -mt-44 z-30 pointer-events-none h-48 w-full overflow-hidden">
        {/* Soft atmospheric backdrop blur with vertical fade mask */}
        <div
          className="absolute inset-0 backdrop-blur-[16px]"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 25%, black 70%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 25%, black 70%, black 100%)",
          }}
        />

        {/* Multi-stop soft rose mist gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f7eef2]/75 to-[#f7eef2]" />

        {/* Subtle glowing fog horizon */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#f7eef2] via-[#f7eef2]/95 to-transparent" />
      </div>

      {/* ========================================================= */}
      {/* 3. DYNAMIC CONTENT SECTIONS (Hero-Themed About & Events)   */}
      {/* ========================================================= */}
      <div className="relative z-20">
        {/* About Section in Hero Dawn Theme */}
        <HeroThemeAbout />

        {/* Featured Events Section in Hero Dawn Theme (Live Dynamic Data from /api/events) */}
        <HeroThemeEvents />

        {/* Global Footer in Hero Dawn Theme */}
        <HeroThemeFooter />
      </div>
    </div>
  );
}

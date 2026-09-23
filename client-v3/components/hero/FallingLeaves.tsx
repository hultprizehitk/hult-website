"use client";

import React, { useMemo } from "react";
import { LEAVES_SPRITESHEET } from "@/lib/hero-layers-config";

interface FallingLeavesProps {
  /** Whether leaves should be visible and animating */
  active: boolean;
  /** Number of leaf particles */
  count?: number;
}

interface LeafParticle {
  id: number;
  /** Column in spritesheet (0-indexed) */
  col: number;
  /** Row in spritesheet (0-indexed) */
  row: number;
  /** Starting X position as % */
  startX: number;
  /** Leaf size in px */
  size: number;
  /** Fall duration in seconds */
  fallDuration: number;
  /** Sway amplitude in px */
  swayAmplitude: number;
  /** Sway duration in seconds */
  swayDuration: number;
  /** Rotation range in degrees */
  rotationEnd: number;
  /** Animation delay in seconds */
  delay: number;
  /** Opacity */
  opacity: number;
}

/**
 * Seeded pseudo-random number generator for deterministic leaf placement.
 * Avoids hydration mismatches between server and client.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function FallingLeaves({ active, count = 14 }: FallingLeavesProps) {
  const particles = useMemo<LeafParticle[]>(() => {
    const rand = seededRandom(42);
    const leaves: LeafParticle[] = [];

    for (let i = 0; i < count; i++) {
      leaves.push({
        id: i,
        col: Math.floor(rand() * LEAVES_SPRITESHEET.cols),
        row: Math.floor(rand() * LEAVES_SPRITESHEET.rows),
        startX: 5 + rand() * 90,
        size: 22 + rand() * 26,
        fallDuration: 6 + rand() * 7,
        swayAmplitude: 40 + rand() * 70,
        swayDuration: 3 + rand() * 4,
        rotationEnd: 180 + rand() * 540,
        delay: rand() * 10,
        opacity: 0.6 + rand() * 0.35,
      });
    }

    return leaves;
  }, [count]);

  // Pre-calculate the scale factor: we want each cell to render at leaf.size px
  // Original cell is cellWidth x cellHeight in the spritesheet
  const { cellWidth, cellHeight, totalWidth, totalHeight, cols, rows } = LEAVES_SPRITESHEET;

  return (
    <>
      <style>{`
        @keyframes leafFall {
          0% {
            transform: translateY(-80px);
          }
          100% {
            transform: translateY(calc(100vh + 120px));
          }
        }

        @keyframes leafSway {
          0%, 100% {
            transform: translateX(0px);
          }
          25% {
            transform: translateX(var(--leaf-sway));
          }
          75% {
            transform: translateX(calc(var(--leaf-sway) * -1));
          }
        }

        @keyframes leafSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(var(--leaf-rot));
          }
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          zIndex: 5,
          opacity: active ? 1 : 0,
          transition: "opacity 1.5s ease-in",
        }}
        aria-hidden="true"
      >
        {particles.map((leaf) => {
          const scale = leaf.size / cellWidth;
          const imgWidth = totalWidth * scale;
          const imgHeight = totalHeight * scale;
          // Offset to show the correct cell
          const offsetX = -(leaf.col * cellWidth * scale);
          const offsetY = -(leaf.row * cellHeight * scale);

          return (
            <div
              key={leaf.id}
              className="absolute"
              style={{
                left: `${leaf.startX}%`,
                top: "-80px",
                ["--leaf-sway" as string]: `${leaf.swayAmplitude}px`,
                ["--leaf-rot" as string]: `${leaf.rotationEnd}deg`,
                animation: `leafFall ${leaf.fallDuration}s linear ${leaf.delay}s infinite`,
              }}
            >
              {/* Sway wrapper */}
              <div
                style={{
                  animation: `leafSway ${leaf.swayDuration}s ease-in-out ${leaf.delay * 0.5}s infinite`,
                }}
              >
                {/* Spin wrapper */}
                <div
                  style={{
                    animation: `leafSpin ${leaf.fallDuration * 0.8}s linear ${leaf.delay}s infinite`,
                  }}
                >
                  {/* Leaf cell — overflow:hidden clips to exactly one sprite cell */}
                  <div
                    style={{
                      width: `${leaf.size}px`,
                      height: `${leaf.size}px`,
                      overflow: "hidden",
                      opacity: leaf.opacity,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LEAVES_SPRITESHEET.src}
                      alt=""
                      draggable={false}
                      className="block select-none pointer-events-none"
                      style={{
                        width: `${imgWidth}px`,
                        height: `${imgHeight}px`,
                        transform: `translate(${offsetX}px, ${offsetY}px)`,
                        maxWidth: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

"use client";

import React, { useEffect, useRef } from "react";

export const PETAL_SPRITE_FRAMES = [
  { sx: 24, sy: 266, sw: 259, sh: 295 },
  { sx: 331, sy: 273, sw: 280, sh: 289 },
  { sx: 667, sy: 290, sw: 240, sh: 272 },
  { sx: 977, sy: 286, sw: 253, sh: 279 },
  { sx: 77, sy: 721, sw: 147, sh: 311 },
  { sx: 318, sy: 832, sw: 305, sh: 149 },
  { sx: 739, sy: 713, sw: 131, sh: 330 },
  { sx: 964, sy: 820, sw: 270, sh: 168 },
];

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  frameIndex: number;
  rotation: number;
  rotSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  swayPhase: number;
  swayAmp: number;
  swayFreq: number;
  opacity: number;
  depthZ: number; // 0 (far) to 2 (near)
}

interface FallingPetalsProps {
  density?: number;
  speedMultiplier?: number;
  windIntensity?: number;
  enabled?: boolean;
  mouseOffset?: { x: number; y: number };
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function FallingPetals({
  density = 15,
  speedMultiplier = 0.7,
  windIntensity = 1,
  enabled = true,
  mouseOffset = { x: 0, y: 0 },
  zIndex = 65,
  className = "",
  style = {},
}: FallingPetalsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const mouseOffsetRef = useRef(mouseOffset);

  mouseOffsetRef.current = mouseOffset;

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/hult-prize-hero/particles/cherry-petals-sprite.png";
    img.onload = () => {
      spriteRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Helper to spawn a petal directly from the branch blossom clusters
    const createPetal = (spawnAnywhere = false): Petal & { targetOpacity: number } => {
      const depthZ = Math.random(); // 0 to 1
      const isNear = depthZ > 0.82;
      const isFar = depthZ < 0.35;

      const baseSize = isNear
        ? 32 + Math.random() * 14
        : isFar
        ? 14 + Math.random() * 7
        : 22 + Math.random() * 10;

      // 65% spawn from upper-left branch, 35% from upper-right branch
      const isLeftBranch = Math.random() < 0.65;
      const branchProgress = Math.random();

      let originX = 0;
      let originY = 0;
      let vx = 0;
      const vy = (isNear ? 1.5 : isFar ? 0.8 : 1.1) * (0.8 + Math.random() * 0.4);

      if (isLeftBranch) {
        // Upper-Left Branch: blossoms span diagonally down and rightwards
        const reachX = Math.min(390, width * 0.26);
        const reachY = Math.min(270, height * 0.32);
        originX = Math.max(15, branchProgress * reachX + (Math.random() - 0.5) * 55);
        originY = Math.max(15, branchProgress * reachY + (Math.random() - 0.5) * 45);
        // Drifts softly rightwards and downwards across the scenery
        vx = (isNear ? 0.85 : isFar ? 0.45 : 0.65) * (0.8 + Math.random() * 0.5);
      } else {
        // Upper-Right Branch: blossoms span from top-right towards the center-left
        const reachX = Math.min(330, width * 0.22);
        const reachY = Math.min(250, height * 0.28);
        originX = width - Math.max(15, branchProgress * reachX + (Math.random() - 0.5) * 50);
        originY = Math.max(15, branchProgress * reachY + (Math.random() - 0.5) * 40);
        // Drifts downwards and slightly towards center
        vx = (-0.25 + Math.random() * 0.6) * (isNear ? 1.1 : 0.8);
      }

      let startX = originX;
      let startY = originY;

      const targetOpacity = isFar ? 0.45 + Math.random() * 0.25 : 0.8 + Math.random() * 0.2;

      // On initial scene load only, project petals down along their natural trajectory
      // so the scene has ambient depth immediately
      if (spawnAnywhere) {
        const fallProgress = Math.random();
        startY = originY + fallProgress * (height - originY);
        startX = originX + vx * (fallProgress * 260) + Math.sin(fallProgress * Math.PI * 3) * 25;
      }

      return {
        x: startX,
        y: startY,
        vx,
        vy,
        baseSize,
        frameIndex: Math.floor(Math.random() * PETAL_SPRITE_FRAMES.length),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.035,
        flipAngle: Math.random() * Math.PI * 2,
        flipSpeed: (0.02 + Math.random() * 0.04) * (Math.random() > 0.5 ? 1 : -1),
        swayPhase: Math.random() * Math.PI * 2,
        swayAmp: (isNear ? 1.6 : 1.0) * (0.8 + Math.random() * 0.6),
        swayFreq: 1.1 + Math.random() * 0.9,
        opacity: spawnAnywhere ? targetOpacity : 0,
        targetOpacity,
        depthZ,
      };
    };

    // Initialize initial pool of petals
    petalsRef.current = Array.from({ length: density }, () => createPetal(true));

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const sprite = spriteRef.current;
      const petals = petalsRef.current as (Petal & { targetOpacity?: number })[];
      const mOffset = mouseOffsetRef.current;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Soft fade in when detaching from branch
        if (p.targetOpacity && p.opacity < p.targetOpacity) {
          p.opacity = Math.min(p.targetOpacity, p.opacity + 0.05);
        }

        // Horizontal sway + wind drift
        const sway = Math.sin(time * p.swayFreq + p.swayPhase) * p.swayAmp;
        const windDrift = (p.vx + (mOffset.x * 0.8 * (p.depthZ + 0.5))) * windIntensity;
        p.x += (windDrift + sway) * speedMultiplier;

        // Vertical falling
        p.y += (p.vy + (mOffset.y * 0.3 * (p.depthZ + 0.2))) * speedMultiplier;

        // Rotation & 3D flutter
        p.rotation += p.rotSpeed * speedMultiplier;
        p.flipAngle += p.flipSpeed * speedMultiplier;

        // Respawn directly at the branches when falling off screen
        if (p.y > height + 40 || p.x > width + 60 || p.x < -60) {
          petals[i] = createPetal(false);
          continue;
        }

        if (!sprite || !sprite.complete) continue;

        // Draw petal sprite
        const frame = PETAL_SPRITE_FRAMES[p.frameIndex];
        const targetW = p.baseSize;
        const targetH = targetW * (frame.sh / frame.sw);

        // 3D flip distortion using scaleX = cos(flipAngle)
        const scaleX = Math.cos(p.flipAngle);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = p.opacity;

        ctx.drawImage(
          sprite,
          frame.sx,
          frame.sy,
          frame.sw,
          frame.sh,
          -targetW / 2,
          -targetH / 2,
          targetW,
          targetH
        );

        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [density, speedMultiplier, windIntensity, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{
        zIndex,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

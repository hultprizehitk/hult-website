"use client";

import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  scale: number;
  cell: number; // 0-3: which cell of the 2x2 sprite sheet
  wobble: number;
  wobbleSpeed: number;
  wobblePhase: number;
}

const SHEET_COLS = 2;
const SHEET_ROWS = 2;
const TOTAL_CELLS = SHEET_COLS * SHEET_ROWS;
const PETAL_COUNT = 28;
const SPRITE_SRC = "/assets/hult-prize-hero/particles/petal-sheet-v1.png";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawnPetal(canvasW: number): Petal {
  return {
    x: rand(-60, canvasW + 60),
    y: rand(-120, -20),
    vx: rand(-0.6, 0.6),
    vy: rand(0.55, 1.35),
    rotation: rand(0, Math.PI * 2),
    rotationSpeed: rand(-0.022, 0.022),
    opacity: rand(0.55, 0.92),
    scale: rand(0.28, 0.72),
    cell: Math.floor(Math.random() * TOTAL_CELLS),
    wobble: 0,
    wobbleSpeed: rand(0.018, 0.038),
    wobblePhase: rand(0, Math.PI * 2),
  };
}

export default function FallingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load sprite sheet
    const img = new Image();
    img.src = SPRITE_SRC;

    let rafId = 0;
    let petals: Petal[] = [];
    let cellW = 0;
    let cellH = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    img.onload = () => {
      cellW = img.naturalWidth / SHEET_COLS;
      cellH = img.naturalHeight / SHEET_ROWS;

      resize();
      window.addEventListener("resize", resize);

      // Seed petals already spread across the screen vertically
      petals = Array.from({ length: PETAL_COUNT }, () => {
        const p = spawnPetal(canvas.width);
        p.y = rand(0, canvas.height); // start spread, not all at top
        return p;
      });

      let t = 0;

      function draw() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        t += 1;

        for (const p of petals) {
          p.wobble = Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 1.1;
          p.x += p.vx + p.wobble;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;

          // Respawn at top when exits bottom or sides
          if (p.y > canvas.height + 80 || p.x < -100 || p.x > canvas.width + 100) {
            const fresh = spawnPetal(canvas.width);
            Object.assign(p, fresh);
          }

          const col = p.cell % SHEET_COLS;
          const row = Math.floor(p.cell / SHEET_COLS);
          const sw = cellW;
          const sh = cellH;
          const dw = sw * p.scale;
          const dh = sh * p.scale;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(
            img,
            col * cellW, row * cellH,  // source x, y
            sw, sh,                      // source w, h
            -dw / 2, -dh / 2,            // dest x, y (centered)
            dw, dh                        // dest w, h
          );
          ctx.restore();
        }

        rafId = requestAnimationFrame(draw);
      }

      draw();
    };

    img.onerror = () => {
      // Sprite failed to load — canvas stays empty, no crash
    };

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}

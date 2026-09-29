"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
}

const COLORS = ["#e4007f", "#f59e0b", "#10b981", "#06b6d4", "#a855f7", "#ffffff", "#fbbf24"];

export function ConfettiCanvas({ delayMs = 1200 }: { delayMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];

    const createParticles = () => {
      const count = 140;
      const w = canvas.width;
      const h = canvas.height;

      // Launch from both sides and bottom center
      for (let i = 0; i < count; i++) {
        const side = i % 3;
        let x = w / 2;
        let vx = (Math.random() - 0.5) * 16;
        const vy = -Math.random() * 18 - 8;

        if (side === 0) {
          x = w * 0.15;
          vx = Math.random() * 14 + 2;
        } else if (side === 1) {
          x = w * 0.85;
          vx = -Math.random() * 14 - 2;
        }

        particles.push({
          x,
          y: h + 20,
          vx,
          vy,
          size: Math.random() * 8 + 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
          shape: Math.random() > 0.3 ? "rect" : "circle",
        });
      }
    };

    let startTime = 0;

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.985; // Air resistance
        p.rotation += p.rotationSpeed;

        if (elapsed > 3000) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === "rect") {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      if (alive || elapsed < 4500) {
        animId = requestAnimationFrame(render);
      }
    };

    const timerId = setTimeout(() => {
      createParticles();
      animId = requestAnimationFrame(render);
    }, delayMs);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [delayMs]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
}

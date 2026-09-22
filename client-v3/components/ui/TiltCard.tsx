"use client";

import React, { useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export default function TiltCard({
  children,
  className = "",
  glowColor = "rgba(242, 0, 137, 0.35)",
  onClick,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8; // Max 8 deg tilt
    const rotateY = ((x - centerX) / centerX) * 8;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);

    const spotX = (x / rect.width) * 100;
    const spotY = (y / rect.height) * 100;
    setSpotlight({ x: spotX, y: spotY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform,
        transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
        transformStyle: "preserve-3d",
      }}
      className={`relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-black/60 backdrop-blur-2xl p-7 text-white shadow-2xl cursor-pointer group ${className}`}
    >
      {/* Dynamic Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(600px circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 40%)`,
        }}
      />

      {/* Top Iridescent Accent Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f20089] to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-20" />

      {/* Card Contents */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}

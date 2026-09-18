"use client";

import React from "react";

interface FadedSectionDividerProps {
  glowColor?: "pink" | "purple" | "emerald" | "cyan";
  label?: string;
}

export default function FadedSectionDivider({
  glowColor = "pink",
  label,
}: FadedSectionDividerProps) {
  const glowMap = {
    pink: "from-[#f20089]/30 via-pink-400/50 to-purple-600/30",
    purple: "from-purple-600/30 via-purple-400/50 to-indigo-600/30",
    emerald: "from-emerald-500/30 via-teal-400/50 to-cyan-500/30",
    cyan: "from-cyan-500/30 via-sky-400/50 to-blue-600/30",
  };

  const badgeMap = {
    pink: "bg-[#f20089]/15 border-[#f20089]/40 text-pink-300",
    purple: "bg-purple-500/15 border-purple-500/40 text-purple-300",
    emerald: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
    cyan: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
  };

  return (
    <div className="relative w-full py-6 sm:py-10 flex items-center justify-center overflow-hidden z-20 pointer-events-none select-none">
      {/* Soft Blurred Glow Layer behind the line */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 sm:w-1/2 h-12 bg-gradient-to-r ${glowMap[glowColor]} blur-3xl opacity-50`}
      />

      {/* Faded Gradient Line: Translucent at edges, glowing in middle */}
      <div className="relative w-full max-w-6xl mx-6 sm:mx-12 flex items-center justify-center">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        
        {label ? (
          <div className={`absolute px-4 py-1 rounded-full border backdrop-blur-2xl text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl ${badgeMap[glowColor]}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            <span>{label}</span>
          </div>
        ) : (
          <div className="absolute h-2.5 w-2.5 rounded-full bg-white/70 shadow-[0_0_15px_rgba(255,255,255,0.9)] border border-white/50" />
        )}
      </div>
    </div>
  );
}

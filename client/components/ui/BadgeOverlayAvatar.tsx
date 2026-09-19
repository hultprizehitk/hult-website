"use client";

import React from "react";
import Image from "next/image";

export interface BadgeOverlayAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isLeader?: boolean;
  isAdmin?: boolean;
  rank?: number;
  badgePin?: "crown" | "scholar" | "champion" | "finalist" | "leaf";
  glowColor?: string;
  className?: string;
}

export default function BadgeOverlayAvatar({
  src,
  name = "Student",
  size = "md",
  isLeader = false,
  isAdmin = false,
  rank,
  badgePin,
  glowColor = "rgba(242, 0, 137, 0.6)",
  className = "",
}: BadgeOverlayAvatarProps) {
  // Dimension maps
  const dimensionMap = {
    sm: { container: "h-10 w-10", text: "text-xs", pin: "h-4 w-4", pinText: "text-[9px]" },
    md: { container: "h-16 w-16", text: "text-lg", pin: "h-6 w-6", pinText: "text-xs" },
    lg: { container: "h-20 w-20", text: "text-2xl", pin: "h-7 w-7", pinText: "text-sm" },
    xl: { container: "h-28 w-28", text: "text-4xl", pin: "h-9 w-9", pinText: "text-base" },
  };

  const dim = dimensionMap[size];
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "H";

  // Determine Frame Ring Styling based on rank / role
  const ringStyle =
    rank === 1
      ? "border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
      : rank === 2
      ? "border-2 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.5)]"
      : rank === 3
      ? "border-2 border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.5)]"
      : isLeader
      ? "border-2 border-[#f20089] shadow-[0_0_20px_rgba(242,0,137,0.6)]"
      : isAdmin
      ? "border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]"
      : "border border-white/20 shadow-md";

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* Outer Ring & Avatar Container */}
      <div
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-tr from-[#f20089] to-purple-600 font-extrabold text-white overflow-hidden transition-all hover:scale-105 ${dim.container} ${ringStyle}`}
      >
        {src ? (
          <Image
            src={src}
            alt={name || "Student Avatar"}
            width={128}
            height={128}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <span className={`font-[family-name:var(--font-google-sans)] ${dim.text}`}>
            {initials}
          </span>
        )}
      </div>

      {/* Gamified Badge Overlay Pin (Bottom-Right Corner - Clash Style) */}
      {(isLeader || badgePin || rank === 1) && (
        <div
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-[#121216] border border-white/30 text-white shadow-lg ${dim.pin}`}
          title={isLeader ? "Team Leader" : rank === 1 ? "1st Place Champion" : "Verified Badge"}
        >
          {isLeader || badgePin === "crown" ? (
            <span className={dim.pinText}>👑</span>
          ) : rank === 1 || badgePin === "champion" ? (
            <span className={dim.pinText}>🏆</span>
          ) : badgePin === "scholar" ? (
            <span className={dim.pinText}>⚡</span>
          ) : (
            <span className={dim.pinText}>🚀</span>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import TeamClanBadgeSVG from "./TeamClanBadgeSVG";
import { LeaderCrownSVG, ChampionTrophySVG } from "./CustomSvgIcons";

export interface BadgeOverlayAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isLeader?: boolean;
  isAdmin?: boolean;
  rank?: number;
  teamBadgeConfig?: {
    shape?: "shield" | "banner" | "hexagon" | "diamond" | "crown";
    primaryColor?: string;
    accentColor?: string;
    icon?: "phoenix" | "crown" | "lightning" | "rocket" | "leaf" | "atom" | "sword" | "dragon";
  };
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
  teamBadgeConfig,
  glowColor = "rgba(242, 0, 137, 0.6)",
  className = "",
}: BadgeOverlayAvatarProps) {
  // Dimension maps
  const dimensionMap = {
    sm: { container: "h-10 w-10", text: "text-xs", badgeSize: 18, pin: "h-4 w-4", iconSize: "w-2.5 h-2.5" },
    md: { container: "h-16 w-16", text: "text-lg", badgeSize: 26, pin: "h-5 w-5", iconSize: "w-3 h-3" },
    lg: { container: "h-20 w-20", text: "text-2xl", badgeSize: 32, pin: "h-6 w-6", iconSize: "w-3.5 h-3.5" },
    xl: { container: "h-28 w-28", text: "text-4xl", badgeSize: 42, pin: "h-7 w-7", iconSize: "w-4 h-4" },
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

      {/* OVERLAY: Dynamic SVG Team Badge (Appears when student is part of a team) */}
      {teamBadgeConfig && (
        <div
          className="absolute -bottom-1 -right-1 drop-shadow-xl hover:scale-110 transition-transform pointer-events-none"
          title="Official Team Guild Badge"
        >
          <TeamClanBadgeSVG
            size={dim.badgeSize}
            shape={teamBadgeConfig.shape}
            primaryColor={teamBadgeConfig.primaryColor}
            accentColor={teamBadgeConfig.accentColor}
            icon={teamBadgeConfig.icon}
          />
        </div>
      )}

      {/* Leader Crown Pin (Top-Right or Offset when Team Badge exists) */}
      {(isLeader || rank === 1) && !teamBadgeConfig && (
        <div
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-[#121216] border border-amber-400/60 shadow-lg ${dim.pin}`}
          title={isLeader ? "Team Leader" : "1st Place Champion"}
        >
          {isLeader ? (
            <LeaderCrownSVG size={14} />
          ) : (
            <ChampionTrophySVG size={14} />
          )}
        </div>
      )}
    </div>
  );
}

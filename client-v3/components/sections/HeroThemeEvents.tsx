"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Calendar, MapPin, Users, ArrowRight, ExternalLink } from "lucide-react";
import type { PublicEvent } from "@/types";
import { SEED_EVENTS } from "@/lib/seed-data";
import { useThemeTuner } from "@/context/ThemeTunerContext";

// ─── Word wrap helper for SVG text ───────────────────────────────────────────
function wrapText(text: string, cardWidth: number, approxCharWidth: number): string[] {
  const availableWidth = Math.max(200, cardWidth - 96);
  const maxChars = Math.max(8, Math.floor(availableWidth / approxCharWidth));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxChars) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export default function HeroThemeEvents() {
  const { config, getCardStyle, getBigTextStyle, getHeaderShadow } = useThemeTuner();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [cardSize, setCardSize] = useState({ width: 1200, height: 400 });
  const [titlePos, setTitlePos] = useState({ x: 48, y: 120, fontSize: "40px" });
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`);
    setSpotlight({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  useEffect(() => {
    setEvents(SEED_EVENTS);
    setLoading(false);
  }, []);

  useEffect(() => {
    const update = () => {
      if (!cardRef.current || !titleRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const textRect = titleRef.current.getBoundingClientRect();
      const style = window.getComputedStyle(titleRef.current);
      setCardSize({
        width: Math.round(cardRect.width),
        height: Math.round(cardRect.height),
      });
      setTitlePos({
        x: Math.round(textRect.left - cardRect.left),
        y: Math.round(textRect.top - cardRect.top),
        fontSize: style.fontSize,
      });
    };
    update();
    const t1 = setTimeout(update, 50);
    const t2 = setTimeout(update, 200);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", update);
    };
  }, [events, selectedIndex, config.cardBgOpacity]);

  if (loading) {
    return (
      <section id="events" className="w-full py-20 px-6 text-center bg-transparent">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </section>
    );
  }

  if (events.length === 0) return null;

  const featuredEvent = events[selectedIndex] || events[0];
  const parsedFontSize = parseFloat(titlePos.fontSize) || 36;
  const titleLines = wrapText(featuredEvent.title, cardSize.width, parsedFontSize * 0.55);

  return (
    <section
      id="events"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-transparent text-neutral-900"
    >
      {/* ========================================================= */}
      {/* ATMOSPHERIC BACKGROUND ACCENTS                            */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Editorial Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
            <div className="space-y-3">
              <h2
                className="font-jomolhari text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-neutral-900 leading-[1.05]"
                style={{
                  textShadow: getHeaderShadow(),
                }}
              >
                Featured Venture Challenges
              </h2>
            </div>

            {/* Clean outline button — no solid background */}
            <Link
              href="/events"
              className="rounded-full border border-neutral-900/60 hover:bg-neutral-900/5 px-5 py-2.5 text-xs font-semibold text-neutral-900 transition-all hover:scale-105 flex items-center gap-2 font-mono"
            >
              <span>View All Events ({events.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-900" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Multi-event tab selector */}
        {events.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {events.map((ev, idx) => (
              <button
                key={ev._id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`rounded-full px-4 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedIndex === idx
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-transparent text-neutral-800 hover:bg-black/5 border border-neutral-300"
                }`}
              >
                {ev.title}
              </button>
            ))}
          </div>
        )}

        {/* 3D Tilt Featured Card — NO background, NO shadows */}
        <ScrollReveal direction="up" delay={140}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              background: "transparent",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
              transform,
              transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
              transformStyle: "preserve-3d",
            }}
            className="group relative overflow-hidden rounded-3xl p-8 sm:p-12 transition-all duration-300 space-y-8"
          >
            {/* Stencil Paper Cutout Surface — covers the ENTIRE card, punches hole for title */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox={`0 0 ${cardSize.width} ${cardSize.height}`}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              style={{ borderRadius: "1.5rem" }}
            >
              <defs>
                <mask
                  id="stencil-paper-cutout"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width={cardSize.width}
                  height={cardSize.height}
                >
                  {/* White covers 100% of card with matching rounded corners */}
                  <rect x="0" y="0" width={cardSize.width} height={cardSize.height} fill="white" rx="24" ry="24" />
                  {/* Black text = cut hole directly through the card to the live background! */}
                  <text
                    x={titlePos.x}
                    y={titlePos.y}
                    fill="black"
                    fontFamily="var(--font-jomolhari)"
                    fontWeight="700"
                    fontSize={titlePos.fontSize}
                    dominantBaseline="hanging"
                  >
                    {titleLines.map((line, i) => (
                      <tspan key={i} x={titlePos.x} dy={i === 0 ? 0 : "1.15em"}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width={cardSize.width}
                height={cardSize.height}
                rx="24"
                ry="24"
                fill={`rgba(255, 255, 255, ${config.cardBgOpacity > 0 ? config.cardBgOpacity : 0.24})`}
                mask="url(#stencil-paper-cutout)"
              />
              {/* SVG border — perfectly aligned with fill */}
              <rect
                x="0.5" y="0.5"
                width={cardSize.width - 1} height={cardSize.height - 1}
                rx="23.5" ry="23.5"
                fill="none"
                stroke={`rgba(255,255,255,${config.cardBorderOpacity > 0 ? config.cardBorderOpacity : 0.45})`}
                strokeWidth="1"
              />
              {/* 1px crisp black rim around the cutout hole */}
              <text
                x={titlePos.x}
                y={titlePos.y}
                fill="none"
                stroke="rgba(0, 0, 0, 0.8)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                mask="url(#stencil-paper-cutout)"
                fontFamily="var(--font-jomolhari)"
                fontWeight="700"
                fontSize={titlePos.fontSize}
                dominantBaseline="hanging"
              >
                {titleLines.map((line, i) => (
                  <tspan key={i} x={titlePos.x} dy={i === 0 ? 0 : "1.15em"}>
                    {line}
                  </tspan>
                ))}
              </text>
            </svg>

            {/* Card top meta */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-900 px-3.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-sm">
                  {featuredEvent.tag || "Venture Challenge"}
                </span>
                {featuredEvent.registrationStatus && (
                  <span className="rounded-full border border-neutral-300 bg-black/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-900 font-bold">
                    {featuredEvent.registrationStatus}
                  </span>
                )}
              </div>

              {featuredEvent.registrationDeadline && (
                <div
                  className="text-[11px] font-mono font-bold text-neutral-950 flex items-center gap-1.5"
                  style={{ textShadow: "0 0 1px rgba(255,255,255,0.95)" }}
                >
                  <Calendar className="h-3.5 w-3.5 text-neutral-900" />
                  <span>Deadline: {new Date(featuredEvent.registrationDeadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Main content grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                {/* Event title: invisible HTML spacer preserving exact responsive layout */}
                <h3
                  ref={titleRef}
                  className="font-jomolhari text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight select-none opacity-0 pointer-events-none"
                >
                  {featuredEvent.title}
                </h3>
                <p
                  className="text-sm sm:text-base text-neutral-950 font-bold leading-relaxed font-sans line-clamp-3"
                  style={{
                    textShadow: "0 0 1px rgba(255,255,255,1)",
                  }}
                >
                  {featuredEvent.description}
                </p>

                {/* Highlight mini-cards — High-contrast dark glass */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {featuredEvent.venue && (
                    <div className="rounded-xl border border-white/30 bg-neutral-950/75 backdrop-blur-md p-3 space-y-1 shadow-sm">
                      <div className="flex items-center gap-1.5 text-rose-300">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Venue</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate">{featuredEvent.venue}</div>
                    </div>
                  )}

                  {(featuredEvent.minTeamMembers || featuredEvent.maxTeamMembers) && (
                    <div className="rounded-xl border border-white/30 bg-neutral-950/75 backdrop-blur-md p-3 space-y-1 shadow-sm">
                      <div className="flex items-center gap-1.5 text-rose-300">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Team</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {featuredEvent.minTeamMembers && featuredEvent.maxTeamMembers
                          ? `${featuredEvent.minTeamMembers}-${featuredEvent.maxTeamMembers} Members`
                          : `${featuredEvent.maxTeamMembers || featuredEvent.minTeamMembers} Members`}
                      </div>
                    </div>
                  )}

                  {featuredEvent.date && (
                    <div className="rounded-xl border border-white/30 bg-neutral-950/75 backdrop-blur-md p-3 space-y-1 shadow-sm">
                      <div className="flex items-center gap-1.5 text-rose-300">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Date</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate">{featuredEvent.date}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons — plain neutral */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-4 lg:pl-6 lg:border-l lg:border-neutral-200/60">
                <Link
                  href="/register"
                  className="group/btn relative w-full overflow-hidden rounded-full bg-neutral-900 hover:bg-black px-7 py-4 text-center font-bold text-white shadow-md border border-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <span>Register Your Venture Team</span>
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href={`/events/${featuredEvent._id}`}
                  className="w-full rounded-full border border-neutral-900 bg-white/40 hover:bg-neutral-900 hover:text-white px-7 py-3 text-center text-xs font-bold text-neutral-950 transition-all flex items-center justify-center gap-2 font-mono shadow-sm"
                  style={{ textShadow: "0 0 1px rgba(255,255,255,0.8)" }}
                >
                  <span>View Complete Event Details</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

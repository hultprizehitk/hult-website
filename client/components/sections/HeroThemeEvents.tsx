"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Calendar, MapPin, Users, ArrowRight, ExternalLink } from "lucide-react";
import type { PublicEvent } from "@/app/events/page";

export default function HeroThemeEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 3D Tilt & Cursor Spotlight state
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
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="events" className="w-full py-20 px-6 text-center bg-[#fbf7f8]">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#e60067] border-t-transparent" />
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const featuredEvent = events[selectedIndex] || events[0];

  return (
    <section
      id="events"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-gradient-to-b from-[#fbf7f8] via-[#f7edf1] to-[#f5eaee] text-[#211B1C]"
    >
      {/* ========================================================= */}
      {/* LAYERED BACKGROUND ELEMENTS (Sakura, Water, Zen Rings)     */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Delicate Water Ripple Shimmer Plane */}
        <div
          className="absolute inset-0 opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: "url('/assets/hult-prize-hero/water/water-ripples.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Top-Left Framing Sakura Sprig */}
        <div className="absolute -top-12 -left-12 w-64 md:w-88 opacity-25 pointer-events-none">
          <img
            src="/assets/hult-prize-hero/branches/branch-left-secondary.png"
            alt=""
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>

        {/* Bottom-Right Framing Blossom Cluster */}
        <div className="absolute -bottom-16 -right-12 w-72 md:w-96 opacity-25 pointer-events-none">
          <img
            src="/assets/hult-prize-hero/foreground/foreground-blossoms-right.png"
            alt=""
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>

        {/* Concentric Zen Rings Background Accents */}
        <div className="absolute bottom-16 left-1/4 w-[420px] h-[420px] rounded-full border border-[#6F302B]/[0.06] pointer-events-none" />

        {/* Soft Ambient Radial Lighting */}
        <div className="absolute bottom-10 right-10 w-[550px] h-[320px] bg-gradient-to-l from-rose-200/40 via-pink-100/30 to-transparent blur-[120px] rounded-full" />

        {/* Floating Decorative Petal Decals */}
        <div className="absolute top-36 right-[22%] w-6 h-6 opacity-30 rotate-12">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path
              d="M50 12 C72 16, 92 38, 85 66 C79 84, 58 89, 46 85 C28 77, 18 56, 22 34 C25 18, 36 9, 50 12 Z"
              fill="#e96f82"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Editorial Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-[#6F302B]/15">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/ef-hult-prize-logo.png"
                  alt="EF Hult Prize Logo"
                  width={42}
                  height={28}
                  className="h-6 w-auto object-contain drop-shadow-sm"
                />
                <span className="h-px w-6 bg-[#6F302B]/30" />
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-[#6F302B] uppercase font-mono">
                  02 / Active Series
                </span>
              </div>

              <h2 className="font-jomolhari text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight hult-title-gradient leading-[1.05]">
                Featured Venture Challenges
              </h2>
            </div>

            <Link
              href="/events"
              className="rounded-full border border-[#6F302B]/20 bg-white/80 hover:bg-white px-5 py-2.5 text-xs font-semibold text-[#211B1C] shadow-sm hover:shadow-md transition-all hover:scale-105 flex items-center gap-2 font-mono"
            >
              <span>View All Events ({events.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#e60067]" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Multi-event tab selector if multiple events exist */}
        {events.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {events.map((ev, idx) => (
              <button
                key={ev._id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`rounded-full px-4 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedIndex === idx
                    ? "bg-[#211B1C] text-white shadow-sm"
                    : "bg-white/80 text-[#6F302B] hover:bg-white border border-[#6F302B]/15"
                }`}
              >
                {ev.title}
              </button>
            ))}
          </div>
        )}

        {/* Bespoke Glassy Floral 3D Tilt Card */}
        <ScrollReveal direction="up" delay={140}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform,
              transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
              transformStyle: "preserve-3d",
            }}
            className="group relative overflow-hidden rounded-3xl border border-[#f0cbd6]/90 bg-gradient-to-br from-[#fff7f9]/95 via-white/85 to-[#fdf1f6]/95 backdrop-blur-2xl p-8 sm:p-12 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_18px_50px_rgba(217,67,91,0.08)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_24px_65px_rgba(217,67,91,0.16)] transition-all duration-300 space-y-8"
          >
            {/* Top Delicate Cherry Blossom Branch Creeping In from Top-Right */}
            <div className="absolute -top-10 -right-10 w-72 sm:w-96 pointer-events-none opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 ease-out select-none">
              <img
                src="/assets/hult-prize-hero/branches/cherry-branch-right.png"
                alt=""
                className="w-full h-auto object-contain drop-shadow-sm"
                draggable={false}
              />
            </div>

            {/* Top-Left Delicate Branch Sprig */}
            <div className="absolute -top-8 -left-8 w-64 sm:w-80 pointer-events-none opacity-35 select-none">
              <img
                src="/assets/hult-prize-hero/branches/branch-left-secondary.png"
                alt=""
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>

            {/* Bottom-Left Blossoming Cherry Sprig Reaching Up */}
            <div className="absolute -bottom-12 -left-10 w-72 sm:w-96 pointer-events-none opacity-55 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ease-out select-none">
              <img
                src="/assets/hult-prize-hero/branches/cherry-blossoms-left-bottom.png"
                alt=""
                className="w-full h-auto object-contain drop-shadow-sm"
                draggable={false}
              />
            </div>

            {/* Floating Delicate Cherry Petals */}
            <div className="absolute top-1/4 right-8 w-5 h-5 pointer-events-none opacity-35 group-hover:translate-y-1 transition-transform duration-500 select-none">
              <img
                src="/assets/hult-prize-hero/particles/extracted/petal-1.png"
                alt=""
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <div className="absolute bottom-1/3 right-12 w-4 h-4 pointer-events-none opacity-30 group-hover:-translate-y-1 transition-transform duration-500 select-none">
              <img
                src="/assets/hult-prize-hero/particles/extracted/petal-5.png"
                alt=""
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Soft Ambient Rose Halo */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-pink-300/25 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-rose-200/30 blur-3xl rounded-full pointer-events-none" />

            {/* Top Delicate Rose Gradient Hairline */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#e60067] to-transparent opacity-80" />

            {/* Dynamic Cursor Spotlight */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
              style={{
                opacity: spotlight.opacity,
                background: `radial-gradient(550px circle at ${spotlight.x}% ${spotlight.y}%, rgba(230, 0, 103, 0.08), transparent 45%)`,
              }}
            />

            {/* Header Badges */}
            <div className="relative z-20 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gradient-to-r from-[#e60067] via-[#dc165b] to-[#c70b4c] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-pink-600/20 font-mono">
                {featuredEvent.tag || "FLAGSHIP"}
              </span>
              <span className="rounded-full border border-[#f0cbd6] bg-white/75 backdrop-blur-sm px-3.5 py-1 text-[11px] font-bold text-[#6F302B] uppercase font-mono">
                Registration: {featuredEvent.registrationStatus || "open"}
              </span>
            </div>

            {/* Event Title & Crisp Copy */}
            <div className="relative z-20 space-y-3 max-w-3xl">
              <h3 className="font-jomolhari text-3xl sm:text-4xl lg:text-5xl font-bold hult-title-gradient tracking-tight">
                {featuredEvent.title}
              </h3>
              <p className="text-xs sm:text-base text-[#4a3b3e] font-sans font-medium leading-relaxed whitespace-pre-line">
                {featuredEvent.description}
              </p>
            </div>

            {/* Technical Parameter Cards with Glassy Floral Touch */}
            <div className="relative z-20 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="group/param relative overflow-hidden rounded-2xl border border-[#f0cbd6]/80 bg-white/75 backdrop-blur-md p-4 space-y-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(217,67,91,0.03)] hover:bg-white hover:border-[#e66c8b]/40 transition-all duration-300">
                <span className="text-[9.5px] text-[#6F302B]/75 uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#e60067]" />
                  <span>Timeline</span>
                </span>
                <span className="font-bold text-[#211B1C] text-sm block tabular-nums">
                  {featuredEvent.date}
                </span>
              </div>

              <div className="group/param relative overflow-hidden rounded-2xl border border-[#f0cbd6]/80 bg-white/75 backdrop-blur-md p-4 space-y-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(217,67,91,0.03)] hover:bg-white hover:border-[#e66c8b]/40 transition-all duration-300">
                <span className="text-[9.5px] text-[#6F302B]/75 uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#e60067]" />
                  <span>Campus Venue</span>
                </span>
                <span className="font-bold text-[#211B1C] text-sm block">
                  {featuredEvent.venue}
                </span>
              </div>

              <div className="group/param relative overflow-hidden rounded-2xl border border-[#f0cbd6]/80 bg-white/75 backdrop-blur-md p-4 space-y-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(217,67,91,0.03)] hover:bg-white hover:border-[#e66c8b]/40 transition-all duration-300">
                <span className="text-[9.5px] text-[#6F302B]/75 uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#e60067]" />
                  <span>Team Limit</span>
                </span>
                <span className="font-bold text-[#211B1C] text-sm block tabular-nums">
                  {featuredEvent.minTeamMembers || 3} to {featuredEvent.maxTeamMembers || 5} Members
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-20 pt-2 flex items-center gap-4 flex-wrap">
              <Link
                href={`/events?event=${featuredEvent._id}`}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e60067] via-[#dc165b] to-[#c70b4c] px-7 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-pink-600/25 transition-all duration-300 hover:scale-105 active:scale-95 font-mono"
              >
                <span>Register Team for {featuredEvent.title}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/events"
                className="flex items-center gap-2 rounded-full border border-[#6F302B]/20 bg-white hover:bg-[#faf4f6] px-6 py-3 text-xs sm:text-sm font-semibold text-[#211B1C] transition-all hover:scale-105 active:scale-95 font-mono"
              >
                <span>All Guidelines</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#6F302B]" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

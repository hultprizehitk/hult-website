"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Calendar, MapPin, Users, ArrowRight, ExternalLink } from "lucide-react";
import { INITIAL_EVENTS, type PublicEvent } from "@/data/events";

export default function HeroThemeEvents() {
  const [events] = useState<PublicEvent[]>(INITIAL_EVENTS);
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

  if (events.length === 0) {
    return null;
  }

  const featuredEvent = events[selectedIndex] || events[0];

  return (
    <section
      id="events"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-gradient-to-b from-[#fbf7f8] via-[#f7edf1] to-[#f5eaee] text-[#211B1C]"
    >
      {/* LAYERED BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div
          className="absolute inset-0 opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: "url('/assets/hult-prize-hero/water/water-ripples.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute -top-12 -left-12 w-64 md:w-88 opacity-25 pointer-events-none">
          <img
            src="/assets/hult-prize-hero/branches/branch-left-secondary.png"
            alt=""
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>

        <div className="absolute -bottom-16 -right-12 w-72 md:w-96 opacity-25 pointer-events-none">
          <img
            src="/assets/hult-prize-hero/foreground/foreground-blossoms-right.png"
            alt=""
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>

        <div className="absolute bottom-16 left-1/4 w-[420px] h-[420px] rounded-full border border-[#6F302B]/[0.06] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[320px] bg-gradient-to-l from-rose-200/40 via-pink-100/30 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <ScrollReveal direction="left" className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#6F302B]/40" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6F302B] font-mono">
                OnCampus Calendar
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#211B1C] font-[family-name:var(--font-google-sans)]">
              Featured Venture Events
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e60067] hover:text-[#b3004b] transition-colors group cursor-pointer"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>

        {/* Featured Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Spotlight Card (7 cols) */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="up">
              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform,
                  transition: "transform 0.15s ease-out",
                }}
                className="relative rounded-3xl p-8 sm:p-10 bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl shadow-rose-900/5 overflow-hidden transition-all duration-300"
              >
                {/* Interactive cursor spotlight shimmer */}
                <div
                  className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
                  style={{
                    opacity: spotlight.opacity,
                    background: `radial-gradient(600px circle at ${spotlight.x}% ${spotlight.y}%, rgba(242, 0, 137, 0.08), transparent 40%)`,
                  }}
                />

                <div className="relative z-10 space-y-6">
                  {/* Status & Tag */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] px-3.5 py-1 rounded-full bg-[#6F302B]/10 text-[#6F302B] font-mono">
                      {featuredEvent.tag}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                        featuredEvent.registrationStatus === "open"
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                          : featuredEvent.registrationStatus === "extended"
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          : "bg-neutral-500/10 text-neutral-600 border-neutral-500/20"
                      }`}
                    >
                      ● {featuredEvent.registrationStatus}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#211B1C] font-[family-name:var(--font-google-sans)]">
                      {featuredEvent.title}
                    </h3>
                    <p className="text-sm text-[#5c4a4e] leading-relaxed line-clamp-3">
                      {featuredEvent.description}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100/60">
                      <Calendar className="w-4 h-4 text-[#e60067]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6F302B]/70">Date</span>
                        <span className="text-xs font-semibold text-[#211B1C] truncate">{featuredEvent.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100/60">
                      <MapPin className="w-4 h-4 text-[#e60067]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6F302B]/70">Venue</span>
                        <span className="text-xs font-semibold text-[#211B1C] truncate">{featuredEvent.venue}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100/60">
                      <Users className="w-4 h-4 text-[#e60067]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6F302B]/70">Team Limit</span>
                        <span className="text-xs font-semibold text-[#211B1C]">{featuredEvent.minTeamMembers}-{featuredEvent.maxTeamMembers} Members</span>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-[#6F302B]/10">
                    <Link
                      href={`/events?event=${featuredEvent._id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#e60067] to-[#ff007f] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#e60067]/30 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>Enter Event Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {featuredEvent.link && (
                      <a
                        href={featuredEvent.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#5c4a4e] hover:text-[#e60067] transition-colors"
                      >
                        <span>Guidelines Doc</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Quick Select Events Rail (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6F302B]/70 font-mono px-2 block">
              Quick Select Event
            </span>

            {events.map((ev, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <ScrollReveal key={ev._id} direction="right" delay={idx * 60}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 border cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-white border-[#e60067]/40 shadow-lg shadow-rose-900/10 scale-[1.02]"
                        : "bg-white/40 hover:bg-white/70 border-white/60 text-[#5c4a4e]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-rose-100/60 text-[#6F302B]">
                          {ev.tag}
                        </span>
                        <span className="text-[11px] font-medium text-neutral-500">
                          {ev.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#211B1C]">
                        {ev.title}
                      </h4>
                    </div>

                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-[#e60067] text-white" : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

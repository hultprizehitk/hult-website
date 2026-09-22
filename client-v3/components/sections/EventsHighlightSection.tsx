"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import TiltCard from "@/components/ui/TiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import type { PublicEvent } from "@/app/events/page";

export default function EventsHighlightSection() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error("Failed to load events:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="events-preview" className="w-full py-16 px-6 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#f20089] border-t-transparent" />
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const featuredEvent = events[0];

  return (
    <section
      id="events-preview"
      className="relative w-full py-20 sm:py-28 px-6 sm:px-12 lg:px-20 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white font-[family-name:var(--font-google-sans)]"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-xl px-4 py-1.5 shadow-inner">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">
                  ACTIVE EVENT SERIES
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight font-[family-name:var(--font-google-sans)]">
                Featured Event:{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-pink-200 to-[#f20089] bg-clip-text text-transparent">
                  {featuredEvent.title}
                </span>
              </h2>
            </div>

            <Link
              href="/events"
              className="rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-5 py-2.5 text-xs font-bold text-white transition-all hover:scale-105 flex items-center gap-2 font-mono tabular-nums"
            >
              <span>View All Events ({events.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-pink-400" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Dynamic 3D Tilt Featured Card */}
        <ScrollReveal direction="up" delay={150}>
          <TiltCard glowColor="rgba(242, 0, 137, 0.4)" className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#f20089] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-[#f20089]/40 font-mono">
                {featuredEvent.tag || "FEATURED"}
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase font-mono">
                Status: {featuredEvent.registrationStatus || "open"}
              </span>
            </div>

            <div className="space-y-3 max-w-3xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-[family-name:var(--font-google-sans)]">
                {featuredEvent.title}
              </h3>
              <p className="text-xs sm:text-base text-white/80 font-sans leading-relaxed whitespace-pre-line">
                {featuredEvent.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
              <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-1">
                <span className="text-[9px] text-white/50 uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-pink-400" />
                  <span>Schedule</span>
                </span>
                <span className="font-bold text-white text-sm block tabular-nums">{featuredEvent.date}</span>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-1">
                <span className="text-[9px] text-white/50 uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-pink-400" />
                  <span>Venue</span>
                </span>
                <span className="font-bold text-white text-sm block">{featuredEvent.venue}</span>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-1">
                <span className="text-[9px] text-white/50 uppercase tracking-[0.2em] font-semibold flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-emerald-400" />
                  <span>Team Limit</span>
                </span>
                <span className="font-bold text-emerald-300 text-sm block tabular-nums">
                  {featuredEvent.minTeamMembers || 3} to {featuredEvent.maxTeamMembers || 5} Members
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Link
                href={`/events?event=${featuredEvent._id}`}
                className="rounded-2xl bg-gradient-to-r from-[#f20089] to-purple-600 hover:from-[#ff1a9b] hover:to-purple-500 px-7 py-3 text-xs font-bold text-white shadow-xl shadow-[#f20089]/40 transition-all hover:scale-105 active:scale-95 font-mono flex items-center gap-2"
              >
                <span>Register & Manage Team for {featuredEvent.title}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </section>
  );
}

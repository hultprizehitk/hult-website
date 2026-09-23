"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Calendar, MapPin, Users, ArrowRight, ExternalLink } from "lucide-react";
import type { PublicEvent } from "@/types";

function formatDate(dateStr?: string) {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function formatDateRange(start?: string, end?: string, fallback?: string) {
  if (start && end) {
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const isSameDay =
          s.getFullYear() === e.getFullYear() &&
          s.getMonth() === e.getMonth() &&
          s.getDate() === e.getDate();
        if (isSameDay) {
          const datePart = s.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const startTime = s.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          const endTime = e.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `${datePart} · ${startTime} – ${endTime}`;
        }
      }
    } catch {
      // fallback
    }
    const s = formatDate(start);
    const e = formatDate(end);
    return `${s} – ${e}`;
  }
  return fallback ? formatDate(fallback) : "Wed, Sep 30, 2026 · 12:00 PM – 6:00 PM";
}

export default function HeroThemeEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.events)) {
            setEvents(data.events);
          }
        }
      } catch (err) {
        console.error("Failed to load events in HeroThemeEvents:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section id="events" className="w-full py-20 px-6 text-center bg-transparent">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </section>
    );
  }

  if (events.length === 0) return null;

  const featuredEvent = events[selectedIndex] || events[0];
  const minMembers = featuredEvent.minTeamMembers || 2;
  const maxMembers = featuredEvent.maxTeamMembers || 4;

  return (
    <section
      id="events"
      className="relative w-full py-24 sm:py-32 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-transparent text-white"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Editorial Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-white/15">
            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#E8396E]">
                COMPETITION PIPELINE
              </div>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-wide uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                style={{
                  fontFamily: "'IM Fell Double Pica', Georgia, serif",
                  background: "linear-gradient(180deg, #2D052A 0%, #931289 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                FEATURED VENTURE CHALLENGES
              </h2>
            </div>

            <Link
              href="/events"
              className="rounded-full border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 text-xs font-mono font-bold text-white transition-all hover:scale-105 flex items-center gap-2 shadow-sm shrink-0"
            >
              <span>View All Events ({events.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Multi-event Selector Tabs */}
        {events.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {events.map((ev, idx) => (
              <button
                key={ev._id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`rounded-full px-4 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  selectedIndex === idx
                    ? "border-pink-500/60 bg-[#E8396E] text-white shadow-md shadow-pink-900/30"
                    : "border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {ev.title}
              </button>
            ))}
          </div>
        )}

        {/* Featured Card — Matching EventInsideView Design Scheme */}
        <ScrollReveal direction="up" delay={140}>
          <article className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 sm:p-10 shadow-2xl overflow-hidden flex flex-col gap-6">
            {/* Top Light Accent Glow */}
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

            <div className="relative z-[2] flex flex-col gap-6">
              {/* Status Badges Row */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 text-white/90 font-mono">
                  {featuredEvent.tag || "FLAGSHIP"}
                </span>

                {featuredEvent.registrationStatus === "closed" ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950/40 border border-rose-400/50 text-rose-300 font-mono">
                    REGISTRATIONS CLOSED
                  </span>
                ) : featuredEvent.registrationStatus === "extended" ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-950/40 border border-amber-400/50 text-amber-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    EXTENDED DEADLINE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/40 border border-emerald-400/50 text-emerald-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    REGISTRATIONS OPEN
                  </span>
                )}

                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white/75 font-mono">
                  Team: {minMembers} to {maxMembers} Members
                </span>
              </div>

              {/* Event Title */}
              <h3
                className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]"
                style={{ fontFamily: "'IM Fell Double Pica', Georgia, serif" }}
              >
                {featuredEvent.title}
              </h3>

              {/* Meta Grid (SCHEDULE, VENUE, ROSTER SIZE) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <Calendar size={13} className="text-rose-300/90 shrink-0" />
                    <span>SCHEDULE</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {formatDateRange(featuredEvent.startDate, featuredEvent.endDate, featuredEvent.date)}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <MapPin size={13} className="text-rose-300/90 shrink-0" />
                    <span>VENUE</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {featuredEvent.venue || "SV Auditorium"}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <Users size={13} className="text-rose-300/90 shrink-0" />
                    <span>ROSTER SIZE</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {minMembers}–{maxMembers} Members / Team
                  </span>
                </div>
              </div>

              {/* Executive Brief Section */}
              {featuredEvent.description && (
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-white/60">
                    EXECUTIVE BRIEF
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-white/80 font-sans">
                    {featuredEvent.description}
                  </p>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <Link
                  href="/register"
                  className="w-full sm:w-auto rounded-full bg-white hover:bg-neutral-100 px-7 py-3 text-xs font-bold text-neutral-950 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register Your Team</span>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-950" />
                </Link>

                <Link
                  href={`/events?event=${featuredEvent._id}`}
                  className="w-full sm:w-auto rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-3 text-xs font-mono font-bold text-white transition-all flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
                >
                  <span>View Full Event Details</span>
                  <ExternalLink className="h-3.5 w-3.5 text-white" />
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
}


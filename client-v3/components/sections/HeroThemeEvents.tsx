"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Calendar, MapPin, Users, ArrowRight, Clock, Timer } from "lucide-react";
import type { PublicEvent } from "@/types";
import { useCountdown } from "@/lib/countdown";

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

interface HeroThemeEventsProps {
  scrollProgress?: number;
}

export default function HeroThemeEvents({ scrollProgress }: HeroThemeEventsProps) {
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

  const featuredEvent = events.length > 0 ? (events[selectedIndex] || events[0]) : null;
  const countdown = useCountdown(featuredEvent?.registrationDeadline);
  const isClosed = featuredEvent ? (featuredEvent.registrationStatus === "closed" || countdown.isExpired) : false;

  // Scroll-driven pure opacity fade-in (ZERO vertical slide-in!) right after About Hult Prize section clears off
  const isScrollDriven = typeof scrollProgress === "number";
  const fadeStart = 0.54;
  const fadeEnd = 0.72;
  const rawProgress = isScrollDriven
    ? Math.min(1, Math.max(0, (scrollProgress - fadeStart) / (fadeEnd - fadeStart)))
    : 1;
  const easeProgress = Math.sin((rawProgress * Math.PI) / 2);
  const eventsOpacity = isScrollDriven ? easeProgress : 1;

  if (loading) {
    return (
      <section id="events" className="w-full py-20 px-6 text-center bg-transparent">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </section>
    );
  }

  if (events.length === 0 || !featuredEvent) return null;

  const minMembers = featuredEvent.minTeamMembers || 2;
  const maxMembers = featuredEvent.maxTeamMembers || 4;

  return (
    <section
      id="events"
      className="relative w-full py-16 sm:py-24 px-6 sm:px-12 lg:px-20 overflow-hidden font-[family-name:var(--font-google-sans)] bg-transparent text-white transition-opacity duration-300"
      style={{
        opacity: eventsOpacity,
        pointerEvents: eventsOpacity > 0.3 ? "auto" : "none",
        willChange: "opacity",
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Editorial Section Header */}
        <ScrollReveal direction="none">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-white/15">
            <div className="space-y-2">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-wide uppercase"
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
              className="rounded-full border border-black/20 bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 text-xs font-mono font-bold text-black transition-all hover:scale-105 flex items-center gap-2 shadow-sm shrink-0"
            >
              <span>View All Events ({events.length})</span>
              <ArrowRight className="h-3.5 w-3.5 text-black" />
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

        {/* Featured Card — Glassmorphic Translucent Black Card */}
        <ScrollReveal direction="none" delay={100}>
          <article className="relative rounded-3xl bg-black/55 backdrop-blur-2xl border border-white/15 p-7 sm:p-10 shadow-2xl overflow-hidden flex flex-col gap-6">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

            <div className="relative z-[2] flex flex-col gap-6">
              {/* Status Badges Row */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {featuredEvent.tag && featuredEvent.tag.trim().toLowerCase() !== "flagship" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 text-white/90 font-mono">
                    {featuredEvent.tag}
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wider backdrop-blur-md transition-all ${
                    isClosed
                      ? "bg-rose-500/[0.1] border border-rose-500/25 text-rose-300"
                      : featuredEvent.registrationStatus === "extended"
                      ? "bg-amber-500/[0.1] border border-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      : "bg-emerald-500/[0.1] border border-emerald-500/25 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  }`}
                >
                  {isClosed ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                  ) : (
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    </span>
                  )}
                  <span>
                    {isClosed
                      ? "REGISTRATIONS CLOSED"
                      : featuredEvent.registrationStatus === "extended"
                      ? "EXTENDED DEADLINE"
                      : "REGISTRATIONS OPEN"}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-white/[0.06] border border-white/15 text-white/80">
                  <Users size={11} className="text-rose-300/80 shrink-0" />
                  <span>Team: {minMembers}–{maxMembers} Members</span>
                </span>
              </div>

              {/* Event Title */}
              <h3
                className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]"
                style={{ fontFamily: "'IM Fell Double Pica', Georgia, serif" }}
              >
                {featuredEvent.title}
              </h3>

              {/* Meta Grid (SCHEDULE, VENUE, ROSTER SIZE, REGISTRATION DEADLINE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1.5 shadow-md backdrop-blur-md hover:border-white/20 transition-all">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <Calendar size={13} className="text-rose-300/90 shrink-0" />
                    <span>SCHEDULE</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {formatDateRange(featuredEvent.startDate, featuredEvent.endDate, featuredEvent.date)}
                  </span>
                </div>

                <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1.5 shadow-md backdrop-blur-md hover:border-white/20 transition-all">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <MapPin size={13} className="text-rose-300/90 shrink-0" />
                    <span>VENUE</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {featuredEvent.venue || "SV Auditorium"}
                  </span>
                </div>

                <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-1.5 shadow-md backdrop-blur-md hover:border-white/20 transition-all">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <Users size={13} className="text-rose-300/90 shrink-0" />
                    <span>ROSTER SIZE</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {minMembers}–{maxMembers} Members / Team
                  </span>
                </div>

                {/* Registration Deadline & Reverse Countdown Tile */}
                <div
                  className={`rounded-2xl p-4 flex flex-col justify-between gap-2 shadow-md backdrop-blur-md transition-all ${
                    isClosed
                      ? "bg-white/[0.04] border border-white/10 text-white/70"
                      : "bg-rose-500/[0.08] border border-rose-500/25 text-white shadow-[0_0_20px_rgba(242,0,137,0.12)] hover:border-rose-400/40"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    <Clock size={13} className={isClosed ? "text-white/40 shrink-0" : "text-rose-400 shrink-0"} />
                    <span>DEADLINE</span>
                    {!isClosed && countdown.hasDeadline && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse ml-auto" />
                    )}
                  </span>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
                      {countdown.formattedDeadline}
                    </span>
                    {!isClosed && countdown.hasDeadline ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-400/30 text-rose-300 w-fit shadow-sm">
                        <Timer size={10} className="text-rose-400 shrink-0 animate-pulse" />
                        <span className="tabular-nums tracking-wide">{countdown.countdownText}</span>
                      </div>
                    ) : isClosed ? (
                      <span className="text-[10px] font-mono text-white/40">
                        Registration Closed
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Executive Brief Section */}
              {featuredEvent.description && (
                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-white/60 font-mono">
                    EXECUTIVE BRIEF
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-white/80 font-sans font-medium">
                    {featuredEvent.description}
                  </p>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-start gap-4 border-t border-white/10">
                <Link
                  href={`/events?event=${featuredEvent._id}`}
                  className="w-full sm:w-auto rounded-full bg-white hover:bg-neutral-100 px-7 py-3 text-xs font-bold text-neutral-950 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register Your Team</span>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-950" />
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  );
}

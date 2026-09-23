"use client";

import React, { useEffect, useState, useRef } from "react";
import { Calendar, MapPin, Users, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { PublicEvent } from "@/types";

// ── Helpers ─────────────────────────────────────────────────────────────────
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
  return fallback ? formatDate(fallback) : "TBD";
}

// ── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "open";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md transition-all ${
        s === "open"
          ? "bg-emerald-500/[0.1] border border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
          : s === "extended"
          ? "bg-amber-500/[0.1] border border-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.12)]"
          : s === "closed"
          ? "bg-rose-500/[0.08] border border-rose-500/20 text-rose-300/80"
          : "bg-sky-500/[0.1] border border-sky-500/25 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
      }`}
    >
      {s === "open" ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </span>
      ) : s === "extended" ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        </span>
      ) : s === "closed" ? (
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-rose-400/70 shrink-0" />
      ) : (
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-sky-400 shrink-0" />
      )}
      <span>
        {s === "open"
          ? "Registrations Open"
          : s === "extended"
          ? "Extended"
          : s === "closed"
          ? "Closed"
          : "Upcoming"}
      </span>
    </span>
  );
}

// ── EventBox (Horizontal Box Card) ──────────────────────────────────────────
interface EventBoxProps {
  event: PublicEvent;
  onClick: () => void;
  onRegisterClick: (e: React.MouseEvent) => void;
}

function EventBox({ event, onClick, onRegisterClick }: EventBoxProps) {
  const dateLabel = formatDateRange(event.startDate, event.endDate, event.date);
  const minReq = event.minTeamMembers || 3;
  const maxReq = event.maxTeamMembers || 5;

  return (
    <article
      className="group relative overflow-hidden rounded-3xl cursor-pointer shrink-0 snap-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/15 bg-[#0c0a12]/85 hover:border-white/35 hover:bg-[#0c0a12]/95 backdrop-blur-2xl p-6 sm:p-7 flex flex-col justify-between w-[85vw] max-w-[360px] sm:w-[380px] md:w-[420px] select-none"
      style={{
        minHeight: "360px",
        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Top Iridescent Edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/5 blur-2xl group-hover:bg-[#f20089]/10 transition-all" />

      <div className="flex flex-col gap-4">
        {/* Top header row: Category Tag (if not Flagship) + Status Badge */}
        <div className="flex items-center justify-between gap-2">
          {event.tag && event.tag.trim().toLowerCase() !== "flagship" ? (
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur-sm">
              {event.tag}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/50 font-medium">
              <Sparkles size={11} className="text-rose-300/70" />
              <span>OnCampus Series</span>
            </span>
          )}
          <StatusBadge status={event.registrationStatus} />
        </div>

        {/* Title */}
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white group-hover:text-rose-200 transition-colors leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] line-clamp-2">
          {event.title}
        </h3>

        {/* Micro Description (if available) */}
        {event.description && (
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          <div className="flex items-center gap-2.5 text-xs text-white/80 font-medium bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
            <Calendar size={14} className="text-rose-300 shrink-0" />
            <span className="truncate">{dateLabel}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-white/80 font-medium bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
            <div className="flex items-center gap-2 truncate">
              <MapPin size={14} className="text-rose-300 shrink-0" />
              <span className="truncate">{event.venue || "Heritage Campus"}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-white/60 text-[11px] font-mono">
              <Users size={12} className="text-rose-300 shrink-0" />
              <span>{minReq}–{maxReq} Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button Row */}
      <div className="mt-6 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
        {event.registrationStatus === "closed" ? (
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-full bg-white/5 border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white/40 cursor-not-allowed font-mono"
            onClick={onRegisterClick}
          >
            <span>Registrations Closed</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-full bg-white hover:bg-neutral-100 px-5 py-3 text-xs font-bold text-neutral-950 uppercase tracking-wider shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.02] cursor-pointer"
            onClick={onRegisterClick}
          >
            <span>View Event &amp; Register</span>
            <ArrowRight size={14} className="text-neutral-950" />
          </button>
        )}
      </div>
    </article>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────
interface EventsHeroProps {
  events: PublicEvent[];
  loading: boolean;
  onSelectEvent: (event: PublicEvent) => void;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function EventsHero({
  events,
  loading,
  onSelectEvent,
}: EventsHeroProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [events]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const distance = 420;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-transparent font-sans text-white z-10 pt-20 pb-8 sm:pb-12">
      {/* ── Main Interactive Content Container ───────────────────────── */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col flex-1 min-h-0 justify-center">
        {/* Header / Hero Title Section */}
        <header className="flex flex-col items-center text-center py-2 shrink-0">
          {/* EVENTS Title - Solid white text */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-wider uppercase text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            EVENTS
          </h1>
        </header>

        {/* ── Horizontal Row of Event Boxes ───────────────────────────── */}
        <section className="relative w-full mt-6 sm:mt-8 flex items-center justify-center" aria-label="Event showcases">
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll events left"
              className="absolute -left-2 sm:left-2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/25 backdrop-blur-xl text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Horizontal scroll container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className={`w-full flex items-stretch gap-6 sm:gap-8 overflow-x-auto py-4 px-2 sm:px-6 snap-x no-scrollbar ${
              events.length <= 2 ? "justify-center" : "justify-start"
            }`}
            role="region"
            aria-label="Horizontal events list"
          >
            {loading ? (
              <div className="flex gap-6 justify-center w-full py-12">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-[340px] sm:w-[380px] h-[360px] rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-7 flex flex-col justify-between animate-pulse"
                  >
                    <div className="space-y-4">
                      <div className="h-6 w-24 rounded-full bg-white/10" />
                      <div className="h-8 w-3/4 rounded-xl bg-white/15" />
                      <div className="h-4 w-full rounded-md bg-white/10" />
                      <div className="h-14 rounded-2xl bg-white/5" />
                    </div>
                    <div className="h-11 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-10 text-center text-white/70 text-sm flex flex-col items-center gap-3.5 max-w-md mx-auto shadow-2xl">
                <Sparkles size={20} className="text-white/40" />
                <p>No events currently scheduled.</p>
              </div>
            ) : (
              events.map((event) => (
                <EventBox
                  key={event._id}
                  event={event}
                  onClick={() => onSelectEvent(event)}
                  onRegisterClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(event);
                  }}
                />
              ))
            )}
          </div>

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll events right"
              className="absolute -right-2 sm:right-2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/25 backdrop-blur-xl text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import type { PublicEvent } from "@/app/events/page";

// ── Tab definition ──────────────────────────────────────────────────────────
const TABS = ["ALL", "FLAGSHIP", "REGISTRATION", "QUIZ"] as const;
type Tab = (typeof TABS)[number];

// ── Sidebar decorative copy (matches reference) ─────────────────────────────
const RIGHT_SIDEBAR = [
  ["SMALL", "STEPS", "BIGGER", "TOMORROWS"],
  ["IDEAS.", "PEOPLE.", "IMPACT."],
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return "TBD";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
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
    const s = formatDate(start);
    const e = formatDate(end);
    return `${s} – ${e}`;
  }
  return fallback ? formatDate(fallback) : "TBD";
}

function parseEventDate(ev: PublicEvent) {
  const raw = ev.startDate || ev.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "open";
  const isLive = s === "open" || s === "extended";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        s === "open"
          ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-200"
          : s === "extended"
          ? "bg-amber-500/15 border border-amber-400/30 text-amber-200"
          : s === "closed"
          ? "bg-rose-500/15 border border-rose-400/30 text-rose-200"
          : "bg-white/10 border border-white/25 text-white/70"
      }`}
    >
      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {s === "open"
        ? "REGISTERING"
        : s === "extended"
        ? "EXTENDED"
        : s === "closed"
        ? "CLOSED"
        : "UPCOMING"}
    </span>
  );
}

// ── EventCard ───────────────────────────────────────────────────────────────
interface EventCardProps {
  event: PublicEvent;
  registeredTeam: any | null;
  onClick: () => void;
  onRegisterClick: (e: React.MouseEvent) => void;
}

function EventCard({ event, registeredTeam, onClick, onRegisterClick }: EventCardProps) {
  const dateLabel = formatDateRange(event.startDate, event.endDate, event.date);
  const totalJoined = registeredTeam ? 1 + (registeredTeam.members?.length || 0) : 0;
  const minReq = event.minTeamMembers || 3;
  const isComplete = totalJoined >= minReq;
  const tagLabel = event.tag ? event.tag.toUpperCase() : "FLAGSHIP";

  return (
    <article
      className="group relative overflow-hidden rounded-2xl cursor-pointer flex-shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)] border border-white/20 bg-white/[0.06] hover:border-white/45 hover:bg-white/[0.09] backdrop-blur-2xl p-6 flex flex-col justify-between"
      style={{
        minHeight: "220px",
        boxShadow: "0 10px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Top Iridescent Edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />

      <div>
        {/* Top header row: Category / Tag Badge + Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white/85 backdrop-blur-sm">
            {tagLabel}
          </span>
          <StatusBadge status={event.registrationStatus} />
        </div>

        {/* Title */}
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white transition-colors leading-snug mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {event.title}
        </h3>

        {/* Metadata */}
        <div className="flex flex-col gap-2 text-xs text-white/75 font-medium mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-rose-300/80 shrink-0" />
            <span className="truncate">{dateLabel}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-rose-300/80 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users size={14} className="text-rose-300/80 shrink-0" />
            <span>{event.minTeamMembers || 3}–{event.maxTeamMembers || 5} Members</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
        {registeredTeam ? (
          <button
            type="button"
            className={`w-full flex items-center justify-between rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md transition-transform hover:scale-105 cursor-pointer ${
              isComplete
                ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-400/30"
                : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-400/30"
            }`}
            onClick={onRegisterClick}
          >
            <span>{isComplete ? "Registered" : `Incomplete (${totalJoined}/${minReq})`}</span>
            <ArrowRight size={14} />
          </button>
        ) : event.registrationStatus === "closed" ? (
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/40 cursor-not-allowed"
            onClick={onRegisterClick}
          >
            <span>Registrations Closed</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-full bg-white hover:bg-neutral-100 px-4 py-2.5 text-xs font-bold text-neutral-950 uppercase tracking-wider shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all hover:scale-105 cursor-pointer"
            onClick={onRegisterClick}
          >
            <span>Register Team</span>
            <ArrowRight size={14} />
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
  userRegistrations: Record<string, any>;
  onSelectEvent: (event: PublicEvent) => void;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function EventsHero({
  events,
  loading,
  userRegistrations,
  onSelectEvent,
}: EventsHeroProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [scrolled, setScrolled] = useState(false);

  // Filtered events based on tab
  const filtered =
    activeTab === "ALL"
      ? events
      : events.filter((e) => e.tag?.toUpperCase() === activeTab);

  // Timeline entries
  const timelineEvents = filtered.length > 0 ? filtered : events;

  // ── Scroll detection for scroll cue only ─────────────────────────────────
  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-transparent font-sans text-white z-10 pt-20">
      {/* ── Main Interactive Content Container ───────────────────────── */}
      <div className="relative z-10 w-full max-w-[1440px] h-full mx-auto px-4 sm:px-8 pt-10 pb-5 flex flex-col">
        {/* Header / Hero Title Section */}
        <header className="flex flex-col items-center text-center py-2 shrink-0">
          {/* Subtitle taglines */}
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.28em] uppercase text-white/75 drop-shadow">
            <span>IDEAS MEET PEOPLE</span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span>CHANGE FOLLOWS</span>
          </div>

          <div className="flex items-center justify-center gap-2 w-32 mt-1.5 opacity-65">
            <span className="flex-1 h-[1px] bg-white/40" />
            <span className="w-1 h-1 rotate-45 bg-white/50" />
            <span className="flex-1 h-[1px] bg-white/40" />
          </div>

          {/* EVENTS Title — Home page platinum gradient language */}
          <h1
            className="font-serif text-6xl sm:text-7xl md:text-8xl font-bold tracking-wider uppercase mt-1"
            style={{
              background:
                "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 80%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter:
                "drop-shadow(0 2px 24px rgba(255,255,255,0.22)) drop-shadow(0 10px 36px rgba(0,0,0,0.85))",
            }}
          >
            EVENTS
          </h1>

          {/* Subtitle */}
          <p className="font-serif italic text-sm sm:text-base text-white/85 mt-1 tracking-wide">
            Be a part of the journey.
          </p>

          {/* Category Filter Tabs */}
          <nav className="relative flex flex-col items-center mt-4 w-full max-w-[540px]" aria-label="Event category filter">
            <div className="flex items-center justify-center gap-6 sm:gap-10 pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`relative bg-transparent border-0 cursor-pointer font-sans text-xs font-semibold tracking-widest uppercase transition-colors py-1 px-1 ${
                    activeTab === tab ? "text-white font-bold" : "text-white/70 hover:text-white"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                  )}
                </button>
              ))}
            </div>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          </nav>
        </header>

        {/* ── Events Middle Layout: Timeline + Cards + Right Typography ─ */}
        <section className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,760px)_130px] justify-center gap-8 mt-5 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Timeline */}
          <aside className="hidden md:flex relative flex-col pt-1 select-none" aria-label="Event timeline">
            <div className="font-serif text-3xl font-medium text-white tracking-tight mb-4">2026</div>

            <div className="relative flex flex-col gap-10 pl-1">
              <div className="absolute top-2.5 bottom-2.5 right-3 w-[1px] bg-gradient-to-b from-white/50 via-white/15 to-transparent" />
              {timelineEvents.map((ev, idx) => {
                const d = parseEventDate(ev);
                const month = d
                  ? d.toLocaleString("en-US", { month: "short" }).toUpperCase()
                  : "SEP";
                const day = d ? d.getDate() : 11 + idx * 5;
                const isFirst = idx === 0;

                return (
                  <div
                    key={ev._id || idx}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-white/70">{month}</span>
                      <span className={`font-serif text-2xl font-bold leading-none ${isFirst ? "text-white" : "text-white/45"}`}>
                        {day}
                      </span>
                    </div>
                    <div
                      className={`relative z-[2] w-3 h-3 rounded-full ${
                        isFirst
                          ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] border-2 border-[#0b0b10]"
                          : "bg-white/10 border border-white/30"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Scroll indicator cue */}
            <div
              className={`relative flex items-center gap-2.5 mt-auto pb-3 opacity-85 transition-opacity duration-300 ${
                scrolled ? "opacity-0 pointer-events-none" : ""
              }`}
              aria-hidden="true"
            >
              <div className="w-4 h-6 rounded-xl border border-white/40 flex justify-center pt-1">
                <div className="w-0.5 h-1 rounded-sm bg-white animate-[mouseWheel_1.5s_ease-in-out_infinite]" />
              </div>
              <span className="text-[8px] font-bold tracking-widest uppercase leading-tight text-white/65">
                SCROLL<br />FOR MORE
              </span>
            </div>
          </aside>

          {/* Middle Column: Event Cards */}
          <div
            className="flex flex-col gap-4.5 h-full overflow-y-auto overflow-x-hidden pr-2 pb-8 no-scrollbar md:scrollbar-thin"
            role="feed"
            aria-label="Events list"
            aria-busy={loading}
          >
            {loading ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl p-10 text-center text-white/70 text-sm flex flex-col items-center gap-3.5">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Syncing live events...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl p-10 text-center text-white/70 text-sm flex flex-col items-center gap-3.5">
                <p>No {activeTab !== "ALL" ? activeTab : ""} events currently scheduled.</p>
              </div>
            ) : (
              filtered.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  registeredTeam={userRegistrations[event._id] || null}
                  onClick={() => onSelectEvent(event)}
                  onRegisterClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(event);
                  }}
                />
              ))
            )}
          </div>

          {/* Right Column: Decorative Typography */}
          <aside className="hidden lg:flex relative gap-3.5 select-none" aria-hidden="true">
            <div className="w-[1px] h-[75px] bg-white/30 mt-2" />
            <div className="flex flex-col gap-10 pt-1.5">
              {RIGHT_SIDEBAR.map((block, bi) => (
                <div key={bi} className="flex flex-col gap-0.5">
                  {block.map((w) => (
                    <span key={w} className="text-[9px] font-semibold tracking-[0.26em] uppercase text-white/50 leading-relaxed">
                      {w}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

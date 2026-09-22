"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import "./EventsHero.css";
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
        <h3 className="font-jomolhari text-2xl sm:text-3xl font-bold text-white transition-colors leading-snug mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
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

  // ── Scroll detection for scroll cue only (no mouse event needed for branch swing) ─
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
    <div className="events-root relative z-10 pt-20">

      {/* ── Main Interactive Content Container ───────────────────────── */}
      <div className="events-container">
        {/* Header / Hero Title Section */}
        <header className="events-header">
          {/* Subtitle taglines */}
          <div className="events-tagline-wrap">
            <span className="events-tagline-text">IDEAS MEET PEOPLE</span>
            <span className="events-tagline-dot" />
            <span className="events-tagline-text">CHANGE FOLLOWS</span>
          </div>

          <div className="events-tagline-rule">
            <span className="events-tagline-rule-line" />
            <span className="events-tagline-rule-diamond" />
            <span className="events-tagline-rule-line" />
          </div>

          {/* EVENTS Title — Home page platinum gradient language */}
          <h1
            className="font-jomolhari text-6xl sm:text-7xl md:text-8xl font-bold tracking-wider uppercase"
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
          <p className="events-subtitle">Be a part of the journey.</p>

          {/* Category Filter Tabs */}
          <nav className="events-tabs-nav" aria-label="Event category filter">
            <div className="events-tabs-track">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`events-tab-btn ${
                    activeTab === tab ? "events-tab-btn--active" : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                >
                  {tab}
                  {activeTab === tab && <span className="events-tab-dot" />}
                </button>
              ))}
            </div>
            <div className="events-tabs-line" />
          </nav>
        </header>

        {/* ── Events Middle Layout: Timeline + Cards + Right Typography ─ */}
        <section className="events-content-layout">
          {/* Left Column: Timeline */}
          <aside className="events-timeline-rail" aria-label="Event timeline">
            <div className="events-timeline-year">2026</div>

            <div className="events-timeline-axis">
              <div className="events-timeline-line" />
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
                    className={`events-timeline-node ${
                      isFirst ? "events-timeline-node--active" : ""
                    }`}
                  >
                    <div className="events-timeline-date-label">
                      <span className="events-timeline-month">{month}</span>
                      <span className="events-timeline-day">{day}</span>
                    </div>
                    <div
                      className={`events-timeline-marker ${
                        isFirst ? "events-timeline-marker--filled" : "events-timeline-marker--hollow"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Scroll indicator cue */}
            <div
              className={`events-scroll-cue ${
                scrolled ? "events-scroll-cue--hidden" : ""
              }`}
              aria-hidden="true"
            >
              <div className="events-scroll-mouse">
                <div className="events-scroll-wheel" />
              </div>
              <span className="events-scroll-text">SCROLL<br />FOR MORE</span>
            </div>
          </aside>

          {/* Middle Column: Event Cards */}
          <div
            className="events-cards-feed"
            role="feed"
            aria-label="Events list"
            aria-busy={loading}
          >
            {loading ? (
              <div className="events-loading-glass">
                <div className="events-loading-spinner" />
                <span>Syncing live events...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="events-empty-glass">
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
          <aside className="events-side-typography" aria-hidden="true">
            <div className="events-side-divider" />
            <div className="events-side-blocks">
              {RIGHT_SIDEBAR.map((block, bi) => (
                <div key={bi} className="events-side-group">
                  {block.map((w) => (
                    <span key={w} className="events-side-word">
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

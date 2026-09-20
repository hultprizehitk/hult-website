"use client";

import React, { useEffect, useState } from "react";
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
    <span className={`event-card__status event-card__status--${s}`}>
      {isLive && <span className="event-card__status-dot" />}
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
      className="event-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Glossy card highlight sheen */}
      <div className="event-card__glass-sheen" aria-hidden="true" />

      {/* Card Content (Left) */}
      <div className="event-card__body">
        {/* Tags */}
        <div className="event-card__tags">
          <span className="event-card__tag">{tagLabel}</span>
          <StatusBadge status={event.registrationStatus} />
        </div>

        {/* Title */}
        <h3 className="event-card__title">{event.title}</h3>

        {/* Metadata */}
        <div className="event-card__meta">
          <div className="event-card__meta-row">
            <Calendar size={13} className="event-card__meta-icon" />
            <span>{dateLabel}</span>
          </div>
          <div className="event-card__meta-row">
            <MapPin size={13} className="event-card__meta-icon" />
            <span>{event.venue || "cc"}</span>
          </div>
          <div className="event-card__meta-row">
            <Users size={13} className="event-card__meta-icon" />
            <span>Limit: {event.minTeamMembers || 3} to {event.maxTeamMembers || 5} Members</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="event-card__cta" onClick={(e) => e.stopPropagation()}>
          {registeredTeam ? (
            <button
              type="button"
              className={`event-card__btn ${
                isComplete ? "event-card__btn--registered" : "event-card__btn--incomplete"
              }`}
              onClick={onRegisterClick}
            >
              <span>{isComplete ? "Team Registered (Confirmed)" : `Roster Incomplete (${totalJoined}/${minReq})`}</span>
              <ArrowRight size={13} />
            </button>
          ) : event.registrationStatus === "closed" ? (
            <button
              type="button"
              className="event-card__btn event-card__btn--disabled"
              onClick={onRegisterClick}
            >
              <span>Registrations Closed</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              className="event-card__btn event-card__btn--primary"
              onClick={onRegisterClick}
            >
              <span>Register Team</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Card Branch Floral Image (Right) — Sourced strictly from event_mobile_ref.png */}
      <div className="event-card__thumb" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/events-page/parts/card-blossom.png"
          alt=""
          className="event-card__thumb-img"
          loading="lazy"
        />
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
    <div className="events-root">
      {/* ── Fixed Screen Framing Branches (Desktop + Mobile) ───────────
          Swing automatically with gentle natural CSS breeze animation,
          fixed to screen corners, completely independent of mouse.
      ─────────────────────────────────────────────────────────────────── */}
      {/* Fixed top-left branch for desktop */}
      <div
        className="events-fixed-branch events-fixed-branch--left events-fixed-branch--desktop"
        aria-hidden="true"
      >
        <Image
          src="/assets/hult-prize-hero/branches/cherry-branch-left.png"
          alt=""
          fill
          sizes="50vw"
          priority
          style={{ objectFit: "contain", objectPosition: "top left" }}
        />
      </div>

      {/* Fixed top-right branch for desktop */}
      <div
        className="events-fixed-branch events-fixed-branch--right events-fixed-branch--desktop"
        aria-hidden="true"
      >
        <Image
          src="/assets/hult-prize-hero/branches/cherry-branch-right.png"
          alt=""
          fill
          sizes="48vw"
          priority
          style={{ objectFit: "contain", objectPosition: "top right" }}
        />
      </div>

      {/* Bottom Atmosphere Bokeh Layer */}
      <div className="events-bottom-bokeh" aria-hidden="true">
        <Image
          src="/assets/hult-prize-hero/foreground/atmosphere-bokeh.png"
          alt=""
          fill
          sizes="100vw"
          priority
          style={{ objectFit: "cover", objectPosition: "bottom center" }}
        />
      </div>

      {/* ── Base Background Layer (Desktop + Mobile responsive) ────────── */}
      <div className="events-base-bg" aria-hidden="true">
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet="/assets/events-page/parts/event-bak-mobile.png"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/events-page/parts/event-back_desktop.png"
            alt=""
            className="events-base-bg__img"
            fetchPriority="high"
          />
        </picture>
      </div>

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

          {/* EVENTS Title with Home Page Gradient Palette */}
          <h1 className="events-title">
            <span className="events-title-hult">EVENT</span>
            <span className="events-title-prize">S</span>
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

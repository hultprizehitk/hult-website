"use client";

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  animate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight, Lock, Sparkles, Clock, Timer } from "lucide-react";
import type { PublicEvent } from "@/types";
import { useCountdown } from "@/lib/countdown";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type UseMediaQueryOptions = {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
};

const IS_SERVER = typeof window === "undefined";

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query);
    }
    return defaultValue;
  });

  const handleChange = () => {
    setMatches(getMatches(query));
  };

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);
    handleChange();

    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

export interface CarouselEventCardData {
  id: string;
  isDummy?: boolean;
  event?: PublicEvent;
  title?: string;
  tag?: string;
  date?: string;
  venue?: string;
  roster?: string;
  description?: string;
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
    return `${start} – ${end}`;
  }
  return fallback || "TBD";
}

interface Event3DCardProps {
  card: CarouselEventCardData;
  onSelectEvent?: (event: PublicEvent) => void;
  isDraggingRef?: React.RefObject<boolean>;
}

function Event3DCard({ card, onSelectEvent, isDraggingRef }: Event3DCardProps) {
  const countdown = useCountdown(card.event?.registrationDeadline);

  if (card.isDummy || !card.event) {
    // Premium Coming Soon Glass Card
    return (
      <article className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-[#1a1728]/95 via-[#120e1f]/95 to-[#0b0914]/95 backdrop-blur-3xl p-4 sm:p-4.5 flex flex-col justify-between w-full h-[345px] sm:h-[355px] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.2)] select-none group transition-all duration-300">
        {/* Top Iridescent Glow Line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all" />

        {/* Blurred Background Mock Content */}
        <div className="flex flex-col gap-2 filter blur-[6px] opacity-40 pointer-events-none">
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-white/90">
              {card.tag || "CHALLENGE"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-white/70">
              UPCOMING
            </span>
          </div>

          <h3
            className="font-serif text-base sm:text-lg font-bold tracking-tight text-white leading-tight line-clamp-1"
            style={{ fontFamily: "'IM Fell Double Pica', Georgia, serif" }}
          >
            {card.title || "HULT VENTURESPRINT"}
          </h3>

          <p className="text-[10.5px] text-white/80 line-clamp-2 leading-relaxed font-sans font-medium">
            {card.description || "An exclusive incubator sprint challenge for emerging campus social founders."}
          </p>

          <div className="grid grid-cols-1 gap-1 pt-0.5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 flex items-center gap-2 text-[10.5px] text-white/80">
              <Calendar size={12} className="text-amber-300/80 shrink-0" />
              <span className="truncate">{card.date || "Season 2027 · TBA"}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 flex items-center justify-between text-[10.5px] text-white/80">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-amber-300/80 shrink-0" />
                <span className="truncate">{card.venue || "Heritage Auditorium"}</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-[9.5px] shrink-0">
                <Users size={11} className="text-amber-300/80 shrink-0" />
                <span>{card.roster || "2–4 Members"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Coming Soon Glass Overlay Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-black/55 backdrop-blur-md p-4 text-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-b from-white/20 to-white/5 border border-white/30 backdrop-blur-xl flex items-center justify-center text-amber-300 shadow-[0_10px_25px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform">
            <Lock size={16} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 border border-amber-400/50 backdrop-blur-xl text-amber-200 font-mono font-bold text-[10px] uppercase tracking-widest shadow-xl">
              <Sparkles size={11} className="text-amber-300" />
              <span>COMING SOON</span>
            </span>
            <span className="text-[9.5px] font-mono text-white/70 tracking-wider pt-0.5">
              Challenge Details Releasing Soon
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Active Real Event Card
  const event = card.event;
  const dateLabel = formatDateRange(event.startDate, event.endDate, event.date);
  const minReq = event.minTeamMembers || 2;
  const maxReq = event.maxTeamMembers || 4;
  const customTag = event.tag && event.tag.trim().toLowerCase() !== "flagship" ? event.tag : null;

  const isClosed = event.registrationStatus === "closed" || countdown.isExpired;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef?.current) return;
    if (event) onSelectEvent?.(event);
  };

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-[#1c182a]/95 via-[#130f21]/95 to-[#0b0914]/95 backdrop-blur-3xl p-4.5 sm:p-5 flex flex-col justify-between w-full h-[390px] sm:h-[400px] shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.2)] select-none group hover:border-rose-400/50 transition-all cursor-pointer"
      onClick={handleAction}
    >
      {/* Top Iridescent Glow Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-all" />

      <div className="flex flex-col gap-2">
        {/* Status Badges Row */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {customTag ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.08] border border-white/20 text-white/90 backdrop-blur-md">
              {customTag}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
              <Sparkles size={11} className="text-rose-300/70" />
              <span>OnCampus Series</span>
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md transition-all ${
              isClosed
                ? "bg-rose-500/[0.1] border border-rose-500/25 text-rose-300"
                : event.registrationStatus === "extended"
                ? "bg-amber-500/[0.1] border border-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                : "bg-emerald-500/[0.1] border border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            }`}
          >
            {isClosed ? (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80 shrink-0" />
            ) : (
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </span>
            )}
            <span>
              {isClosed
                ? "Closed"
                : event.registrationStatus === "extended"
                ? "Extended"
                : "Registrations Open"}
            </span>
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-serif text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] line-clamp-2"
          style={{ fontFamily: "'IM Fell Double Pica', Georgia, serif" }}
        >
          {event.title}
        </h3>

        {/* Description - 2 lines for clean balanced spacing */}
        {event.description && (
          <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed font-sans font-medium">
            {event.description}
          </p>
        )}

        {/* Meta Tiles Grid */}
        <div className="grid grid-cols-1 gap-1.5 pt-0.5">
          {/* Tile 1: Event Schedule */}
          <div className="bg-white/[0.05] border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[11px] text-white font-medium backdrop-blur-md">
            <Calendar size={12} className="text-rose-300 shrink-0" />
            <span className="truncate">{dateLabel}</span>
          </div>

          {/* Tile 2: Venue & Roster */}
          <div className="bg-white/[0.05] border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] text-white font-medium backdrop-blur-md">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={12} className="text-rose-300 shrink-0" />
              <span className="truncate">{event.venue || "SV Auditorium"}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 text-white/70 text-[10px] font-mono">
              <Users size={11} className="text-rose-300 shrink-0" />
              <span>{minReq}–{maxReq} Members</span>
            </span>
          </div>

          {/* Tile 3: Registration Deadline & Reverse Countdown Timer */}
          <div
            className={`rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] font-medium backdrop-blur-md transition-all ${
              isClosed
                ? "bg-white/[0.03] border border-white/10 text-white/60"
                : "bg-rose-500/[0.08] border border-rose-500/25 text-white shadow-[0_0_15px_rgba(242,0,137,0.1)]"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <Clock size={12} className={isClosed ? "text-white/40 shrink-0" : "text-rose-400 shrink-0"} />
              <div className="flex flex-col truncate">
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-mono leading-none">
                  Deadline
                </span>
                <span className="text-[11px] font-semibold text-white/90 truncate leading-tight pt-0.5">
                  {countdown.formattedDeadline}
                </span>
              </div>
            </div>

            <div className="shrink-0 pl-1.5">
              {isClosed ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  Closed
                </span>
              ) : countdown.hasDeadline ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-rose-500/20 border border-rose-400/40 text-rose-200 shadow-sm">
                  <Timer size={10} className="text-rose-300 shrink-0 animate-pulse" />
                  <span className="tabular-nums">{countdown.countdownText}</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button Row */}
      <div className="pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handleAction}
          className="w-full flex items-center justify-between rounded-full bg-white hover:bg-neutral-100 px-4 py-2.5 text-[11px] font-bold text-neutral-950 uppercase tracking-wider shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.45)] transition-all hover:scale-[1.02] cursor-pointer"
        >
          <span>VIEW EVENT &amp; REGISTER</span>
          <ArrowRight size={13} className="text-neutral-950" />
        </button>
      </div>
    </article>
  );
}

const Carousel3D = memo(
  ({
    cards,
    isCarouselActive,
    onSelectEvent,
  }: {
    cards: CarouselEventCardData[];
    isCarouselActive: boolean;
    onSelectEvent?: (event: PublicEvent) => void;
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)");
    // Flatten cylinder curve for full-screen span ("bhara bhara")
    const cylinderWidth = isScreenSizeSm ? 1800 : 3100;
    const faceCount = cards.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);
    const rotation = useMotionValue(0);
    const startRotation = useRef(0);
    const isDraggingRef = useRef(false);

    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    );

    return (
      <div
        className="flex min-h-[480px] sm:min-h-[500px] items-center justify-center bg-transparent py-1 select-none"
        style={{
          perspective: "2400px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDragStart={() => {
            startRotation.current = rotation.get();
            isDraggingRef.current = false;
          }}
          onDrag={(_, info) => {
            if (!isCarouselActive) return;
            if (Math.abs(info.offset.x) > 4 || Math.abs(info.offset.y) > 4) {
              isDraggingRef.current = true;
            }
            rotation.set(startRotation.current + info.offset.x * 0.12);
          }}
          onDragEnd={(_, info) => {
            if (!isCarouselActive) return;
            const velocityRot = info.velocity.x * 0.08;
            const targetRot = rotation.get() + velocityRot;
            const angleStep = 360 / faceCount;
            const snappedRot = Math.round(targetRot / angleStep) * angleStep;

            animate(rotation, snappedRot, {
              type: "spring",
              stiffness: 80,
              damping: 20,
              mass: 0.2,
            });

            if (Math.abs(info.offset.x) > 4 || Math.abs(info.offset.y) > 4) {
              isDraggingRef.current = true;
              setTimeout(() => {
                isDraggingRef.current = false;
              }, 120);
            } else {
              isDraggingRef.current = false;
            }
          }}
        >
          {cards.map((card, i) => (
            <motion.div
              key={`key-${card.id}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center p-2"
              style={{
                width: `${Math.min(350, faceWidth)}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
            >
              <Event3DCard card={card} onSelectEvent={onSelectEvent} isDraggingRef={isDraggingRef} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }
);

interface ThreeDPhotoCarouselProps {
  events: PublicEvent[];
  onSelectEvent?: (event: PublicEvent) => void;
}

export function ThreeDPhotoCarousel({
  events,
  onSelectEvent,
}: ThreeDPhotoCarouselProps) {
  const [isCarouselActive] = useState(true);

  // Generate total 8 cards for smooth 3D cylinder rotation
  const cards: CarouselEventCardData[] = useMemo(() => {
    const list: CarouselEventCardData[] = [];

    // Real events
    events.forEach((ev, idx) => {
      list.push({
        id: ev._id || `event-${idx}`,
        isDummy: false,
        event: ev,
      });
    });

    // Upcoming / Coming Soon placeholder cards to complete the 3D cylinder ring (8 cards total)
    const dummyCardsData = [
      {
        title: "HULT IMPACT SPRINT",
        tag: "IDEATHON",
        date: "Season 2027 · Q1",
        venue: "Heritage Incubation Lab",
        roster: "2–4 Members",
        description: "Fast-track design sprint to turn early SDG ideas into pitch-ready decks.",
      },
      {
        title: "GLOBAL PITCH FINALS",
        tag: "GLOBAL SUMMIT",
        date: "Season 2027 · Q2",
        venue: "International Summit Stage",
        roster: "3–4 Members",
        description: "Regional winners compete for the US$1,000,000 global seed capital award.",
      },
      {
        title: "FOUNDER CLINIC & MENTORSHIP",
        tag: "WORKSHOP",
        date: "Season 2027 · Q3",
        venue: "SV Auditorium",
        roster: "Individual / Roster",
        description: "1-on-1 financial modeling & pitch deck reviews with industry operators.",
      },
      {
        title: "VENTURE ACCELERATOR",
        tag: "BOOTCAMP",
        date: "Season 2027 · Q4",
        venue: "Heritage Innovation Hub",
        roster: "Full Team",
        description: "Intensive 4-week bootcamp for prototype deployment & market validation.",
      },
      {
        title: "SDG SOCIAL INNOVATION CHALLENGE",
        tag: "SPECIAL EDITION",
        date: "Season 2027 · Q4",
        venue: "Heritage Campus",
        roster: "2–5 Members",
        description: "Targeted challenge tackling clean energy & circular economy solutions.",
      },
      {
        title: "GREEN VENTURE HACKATHON",
        tag: "HACKATHON",
        date: "Season 2027 · Q1",
        venue: "Heritage Tech Hub",
        roster: "2–4 Members",
        description: "48-hour build sprint building tech solutions for sustainable development.",
      },
      {
        title: "CAMPUS LEADERSHIP SUMMIT",
        tag: "CONFERENCE",
        date: "Season 2027 · Q2",
        venue: "Heritage Main Stage",
        roster: "All Delegates",
        description: "Keynotes and networking sessions with world-class impact founders.",
      },
    ];

    let dummyIdx = 0;
    while (list.length < 8) {
      const d = dummyCardsData[dummyIdx % dummyCardsData.length];
      list.push({
        id: `dummy-${list.length}`,
        isDummy: true,
        ...d,
      });
      dummyIdx++;
    }

    return list;
  }, [events]);

  return (
    <div className="relative min-h-[480px] sm:min-h-[500px] w-full overflow-visible my-1">
      <Carousel3D
        cards={cards}
        isCarouselActive={isCarouselActive}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}

"use client";

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  animate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight, Lock, Sparkles, Timer } from "lucide-react";
import type { PublicEvent } from "@/types";
import Image from "next/image";
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

function useViewportWidth(fallback = 1024): number {
  const [width, setWidth] = useState<number>(() => (IS_SERVER ? fallback : window.innerWidth));

  useIsomorphicLayoutEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
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

// Splits the schedule into a day label and a time range so each fits its own slot.
function formatSchedule(start?: string, end?: string, fallback?: string): { day: string; time?: string } {
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const dayOpts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
      const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
      const isSameDay =
        s.getFullYear() === e.getFullYear() &&
        s.getMonth() === e.getMonth() &&
        s.getDate() === e.getDate();
      if (isSameDay) {
        return {
          day: s.toLocaleDateString("en-US", dayOpts),
          time: `${s.toLocaleTimeString("en-US", timeOpts)} – ${e.toLocaleTimeString("en-US", timeOpts)}`,
        };
      }
      const shortOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      return { day: `${s.toLocaleDateString("en-US", shortOpts)} – ${e.toLocaleDateString("en-US", shortOpts)}` };
    }
    return { day: `${start} – ${end}` };
  }
  return { day: fallback || "TBD" };
}

const CARD_HEIGHT = "h-[396px]";
// Hardcoded poster for HULT ASCEND; an admin-set posterUrl still takes priority.
const HULT_ASCEND_POSTER = "/events/hult-ascend.png";

interface Event3DCardProps {
  card: CarouselEventCardData;
  onSelectEvent?: (event: PublicEvent) => void;
  isDraggingRef?: React.RefObject<boolean>;
}

function Event3DCard({ card, onSelectEvent, isDraggingRef }: Event3DCardProps) {
  const [liveEvent, setLiveEvent] = useState(card.event);

  useEffect(() => {
    setLiveEvent(card.event);
  }, [card.event]);

  useEffect(() => {
    if (!card.event?._id || typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("event_onspot_sync");
      channel.onmessage = (e) => {
        if (e.data?.eventId === card.event?._id) {
          setLiveEvent((prev) =>
            prev
              ? {
                  ...prev,
                  onSpotRegistrationEnabled: e.data.onSpotRegistrationEnabled,
                  ...(e.data.registrationStatus ? { registrationStatus: e.data.registrationStatus } : {}),
                }
              : prev
          );
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "event_onspot_sync" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.eventId === card.event?._id) {
            setLiveEvent((prev) =>
              prev
                ? {
                    ...prev,
                    onSpotRegistrationEnabled: parsed.onSpotRegistrationEnabled,
                    ...(parsed.registrationStatus ? { registrationStatus: parsed.registrationStatus } : {}),
                  }
                : prev
            );
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [card.event?._id]);

  const countdown = useCountdown(liveEvent?.registrationDeadline);

  if (card.isDummy || !liveEvent) {
    // Premium Coming Soon Glass Card
    return (
      <article className={`relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#16161d] via-[#121217] to-[#0e0e12] p-4 sm:p-4.5 flex flex-col justify-between w-full ${CARD_HEIGHT} shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] select-none group transition-all duration-300`}>
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
  const event = liveEvent;
  const schedule = formatSchedule(event.startDate, event.endDate, event.date);
  const minReq = event.minTeamMembers || 2;
  const maxReq = event.maxTeamMembers || 4;
  const customTag = event.tag && event.tag.trim().toLowerCase() !== "flagship" ? event.tag : null;
  const posterUrl = event.posterUrl || (/hult\s*ascend/i.test(event.title) ? HULT_ASCEND_POSTER : "");

  const isOnSpotLive = Boolean(event.onSpotRegistrationEnabled);
  const isTimeOver = countdown.hasDeadline && countdown.isExpired;
  const isRegistrationClosed = !isOnSpotLive && (event.registrationStatus === "closed" || isTimeOver);
  const isClosed = isRegistrationClosed;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef?.current) return;
    if (event) onSelectEvent?.(event);
  };

  const status = isOnSpotLive
    ? { label: "On-spot live", tone: "text-amber-200", dot: "bg-amber-400", pulse: true }
    : isClosed
    ? { label: "Registration closed", tone: "text-zinc-300", dot: "", pulse: false }
    : event.registrationStatus === "extended"
    ? { label: "Deadline extended", tone: "text-amber-200", dot: "bg-amber-400", pulse: false }
    : { label: "Registration open", tone: "text-emerald-200", dot: "bg-emerald-400", pulse: false };

  const hasCountdown = !isClosed && countdown.hasDeadline;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c10] p-5 flex flex-col w-full ${
        posterUrl ? CARD_HEIGHT : ""
      } shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] select-none group hover:border-white/20 transition-colors duration-300 cursor-pointer`}
      onClick={handleAction}
    >
      {/* Poster artwork, anchored to its top edge so the title art is never clipped */}
      {posterUrl && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5]">
          <Image
            src={posterUrl}
            alt={`${event.title} poster`}
            fill
            sizes="350px"
            draggable={false}
            className="object-cover object-top origin-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,12,16,0)_0%,rgba(12,12,16,0)_32%,rgba(12,12,16,0.7)_52%,rgba(12,12,16,0.96)_66%,#0c0c10_80%)]" />
        </div>
      )}

      {/* Content */}
      <div className={`relative flex flex-col ${posterUrl ? "mt-auto" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          {customTag && (
            <span className="inline-flex min-w-0 items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-400">
              <span className="h-3 w-0.5 shrink-0 rounded-full bg-[#f20089]" />
              <span className="truncate">{customTag}</span>
            </span>
          )}
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-[#0c0c10]/80 px-2 py-1 text-[10.5px] font-medium leading-none backdrop-blur-md ${status.tone}`}
          >
            {isClosed ? (
              <Lock size={10} className="shrink-0 text-zinc-500" />
            ) : (
              <span className="relative flex h-1.5 w-1.5">
                {status.pulse && (
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${status.dot}`} />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${status.dot}`} />
              </span>
            )}
            {status.label}
          </span>
        </div>

        <h3
          className="mt-2.5 font-serif text-[19px] font-bold leading-[1.2] tracking-tight text-zinc-50 line-clamp-2"
          style={{ fontFamily: "'IM Fell Double Pica', Georgia, serif" }}
        >
          {event.title}
        </h3>

        {/* The poster already carries the pitch, so the blurb only shows on plain cards */}
        {!posterUrl && event.description && (
          <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-400 line-clamp-2">{event.description}</p>
        )}

        {/* When / Where */}
        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 border-t border-white/[0.08] pt-3">
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              <Calendar size={10} className="shrink-0" />
              When
            </dt>
            <dd className="mt-1 truncate text-[12px] font-medium text-zinc-100">{schedule.day}</dd>
            {schedule.time && <dd className="mt-0.5 text-[10.5px] leading-snug text-zinc-400">{schedule.time}</dd>}
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              <MapPin size={10} className="shrink-0" />
              Where
            </dt>
            <dd className="mt-1 text-[12px] font-medium leading-snug text-zinc-100 line-clamp-2">{event.venue || "Venue TBA"}</dd>
            <dd className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[10.5px] text-zinc-400">
              <Users size={10} className="shrink-0" />
              {minReq}–{maxReq} per team
            </dd>
          </div>
        </dl>

        {hasCountdown && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              <Timer size={10} className="shrink-0" />
              Closes in
            </span>
            <span className="font-mono text-[10.5px] font-semibold tabular-nums text-zinc-200">
              {countdown.countdownText}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleAction}
          className="mt-4 flex w-full items-center justify-between rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-950 transition-colors hover:bg-zinc-200 cursor-pointer"
        >
          <span>{isClosed ? "View Details" : "View & Register"}</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
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
    const viewportWidth = useViewportWidth();
    const faceCount = cards.length;
    // Phones: each face is ~74% of the viewport (+16px face padding), capped so the
    // perspective-enlarged front card still fits the stage. Desktop keeps the wide ring.
    const faceWidth =
      viewportWidth <= 640
        ? Math.min(300, Math.round(viewportWidth * 0.74) + 16)
        : 3100 / faceCount;
    const cylinderWidth = faceWidth * faceCount;
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
        className="flex min-h-[500px] items-center justify-center bg-transparent py-1 select-none"
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
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
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
    <div className="relative min-h-[500px] w-full overflow-visible my-1">
      <Carousel3D
        cards={cards}
        isCarouselActive={isCarouselActive}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}

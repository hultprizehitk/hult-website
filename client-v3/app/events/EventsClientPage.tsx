"use client";

import React, { useState, useEffect } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import EventsHero from "@/components/events/EventsHero";
import EventInsideView from "@/components/events/EventInsideView";
import EventHeroBackground from "@/components/events/EventHeroBackground";
import type { PublicEvent } from "@/types";

interface EventsClientPageProps {
  initialEventId?: string | null;
}

export default function EventsClientPage({ initialEventId }: EventsClientPageProps) {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);

  // ── Sync selected event with ?event= URL param ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("event");
    if (id) {
      setSelectedEventId(id);
    } else if (initialEventId) {
      setSelectedEventId(initialEventId);
    }

    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      setSelectedEventId(p.get("event"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initialEventId]);

  // ── Fetch dynamic events from MongoDB via API ───────────────────────────
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
        console.error("Failed to load events:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const handleSelectEvent = (event: PublicEvent) => {
    setSelectedEventId(event._id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("event", event._id);
      window.history.pushState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToEvents = () => {
    setSelectedEventId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("event");
      window.history.pushState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Inside view (event detail presentation) ──────────────────────────────
  if (selectedEventId) {
    const currentEvent = events.find((e) => e._id === selectedEventId);

    if (loading) {
      return (
        <div className="relative min-h-screen w-full bg-[#0a0c14] overflow-x-hidden text-white flex flex-col">
          <EventHeroBackground />
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f20089]" />
          </div>
        </div>
      );
    }

    if (!currentEvent) {
      return (
        <div className="relative min-h-screen w-full bg-[#0a0c14] overflow-x-hidden text-white flex flex-col">
          <EventHeroBackground />
          <SiteHeader />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/70 relative z-10 px-4">
            <span className="text-xs font-mono tracking-widest uppercase opacity-60">Event not found</span>
            <button
              type="button"
              onClick={handleBackToEvents}
              className="rounded-full bg-white hover:bg-neutral-100 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-lg shadow-black/40 transition-all cursor-pointer hover:scale-105"
            >
              Back to Events
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative min-h-screen w-full bg-[#0a0c14] overflow-x-hidden text-white flex flex-col">
        {/* Full-bleed background */}
        <EventHeroBackground />

        {/* Unified fixed site header */}
        <SiteHeader />

        {/* Main detail content */}
        <main className="relative z-10 w-full max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
          <EventInsideView
            event={currentEvent}
            onBack={handleBackToEvents}
          />
        </main>
      </div>
    );
  }

  // ── Main events listing ──────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full bg-[#0a0c14] text-white flex flex-col justify-between overflow-x-hidden">
      {/* Full-bleed background */}
      <EventHeroBackground />

      {/* Unified fixed site header */}
      <SiteHeader />

      {/* Hero scene + event cards */}
      <main className="flex-1 w-full relative z-10 flex flex-col justify-center py-0">
        <EventsHero
          events={events}
          loading={loading}
          onSelectEvent={handleSelectEvent}
        />
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import SiteHeader from "@/components/SiteHeader";
import EventsHero from "@/components/events/EventsHero";
import EventInsideView from "./components/EventInsideView";
import GrainOverlay from "@/components/hero/GrainOverlay";
import KolkataHero from "@/components/hero/KolkataHero";
import "@/components/events/EventsHero.css";

// ── Public event shape (shared with EventInsideView) ──────────────────────
export interface PublicEvent {
  _id: string;
  title: string;
  tag: string;
  date: string;
  startDate?: string;
  endDate?: string;
  venue: string;
  description: string;
  link?: string;
  registrationStatus?: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  registeredTeamsCount?: number;
  maxTeams?: number;
  minTeamMembers?: number;
  maxTeamMembers?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { data: session, status } = useSession();

  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, any>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // ── Sync selected event with ?event= URL param ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("event");
    if (id) setSelectedEventId(id);

    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      setSelectedEventId(p.get("event"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Fetch events ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch user registrations ─────────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    fetch("/api/events/register")
      .then((res) => (res.ok ? res.json() : { registrations: [] }))
      .then((data) => {
        const map: Record<string, any> = {};
        (data.registrations || []).forEach((reg: any) => {
          if (reg.eventId) map[reg.eventId] = reg.team;
        });
        setUserRegistrations(map);
      })
      .catch((err) => console.error("Error loading registrations:", err));
  }, [status, session]);

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

  // ── Inside view (event detail / registration) ────────────────────────────
  if (selectedEventId) {
    const currentEvent = events.find((e) => e._id === selectedEventId);

    if (loading) {
      return (
        <div className="min-h-screen bg-[#fcecef] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-200 border-t-[#e60067]" />
        </div>
      );
    }

    if (!currentEvent) {
      return (
        <div className="min-h-screen bg-[#fcecef] flex flex-col items-center justify-center gap-4 text-[#5a3040]">
          <span className="text-xs font-mono tracking-widest uppercase opacity-60">Event not found</span>
          <button
            type="button"
            onClick={handleBackToEvents}
            className="rounded-full bg-gradient-to-r from-[#e60067] to-[#ff007f] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#e60067]/30 transition-all cursor-pointer hover:scale-105"
          >
            Back to Events
          </button>
        </div>
      );
    }

    return (
      <div className="relative min-h-screen w-full bg-black overflow-x-hidden text-white">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <KolkataHero mouseOffset={{ x: 0, y: 0 }} isRevealed={true} hideText={true} hideForeground={true} />
        </div>
        <GrainOverlay opacity={0.65} />

        {/* Transparent light site header */}
        <SiteHeader transparent theme="light" />

        {/* Main detail content */}
        <main className="relative z-10 w-full px-4 sm:px-6 pt-24 pb-16">
          <EventInsideView
            event={currentEvent}
            sessionUser={session?.user || null}
            registeredTeam={userRegistrations[currentEvent._id] || null}
            onBack={handleBackToEvents}
            onRegisterSuccess={(teamData) => {
              setUserRegistrations((prev) => ({
                ...prev,
                [currentEvent._id]: teamData,
              }));
            }}
          />
        </main>
      </div>
    );
  }

  // ── Main events listing ──────────────────────────────────────────────────
  return (
    <div
      className="relative h-screen max-h-screen w-full overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <KolkataHero mouseOffset={{ x: 0, y: 0 }} isRevealed={true} hideText={true} hideForeground={true} />
      </div>
      <GrainOverlay opacity={0.65} />

      {/* Transparent site header — z-50 */}
      <SiteHeader transparent theme="light" />

      {/* Hero scene + event cards */}
      <main className="h-full w-full overflow-hidden relative z-10">
        <EventsHero
          events={events}
          loading={loading}
          userRegistrations={userRegistrations}
          onSelectEvent={handleSelectEvent}
        />
      </main>
    </div>
  );
}

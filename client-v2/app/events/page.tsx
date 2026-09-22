"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import EventsHero from "@/components/events/EventsHero";
import EventInsideView from "@/components/events/EventInsideView";
import { INITIAL_EVENTS, type PublicEvent } from "@/data/events";
export type { PublicEvent };

const STORAGE_KEY = "hult_user_event_registrations_v2";

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [events] = useState<PublicEvent[]>(INITIAL_EVENTS);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, any>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<{
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null>(null);

  // Sync selected event with URL search param ?event=
  useEffect(() => {
    const eventParam = searchParams.get("event");
    setSelectedEventId(eventParam);
  }, [searchParams]);

  // Load student profile and registrations from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("hult_student_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setSessionUser({
          name: parsed.name,
          email: parsed.email,
          image: parsed.image || null,
        });
      }
    } catch {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUserRegistrations(JSON.parse(saved));
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  const handleSelectEvent = (event: PublicEvent) => {
    setSelectedEventId(event._id);
    router.push(`/events?event=${event._id}`, { scroll: true });
  };

  const handleBackToEvents = () => {
    setSelectedEventId(null);
    router.push("/events", { scroll: true });
  };

  const handleRegisterSuccess = (eventId: string, teamData: any) => {
    setUserRegistrations((prev) => {
      const updated = {
        ...prev,
        [eventId]: teamData,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore local storage error
      }
      return updated;
    });
  };

  // Detailed Inside View for Selected Event
  if (selectedEventId) {
    const currentEvent = events.find((e) => e._id === selectedEventId);

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
      <div className="relative min-h-screen w-full bg-[#fcecef] overflow-x-hidden text-[#2b161f]">
        {/* Fixed screen branches */}
        <div className="events-fixed-branch events-fixed-branch--left events-fixed-branch--desktop" aria-hidden="true">
          <Image
            src="/assets/hult-prize-hero/branches/cherry-branch-left.png"
            alt=""
            fill
            sizes="44vw"
            priority
            style={{ objectFit: "contain", objectPosition: "top left" }}
          />
        </div>
        <div className="events-fixed-branch events-fixed-branch--right events-fixed-branch--desktop" aria-hidden="true">
          <Image
            src="/assets/hult-prize-hero/branches/cherry-branch-right.png"
            alt=""
            fill
            sizes="42vw"
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

        {/* Base Background picture */}
        <div className="events-base-bg" aria-hidden="true">
          <picture>
            <source media="(max-width: 768px)" srcSet="/assets/events-page/parts/event-bak-mobile.png" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/events-page/parts/event-back_desktop.png"
              alt=""
              className="events-base-bg__img"
              fetchPriority="high"
            />
          </picture>
        </div>

        {/* Transparent light site header */}
        <SiteHeader transparent theme="light" />

        {/* Main detail content */}
        <main className="relative z-10 w-full px-4 sm:px-6 pt-24 pb-16">
          <EventInsideView
            event={currentEvent}
            sessionUser={sessionUser}
            registeredTeam={userRegistrations[currentEvent._id] || null}
            onBack={handleBackToEvents}
            onRegisterSuccess={(teamData) => handleRegisterSuccess(currentEvent._id, teamData)}
          />
        </main>
      </div>
    );
  }

  // Events Showcase Catalog View
  return (
    <div
      className="relative h-screen max-h-screen w-full overflow-hidden"
      style={{ background: "#fdf0f4" }}
    >
      <SiteHeader transparent theme="light" />
      <main className="h-full w-full overflow-hidden">
        <EventsHero
          events={events}
          loading={false}
          userRegistrations={userRegistrations}
          onSelectEvent={handleSelectEvent}
        />
      </main>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcecef] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-200 border-t-[#e60067]" />
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}

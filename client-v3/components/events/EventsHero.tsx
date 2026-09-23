"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { PublicEvent } from "@/types";
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel";

interface EventsHeroProps {
  events: PublicEvent[];
  loading: boolean;
  onSelectEvent: (event: PublicEvent) => void;
}

export default function EventsHero({
  events,
  loading,
  onSelectEvent,
}: EventsHeroProps) {
  return (
    <div className="relative w-full min-h-full flex flex-col justify-between overflow-x-hidden bg-transparent font-sans text-white z-10 pt-10 sm:pt-12 pb-2">
      {/* ── Main Interactive Content Container ───────────────────────── */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col flex-1 min-h-0 justify-center">
        {/* Header / Hero Title Section */}
        <header className="flex flex-col items-center text-center py-1 shrink-0">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider uppercase text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            EVENTS
          </h1>
        </header>

        {/* ── 3D Rotating Cylinder Carousel Showcase ───────────────────── */}
        <section className="relative w-full mt-2 flex items-center justify-center" aria-label="3D Event Carousel Showcase">
          {loading ? (
            <div className="flex gap-6 justify-center w-full py-16">
              <div className="w-[340px] sm:w-[380px] h-[440px] rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-7 flex flex-col justify-between animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 w-24 rounded-full bg-white/10" />
                  <div className="h-8 w-3/4 rounded-xl bg-white/15" />
                  <div className="h-4 w-full rounded-md bg-white/10" />
                </div>
                <div className="h-11 rounded-full bg-white/10" />
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-10 text-center text-white/70 text-sm flex flex-col items-center gap-3.5 max-w-md mx-auto shadow-2xl my-12">
              <Sparkles size={20} className="text-white/40" />
              <p>No events currently scheduled.</p>
            </div>
          ) : (
            <ThreeDPhotoCarousel events={events} onSelectEvent={onSelectEvent} />
          )}
        </section>
      </div>
    </div>
  );
}

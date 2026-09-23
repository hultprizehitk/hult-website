"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, ExternalLink, Share2, Check, Sparkles } from "lucide-react";
import type { PublicEvent } from "@/types";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";

interface EventInsideViewProps {
  event: PublicEvent;
  onBack: () => void;
}

export default function EventInsideView({
  event,
  onBack,
}: EventInsideViewProps) {
  const [copied, setCopied] = useState(false);

  const minMembers = event.minTeamMembers || 3;
  const maxMembers = event.maxTeamMembers || 5;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="relative w-full max-w-7xl xl:max-w-[1400px] mx-auto flex flex-col gap-6 text-white font-sans animate-fadeIn">
      {/* Top Back Navigation Breadcrumb */}
      <nav className="flex items-center justify-between gap-4 flex-wrap" aria-label="Event navigation">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-5 py-2.5 text-xs font-semibold tracking-wider text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg cursor-pointer"
        >
          <ArrowLeft size={14} className="text-white" />
          <span className="uppercase">Back to Events</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-widest">
          <Link href="/events" onClick={onBack} className="hover:text-white transition-colors">
            Events
          </Link>
          <span>/</span>
          <span className="text-white font-bold max-w-[200px] truncate">
            {event.title}
          </span>
        </div>
      </nav>

      {/* Main Split Grid: Left = Event Info & Guidelines, Right = Team Registration Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Side: Event Details & Eligibility Guidelines */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Hero Event Card */}
          <article className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

            <div className="relative z-[2] flex flex-col gap-6">
              {/* Status Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/30 text-white/90">
                  {event.tag || "FLAGSHIP"}
                </span>

                {event.registrationStatus === "closed" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950/40 border border-rose-400/50 text-rose-300">
                    Registrations Closed
                  </span>
                ) : event.registrationStatus === "extended" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-950/40 border border-amber-400/50 text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Extended Deadline
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/40 border border-emerald-400/50 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Registrations Open
                  </span>
                )}

                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white/75">
                  Team Size: {minMembers} to {maxMembers} Members
                </span>
              </div>

              {/* Event Title */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]">
                {event.title}
              </h1>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                    <Calendar size={13} className="text-rose-300/90 shrink-0" />
                    <span>Schedule & Time</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {event.date || "TBD"}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                    <MapPin size={13} className="text-rose-300/90 shrink-0" />
                    <span>Venue Location</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {event.venue || "Heritage Campus"}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1 shadow-md sm:col-span-2 md:col-span-1">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                    <Users size={13} className="text-rose-300/90 shrink-0" />
                    <span>Team Size Guidelines</span>
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {minMembers} to {maxMembers} Students / Team
                  </span>
                </div>
              </div>

              {/* About Event Description */}
              {event.description && (
                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">
                    About This Event
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-white/80 whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </article>

          {/* Participation & Registration Showcase Card */}
          <section className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden" aria-label="Participation Studio">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

            <div className="relative z-[2] flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#f20089] mb-1">
                    <Sparkles size={12} />
                    <span>Competition Participation</span>
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-google-sans)]">
                    Registration &amp; Eligibility
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-300">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={13} />
                      <span>Share Event</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-2.5">
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider font-mono">
                  Student Guidelines
                </h3>
                <ul className="text-xs text-white/70 space-y-2 list-disc list-inside">
                  <li>Open to all enrolled undergraduate and postgraduate students of Heritage Institute of Technology.</li>
                  <li>Teams must be formed with between <strong className="text-white">{minMembers} and {maxMembers}</strong> members.</li>
                  <li>Cross-departmental and cross-year teams are actively encouraged.</li>
                  {event.registrationDeadline && (
                    <li>
                      Registration Deadline: <strong className="text-rose-300">{event.registrationDeadline}</strong>
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Row */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-lg"
                >
                  ← Back to All Events
                </button>

                <div className="flex items-center gap-3 flex-wrap">
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>External Form</span>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  {event.registrationStatus === "closed" && (
                    <span className="rounded-full bg-zinc-800/80 border border-white/10 px-5 py-2 text-xs font-bold text-zinc-500 inline-flex items-center gap-1.5 font-mono">
                      Registrations Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Team Registration & Roster Workspace */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <EventRegistrationModal
            event={event}
            isInline={true}
          />
        </div>
      </div>
    </div>
  );
}

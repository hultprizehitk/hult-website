"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Share2, Check, CalendarDays, MapPin, Users, Clock } from "lucide-react";
import type { PublicEvent } from "@/types";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { detailLabelClass } from "@/components/ui/styles";
import { useCountdown } from "@/lib/countdown";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";

// Controls that sit directly on the hero photo need their own dark backing for contrast
const floatingControlClass =
  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-3.5 text-sm text-white/85 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white";

interface EventInsideViewProps {
  event: PublicEvent;
  onBack: () => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
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
            year: "numeric",
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
    const s = formatDate(start);
    const e = formatDate(end);
    return `${s} – ${e}`;
  }
  return fallback ? formatDate(fallback) : "TBD";
}

export default function EventInsideView({
  event: initialEvent,
  onBack,
}: EventInsideViewProps) {
  const [event, setEvent] = useState(initialEvent);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  // Real-time synchronization when Master Admin toggles On-Spot or closes registration
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("event_onspot_sync");
      channel.onmessage = (e) => {
        if (e.data?.eventId === event._id) {
          setEvent((prev) => ({
            ...prev,
            onSpotRegistrationEnabled: e.data.onSpotRegistrationEnabled,
            ...(e.data.registrationStatus ? { registrationStatus: e.data.registrationStatus } : {}),
          }));
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "event_onspot_sync" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.eventId === event._id) {
            setEvent((prev) => ({
              ...prev,
              onSpotRegistrationEnabled: parsed.onSpotRegistrationEnabled,
              ...(parsed.registrationStatus ? { registrationStatus: parsed.registrationStatus } : {}),
            }));
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [event._id]);

  const minMembers = event.minTeamMembers || 2;
  const maxMembers = event.maxTeamMembers || 4;
  const countdown = useCountdown(event.registrationDeadline);
  const isOnSpotLive = Boolean(event.onSpotRegistrationEnabled);
  const isTimeOver = countdown.hasDeadline && countdown.isExpired;
  const isRegistrationClosed = !isOnSpotLive && (event.registrationStatus === "closed" || isTimeOver);
  const isClosed = isRegistrationClosed;

  const hasRounds = Array.isArray(event.rounds) && event.rounds.length > 0;
  const hasRules = Array.isArray(event.rules) && event.rules.length > 0;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="relative w-full max-w-7xl xl:max-w-[1400px] mx-auto flex flex-col gap-6 text-white font-sans animate-fadeIn">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between gap-3" aria-label="Event navigation">
        <button type="button" onClick={onBack} className={floatingControlClass}>
          <ArrowLeft size={15} />
          All events
        </button>
        <button type="button" onClick={handleShare} className={floatingControlClass}>
          {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
          {copied ? "Link copied" : "Share"}
        </button>
      </nav>

      {/* 2x2 Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
        {/* Cell [1,1]: Hero Event Card */}
        <article className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

          <div className="relative z-[2] flex flex-col gap-6">
            {/* Status Line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {event.tag && event.tag.trim().toLowerCase() !== "flagship" && (
                <span className="text-sm text-white/50">{event.tag}</span>
              )}
              {isOnSpotLive ? (
                <StatusBadge tone="warning">On-spot registration live</StatusBadge>
              ) : isRegistrationClosed ? (
                <StatusBadge tone="danger">Registration closed</StatusBadge>
              ) : event.registrationStatus === "extended" ? (
                <StatusBadge tone="warning">Deadline extended</StatusBadge>
              ) : (
                <StatusBadge tone="success">Registration open</StatusBadge>
              )}
            </div>

            {/* Event Title */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              {event.title}
            </h1>

            {/* Event Details */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 xl:grid-cols-4">
              <div className="min-w-0">
                <dt className={detailLabelClass}>
                  <CalendarDays size={14} className="text-sky-300" />
                  Date
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {formatDateRange(event.startDate, event.endDate, event.date)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className={detailLabelClass}>
                  <MapPin size={14} className="text-pink-300" />
                  Venue
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">{event.venue || "SV Auditorium"}</dd>
              </div>
              <div className="min-w-0">
                <dt className={detailLabelClass}>
                  <Users size={14} className="text-violet-300" />
                  Team size
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {minMembers}–{maxMembers} members
                </dd>
              </div>
              <div className="min-w-0">
                <dt className={detailLabelClass}>
                  <Clock size={14} className="text-amber-300" />
                  {isOnSpotLive ? "Registration" : "Deadline"}
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {isOnSpotLive ? "Open at venue" : countdown.formattedDeadline}
                </dd>
                {!isOnSpotLive && !isRegistrationClosed && countdown.hasDeadline && (
                  <dd className="mt-0.5 text-xs tabular-nums text-amber-300/90">{countdown.countdownText}</dd>
                )}
              </div>
            </dl>

            {/* About Event Description */}
            {event.description && (
              <div>
                <h2 className="text-xs text-white/45">About</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{event.description}</p>
              </div>
            )}
          </div>
        </article>

        {/* Cell [1,2]: Team Registration & Roster Workspace */}
        <div className="flex flex-col h-full">
          <EventRegistrationModal
            event={event}
            isInline={true}
          />
        </div>

        {/* Cell [2,1]: Competition Rounds */}
        {hasRounds && (
          <section
            className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden"
            aria-label="Competition Rounds"
          >
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

            <div className="relative z-[2] flex flex-col gap-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-white">Competition rounds</h2>
                <span className="text-sm text-white/45">
                  {event.rounds?.length} {event.rounds?.length === 1 ? "round" : "rounds"}
                </span>
              </div>

              <ol className="flex flex-col gap-3">
                {event.rounds?.map((rnd) => (
                  <li key={rnd.roundNumber} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-white">
                        <span className="mr-2 font-mono text-pink-400">
                          {String(rnd.roundNumber).padStart(2, "0")}
                        </span>
                        {rnd.title}
                      </h3>
                      {rnd.type && <span className="shrink-0 text-xs text-white/45">{rnd.type}</span>}
                    </div>

                    {rnd.description && (
                      <p className="mt-2 text-sm leading-relaxed text-white/70">{rnd.description}</p>
                    )}

                    {rnd.details && rnd.details.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {rnd.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-white/60">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400/70" aria-hidden="true" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Cell [2,2]: Rules & Eligibility Guidelines */}
        <section
          className={`relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden ${
            !hasRounds ? "lg:col-span-2" : ""
          }`}
          aria-label="Rules and Eligibility"
        >
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

          <div className="relative z-[2] flex flex-col gap-5">
            <h2 className="text-xl font-semibold tracking-tight text-white">Rules &amp; eligibility</h2>

            {/* Rules Categories or Fallback Guidelines */}
            {hasRules ? (
              <div className="flex flex-col gap-3">
                {event.rules?.map((cat, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-sm font-semibold text-white">{cat.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {cat.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/70">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400/70" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold text-white">Participant guidelines</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400/70" aria-hidden="true" />
                    <span>Open to enrolled students of institutions under the Heritage Group.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400/70" aria-hidden="true" />
                    <span>Teams must consist of {minMembers} to {maxMembers} members.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400/70" aria-hidden="true" />
                    <span>Each participant may belong to only one registered roster.</span>
                  </li>
                  {countdown.hasDeadline && (
                    <li className="flex items-start gap-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-pink-400/70" aria-hidden="true" />
                      <span>
                        Registration deadline: <span className="text-white">{countdown.formattedDeadline}</span>
                        {!isClosed && (
                          <span className="ml-2 tabular-nums text-white/45">{countdown.countdownText}</span>
                        )}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Action Navigation Row */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-4 border-t border-white/10">
              <Button variant="ghost" size="sm" className="-ml-2.5" onClick={onBack}>
                <ArrowLeft />
                All events
              </Button>

              {event.link && (
                <Button asChild variant="outline" size="sm">
                  <a href={event.link} target="_blank" rel="noopener noreferrer">
                    Portal form
                    <ExternalLink />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

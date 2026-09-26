"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Share2,
  Check,
  Layers,
  ShieldCheck,
  Target,
  CheckCircle2,
  Gavel,
  Clock,
  Timer,
} from "lucide-react";
import type { PublicEvent } from "@/types";
import { useCountdown } from "@/lib/countdown";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";

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
  event,
  onBack,
}: EventInsideViewProps) {
  const [copied, setCopied] = useState(false);

  const minMembers = event.minTeamMembers || 2;
  const maxMembers = event.maxTeamMembers || 4;
  const countdown = useCountdown(event.registrationDeadline);
  const isClosed = event.registrationStatus === "closed" || countdown.isExpired;

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
      {/* Top Back Navigation Breadcrumb */}
      <nav className="flex items-center justify-between gap-4 flex-wrap mb-1" aria-label="Event navigation">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-white/[0.02] hover:from-white/[0.15] hover:to-white/[0.08] border border-white/20 hover:border-rose-400/40 backdrop-blur-2xl px-5 py-2.5 text-xs font-semibold tracking-wider text-white hover:scale-105 transition-all shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] cursor-pointer"
        >
          <ArrowLeft size={14} className="text-rose-300" />
          <span className="uppercase">Back to Events</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-white/80 uppercase tracking-widest bg-gradient-to-r from-[#1c182a]/90 via-[#130f21]/90 to-[#0b0914]/90 border border-white/15 hover:border-white/25 backdrop-blur-2xl px-4 py-2 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <Link href="/events" onClick={onBack} className="hover:text-rose-300 transition-colors">
            Events
          </Link>
          <span className="text-rose-400/60 font-mono">/</span>
          <span className="text-white font-bold max-w-[200px] truncate">
            {event.title}
          </span>
        </div>
      </nav>

      {/* 2x2 Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
        {/* Cell [1,1]: Hero Event Card */}
        <article className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

          <div className="relative z-[2] flex flex-col gap-6">
            {/* Status Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {event.tag && event.tag.trim().toLowerCase() !== "flagship" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/15 text-white/85 backdrop-blur-md shadow-sm">
                  {event.tag}
                </span>
              )}

              {event.registrationStatus === "closed" ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/[0.08] border border-rose-500/20 text-rose-300/90 backdrop-blur-md">
                  <span className="inline-flex rounded-full h-2 w-2 bg-rose-400/80 shrink-0" />
                  <span>Registrations Closed</span>
                </span>
              ) : event.registrationStatus === "extended" ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/[0.08] border border-amber-500/25 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.12)] backdrop-blur-md">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  </span>
                  <span>Extended Deadline</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/[0.08] border border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.12)] backdrop-blur-md">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </span>
                  <span>Registrations Open</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/12 text-white/80 backdrop-blur-md shadow-sm">
                <Users size={12} className="text-rose-300/80 shrink-0" />
                <span>Team: {minMembers}–{maxMembers} Members</span>
              </span>
            </div>

            {/* Event Title */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]">
              {event.title}
            </h1>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between gap-1 shadow-md">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                  <Calendar size={13} className="text-rose-300/90 shrink-0" />
                  <span>Schedule</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {formatDateRange(event.startDate, event.endDate, event.date)}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between gap-1 shadow-md">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                  <MapPin size={13} className="text-rose-300/90 shrink-0" />
                  <span>Venue</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {event.venue || "SV Auditorium"}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between gap-1 shadow-md">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                  <Users size={13} className="text-rose-300/90 shrink-0" />
                  <span>Roster Size</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {minMembers}–{maxMembers} Members / Team
                </span>
              </div>

              <div
                className={`rounded-2xl p-3.5 flex flex-col justify-between gap-2 shadow-md transition-all ${
                  isClosed
                    ? "bg-white/5 border border-white/10 text-white/70"
                    : "bg-rose-500/[0.08] border border-rose-500/25 text-white shadow-[0_0_15px_rgba(242,0,137,0.12)]"
                }`}
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-white/60">
                  <Clock size={13} className={isClosed ? "text-white/40 shrink-0" : "text-rose-400 shrink-0"} />
                  <span>Deadline</span>
                  {!isClosed && countdown.hasDeadline && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse ml-auto" />
                  )}
                </span>

                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
                    {countdown.formattedDeadline}
                  </span>
                  {!isClosed && countdown.hasDeadline ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-400/30 text-rose-300 w-fit shadow-sm">
                      <Timer size={10} className="text-rose-400 shrink-0 animate-pulse" />
                      <span className="tabular-nums tracking-wide">{countdown.countdownText}</span>
                    </div>
                  ) : isClosed ? (
                    <span className="text-[10px] font-mono text-white/40">
                      Registration Closed
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* About Event Description */}
            {event.description && (
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">
                  Executive Brief
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-white/80">
                  {event.description}
                </p>
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
            className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col justify-between"
            aria-label="Competition Rounds"
          >
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

            <div className="relative z-[2] flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-rose-300">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-google-sans)]">
                      Competition Rounds
                    </h2>
                    <p className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                      {event.rounds?.length} Progressive Stages
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/12 text-white/70">
                  Stage Timeline
                </span>
              </div>

              {/* Rounds Cards */}
              <div className="flex flex-col gap-4">
                {event.rounds?.map((rnd) => (
                  <div
                    key={rnd.roundNumber}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] p-5 flex flex-col gap-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f20089]/15 border border-[#f20089]/30 text-[#f20089] text-xs font-medium tracking-wide">
                          Round {rnd.roundNumber < 10 ? `0${rnd.roundNumber}` : rnd.roundNumber}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {rnd.title}
                        </h3>
                      </div>
                      <span className="text-xs text-white/60 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/10">
                        {rnd.type}
                      </span>
                    </div>

                    {rnd.description && (
                      <p className="text-xs text-white/80 leading-relaxed">
                        {rnd.description}
                      </p>
                    )}

                    {rnd.details && rnd.details.length > 0 && (
                      <ul className="grid grid-cols-1 gap-2 pt-1">
                        {rnd.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-white/70"
                          >
                            <CheckCircle2
                              size={13}
                              className="text-rose-400 mt-0.5 shrink-0"
                            />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Cell [2,2]: Rules & Eligibility Guidelines */}
        <section
          className={`relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col justify-between ${
            !hasRounds ? "lg:col-span-2" : ""
          }`}
          aria-label="Rules and Eligibility"
        >
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

          <div className="relative z-[2] flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-rose-300">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-google-sans)]">
                    Rules &amp; Eligibility
                  </h2>
                  <p className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                    Official Tournament Protocol
                  </p>
                </div>
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

            {/* Rules Categories or Fallback Guidelines */}
            {hasRules ? (
              <div className="flex flex-col gap-4">
                {event.rules?.map((cat, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 text-white">
                      <Gavel size={14} className="text-rose-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                        {cat.title}
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {cat.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-2.5 text-xs text-white/75 leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider font-mono">
                  Participant Guidelines
                </h3>
                <ul className="text-xs text-white/70 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 mt-1.5 shrink-0" />
                    <span>Open to enrolled students of institutions under the Heritage Group.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 mt-1.5 shrink-0" />
                    <span>Teams must consist of {minMembers} to {maxMembers} members.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 mt-1.5 shrink-0" />
                    <span>Each participant may belong to only one registered roster.</span>
                  </li>
                  {countdown.hasDeadline && (
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 mt-1.5 shrink-0" />
                      <span className="flex items-center gap-2 flex-wrap">
                        <span>Registration Deadline:</span>
                        <strong className="text-rose-300 font-semibold">
                          {countdown.formattedDeadline}
                        </strong>
                        {!isClosed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 border border-rose-400/40 text-rose-200">
                            <Timer size={10} className="text-rose-300 shrink-0 animate-pulse" />
                            <span className="tabular-nums">{countdown.countdownText}</span>
                          </span>
                        )}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Action Navigation Row */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-white/[0.02] hover:from-white/[0.15] hover:to-white/[0.08] border border-white/20 hover:border-rose-400/40 backdrop-blur-2xl px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]"
              >
                <ArrowLeft size={13} className="text-rose-300" />
                <span>Back to All Events</span>
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Portal Form</span>
                    <ExternalLink size={13} />
                  </a>
                )}

                {event.registrationStatus === "closed" && (
                  <span className="rounded-full bg-rose-500/[0.08] border border-rose-500/20 px-4 py-2 text-xs font-medium text-rose-300/80 inline-flex items-center gap-1.5">
                    <span className="inline-flex rounded-full h-1.5 w-1.5 bg-rose-400/80 shrink-0" />
                    <span>Registrations Closed</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


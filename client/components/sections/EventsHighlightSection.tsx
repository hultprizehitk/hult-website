"use client";

import React from "react";
import Link from "next/link";

export default function EventsHighlightSection() {
  return (
    <section
      id="events-preview"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16 overflow-hidden z-10 selection:bg-[#f20089] selection:text-white bg-black font-[family-name:var(--font-google-sans)] border-t border-white/10"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OnCampus Series</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Featured Events &{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-pink-200 to-[#f20089] bg-clip-text text-transparent">
                Hult Ascend
              </span>
            </h2>
          </div>

          <Link
            href="/events"
            className="rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-5 py-2.5 text-xs font-bold text-white transition-all hover:scale-105 flex items-center gap-2"
          >
            <span>Explore All Events</span>
            <span>→</span>
          </Link>
        </div>

        {/* Featured Card: Hult Ascend */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#f20089]/60 bg-gradient-to-br from-[#f20089]/20 via-purple-950/30 to-black p-8 sm:p-12 backdrop-blur-3xl shadow-[0_20px_50px_rgba(242,0,137,0.25)] space-y-6">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#f20089]/30 blur-3xl" />

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#f20089] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-[#f20089]/40">
              ⚡ FLAGSHIP EVENT
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase font-mono">
              ✓ Registration Open
            </span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Hult Ascend — Quiz & Pitch Challenge
            </h3>
            <p className="text-xs sm:text-base text-white/80 font-sans leading-relaxed">
              Assemble your team of 2 to 3 members in Auditorium Room 1. Scan the auditorium QR code on event day to log real-time attendance, complete the live timed quiz, and present your venture elevator pitch!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-1">
              <span className="text-[10px] text-white/50 uppercase block">Venue</span>
              <span className="font-bold text-white text-sm block">📍 Auditorium Room 1</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-1">
              <span className="text-[10px] text-white/50 uppercase block">Format</span>
              <span className="font-bold text-white text-sm block">👥 2–3 Members / Team</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-1">
              <span className="text-[10px] text-white/50 uppercase block">Check-In</span>
              <span className="font-bold text-emerald-300 text-sm block">📱 Auditorium QR Code</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              href="/events"
              className="rounded-2xl bg-gradient-to-r from-[#f20089] to-purple-600 hover:from-[#ff1a9b] hover:to-purple-500 px-7 py-3 text-xs font-bold text-white shadow-xl shadow-[#f20089]/40 transition-all hover:scale-105 active:scale-95"
            >
              Register & RSVP for Hult Ascend →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

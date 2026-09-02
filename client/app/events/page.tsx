"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import DistressedEventsTitle from "../components/DistressedEventsTitle";

interface PublicEvent {
  _id: string;
  title: string;
  tag: string;
  date: string;
  venue: string;
  description: string;
  link?: string;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-[#f20089] selection:text-white overflow-x-hidden flex flex-col justify-between">
      {/* 
        ========================================================================
        WEBGL AURORA FLUID BACKGROUND
        ========================================================================
      */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 16,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90" />
      </div>

      {/* Atmospheric Ambient Glow */}
      <div className="pointer-events-none fixed top-20 left-1/4 w-[600px] h-[350px] bg-[#f20089]/15 blur-[160px] rounded-full z-0" />
      <div className="pointer-events-none fixed bottom-10 right-10 w-[500px] h-[350px] bg-purple-900/20 blur-[150px] rounded-full z-0" />

      {/* 
        ========================================================================
        HEADER NAVIGATION (100% Identical to Homepage: Logos Left, Nav Right, Transparent)
        ========================================================================
      */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-google-sans)] bg-transparent border-none">
        {/* Brand Logos */}
        <div className="flex items-center gap-2 sm:gap-3 transition-opacity duration-700">
          <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8 md:h-9">
            <Image
              src="/Hult-Prize.png"
              alt="Hult Prize Logo"
              fill
              sizes="(max-width: 640px) 46px, 66px"
              priority
              className="object-contain drop-shadow-md"
            />
          </Link>
          <div className="relative aspect-[1024/895] h-7 sm:h-8 md:h-9">
            <Image
              src="/hitk-25-logo.png"
              alt="Heritage Institute of Technology 25 Years Logo"
              fill
              sizes="(max-width: 640px) 40px, 56px"
              priority
              className="object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-[family-name:var(--font-google-sans)]">
          <Link
            href="/#about"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            About
          </Link>
          <Link
            href="/events"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/#challenge"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            Challenge
          </Link>
          <Link
            href="/#timeline"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-white"
          >
            Timeline
          </Link>
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f20089]/50 bg-[#f20089]/20 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 transition-transform"
              >
                <span className="h-2 w-2 rounded-full bg-[#f20089] animate-pulse" />
                {session.user.name?.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-[#f20089]/40 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
            >
              Register Now
            </Link>
          )}
        </nav>

        {/* Mobile Right Bar: Compact Register + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089]/25 border border-[#f20089]/50 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md active:scale-95"
            >
              {session.user.name?.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md shadow-[#f20089]/40 active:scale-95"
            >
              Register
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[52px] z-45 md:hidden bg-black/95 backdrop-blur-3xl border-b border-white/15 px-6 py-6 shadow-2xl flex flex-col gap-4 font-[family-name:var(--font-google-sans)] animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            About
          </Link>
          <Link
            href="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/#challenge"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Challenge
          </Link>
          <Link
            href="/#timeline"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Timeline
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 text-center rounded-full bg-[#f20089] py-3 text-sm font-bold text-white shadow-lg shadow-[#f20089]/40"
          >
            Register Now
          </Link>
        </div>
      )}

      {/* 
        ========================================================================
        MAIN SECTION (Distressed Events Typography & Dynamic Published Events)
        ========================================================================
      */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-4 sm:px-6 text-center py-16 sm:py-20 w-full">
        {/* Distressed Gothic Spurred Title */}
        <DistressedEventsTitle text="EVENTS" className="mb-8" />

        {/* Dynamic Events Grid */}
        {loading ? (
          <div className="py-12 text-white/50 text-xs tracking-widest uppercase animate-pulse">
            Syncing schedule...
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left mt-4 animate-fadeIn">
            {events.map((event) => (
              <div
                key={event._id}
                className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 hover:border-[#f20089]/60 hover:bg-white/[0.06] hover:shadow-[0_15px_35px_rgba(242,0,137,0.2)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f20089]">
                      {event.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-neutral-300 mb-4 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50">📅</span>
                      <span className="font-semibold text-white">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50">📍</span>
                      <span className="text-white/80">{event.venue}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-6 font-sans">
                    {event.description}
                  </p>
                </div>

                <Link
                  href={event.link || "/register"}
                  className="inline-flex items-center justify-center rounded-full bg-[#f20089] hover:bg-[#d8007a] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#f20089]/40 transition-all group-hover:scale-[1.02] font-[family-name:var(--font-google-sans)]"
                >
                  <span>{event.link ? "Learn More & RSVP →" : "Register for Event →"}</span>
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-neutral-400 font-sans border-t border-white/5">
        © 2027 Hult Prize OnCampus at Heritage Institute of Technology.
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, Calendar, MapPin, Users, Shield } from "lucide-react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import DistressedEventsTitle from "@/components/sections/DistressedEventsTitle";

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

import EventInsideView from "./components/EventInsideView";

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // User event registration tracking: eventId -> registered team data
  const [userRegistrations, setUserRegistrations] = useState<Record<string, any>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Sync selectedEventId with URL parameter "?event=[id]"
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const eventIdParam = params.get("event");
      if (eventIdParam) {
        setSelectedEventId(eventIdParam);
      }

      const onPopState = () => {
        const p = new URLSearchParams(window.location.search);
        setSelectedEventId(p.get("event"));
      };
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }
  }, []);

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

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch logged-in student's registrations
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch("/api/events/register")
        .then((res) => (res.ok ? res.json() : { registrations: [] }))
        .then((data) => {
          const map: Record<string, any> = {};
          (data.registrations || []).forEach((reg: any) => {
            if (reg.eventId) map[reg.eventId] = reg.team;
          });
          setUserRegistrations(map);
        })
        .catch((err) => console.error("Error loading user registrations:", err));
    }
  }, [status, session]);

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
      <header className="fixed top-0 inset-x-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-google-sans)] bg-black/60 backdrop-blur-md border-b border-white/10">
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
          <button
            type="button"
            onClick={handleBackToEvents}
            className="text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow transition-colors duration-200 hover:text-[#f20089] cursor-pointer"
          >
            Events
          </button>
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
          <Link
            href="/team"
            className="text-xs sm:text-sm font-semibold tracking-wide text-white/85 drop-shadow transition-colors duration-200 hover:text-[#f20089]"
          >
            Team
          </Link>
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-3">
              {["junior_admin", "lead_admin", "master_admin"].includes(
                (session.user as { role?: string })?.role || ""
              ) && (
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-1 rounded-full border border-[#f20089]/60 bg-[#f20089]/20 hover:bg-[#f20089]/30 px-3 py-1.5 text-xs font-mono font-bold text-pink-300 hover:text-white transition-all shadow-sm hover:scale-[1.02]"
                >
                  <span>
                    {(session.user as { role?: string })?.role === "master_admin"
                      ? "Master Admin CMS"
                      : (session.user as { role?: string })?.role === "lead_admin"
                      ? "Lead Admin CMS"
                      : "Junior Admin CMS"}
                  </span>
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 transition-all"
                title="View User Profile"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
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
            <div className="flex items-center gap-1.5">
              {["junior_admin", "lead_admin", "master_admin"].includes(
                (session.user as { role?: string })?.role || ""
              ) && (
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-1 rounded-full bg-[#f20089]/30 border border-[#f20089]/60 px-2.5 py-1 text-[11px] font-bold text-pink-200"
                >
                  <Shield className="h-3 w-3 text-[#f20089]" />
                  <span>CMS</span>
                </Link>
              )}
              <Link
                href="/profile"
                className="rounded-full bg-white/[0.1] border border-white/20 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md active:scale-95"
              >
                {session.user.name?.split(" ")[0]}
              </Link>
            </div>
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
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleBackToEvents();
            }}
            className="text-left text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors cursor-pointer"
          >
            Events
          </button>
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
            href="/team"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Organizing Committee
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
        MAIN CONTENT: IN-PAGE EVENT STUDIO OR EVENTS GRID (ZERO POPUP MODALS)
        ========================================================================
      */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-4 sm:px-6 text-center pt-20 sm:pt-24 pb-12 sm:pb-16 w-full">
        {selectedEventId ? (
          (() => {
            const currentEvent = events.find((e) => e._id === selectedEventId);

            if (loading) {
              return (
                <div className="py-24 text-center space-y-4">
                  <div className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f20089]" />
                  <div className="text-white/50 text-xs tracking-widest uppercase animate-pulse">
                    Loading Event Studio...
                  </div>
                </div>
              );
            }

            if (!currentEvent) {
              return (
                <div className="py-20 text-center space-y-4 font-[family-name:var(--font-google-sans)] animate-fadeIn">
                  <Search className="h-10 w-10 text-[#f20089] mx-auto mb-2" />
                  <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
                  <p className="text-xs text-white/60 max-w-md mx-auto">
                    The event you selected could not be found or may have been updated by the organizing committee.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleBackToEvents}
                      className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all cursor-pointer"
                    >
                      ← Back to All Events
                    </button>
                  </div>
                </div>
              );
            }

            return (
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
            );
          })()
        ) : (
          <>
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
                    onClick={() => handleSelectEvent(event)}
                    className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 hover:border-[#f20089]/60 hover:bg-white/[0.06] hover:shadow-[0_15px_35px_rgba(242,0,137,0.2)] cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f20089]">
                          {event.tag}
                        </span>

                        {event.registrationStatus === "closed" ? (
                          <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[10px] font-bold text-red-300 uppercase tracking-wider">
                            Closed
                          </span>
                        ) : event.registrationStatus === "extended" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            Extended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Registering
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3 font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-neutral-300 mb-4 font-sans">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-white/50" />
                          <span className="font-semibold text-white">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-white/50" />
                          <span className="text-white/80">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-white/50" />
                          <span className="text-white/80">
                            Team Size:{" "}
                            <strong className="text-white font-semibold">
                              {event.minTeamMembers || 3} to {event.maxTeamMembers || 5} Members
                            </strong>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-6 font-sans">
                        {event.description}
                      </p>
                    </div>

                    {/* Registration Action Buttons */}
                    {(() => {
                      const registeredTeam = userRegistrations[event._id];

                      if (registeredTeam) {
                        const totalJoined = 1 + (registeredTeam.members?.length || 0);
                        const minReq = event.minTeamMembers || 3;
                        const isComplete = totalJoined >= minReq;
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvent(event);
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold shadow-md transition-all cursor-pointer font-[family-name:var(--font-google-sans)] group-hover:scale-[1.02] ${
                              isComplete
                                ? "bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 shadow-emerald-500/20"
                                : "bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 shadow-amber-500/20"
                            }`}
                          >
                            <span>
                              {isComplete
                                ? "Team Registered (Confirmed) →"
                                : `Roster Incomplete (${totalJoined}/${minReq} Min) →`}
                            </span>
                          </button>
                        );
                      }

                      if (event.registrationStatus === "closed") {
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvent(event);
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 px-5 py-2 text-xs font-semibold text-white/60 font-[family-name:var(--font-google-sans)] cursor-pointer transition-all"
                          >
                            <span>Registrations Closed (View Details) →</span>
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2 flex-wrap w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvent(event);
                            }}
                            className="flex-1 inline-flex items-center justify-center rounded-full bg-[#f20089] hover:bg-[#d8007a] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#f20089]/40 transition-all group-hover:scale-[1.02] font-[family-name:var(--font-google-sans)] cursor-pointer"
                          >
                            <span>
                              {event.registrationStatus === "extended"
                                ? "Register Team (Extended) →"
                                : "Register Team →"}
                            </span>
                          </button>

                          {event.link && event.link.startsWith("http") && (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:text-white transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap"
                              title="External event details / RSVP link"
                            >
                              <span>RSVP ↗</span>
                            </a>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-neutral-400 font-sans border-t border-white/5">
        © 2027 Hult Prize OnCampus at Heritage Institute of Technology.
      </footer>
    </div>
  );
}

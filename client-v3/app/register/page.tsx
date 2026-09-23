"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Lock, ArrowRight, CheckCircle2, ShieldAlert, Users } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import GrainOverlay from "@/components/hero/GrainOverlay";
import EventHeroBackground from "@/components/events/EventHeroBackground";
import EventRegistrationModal from "@/components/events/EventRegistrationModal";
import type { PublicEvent } from "@/types";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetEvent, setTargetEvent] = useState<PublicEvent | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error === "DomainRestricted") {
        setErrorMessage(
          "Access Restricted: Only official Heritage Institute college email accounts (@heritageit.edu.in) are permitted to sign in. Personal Gmail accounts are strictly prohibited."
        );
      } else if (error) {
        setErrorMessage(
          `Authentication notice (${error}): Please verify you are using your official @heritageit.edu.in account.`
        );
      }

      const eventId = params.get("event") || params.get("eventId");
      if (eventId) {
        fetch(`/api/events?id=${eventId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.event) {
              setTargetEvent(data.event);
            }
          })
          .catch((err) => {
            console.error("Error loading event for registration:", err);
          });
      }
    }
  }, []);

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const callback = typeof window !== "undefined" ? window.location.href : "/profile";
    signIn("google", { callbackUrl: callback });
  };

  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        department?: string;
        year?: string;
      }
    | undefined;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0c14] font-[family-name:var(--font-google-sans)] text-white selection:bg-white/90 selection:text-black flex flex-col justify-between">
      {/* Site-wide Kolkata hero background */}
      <EventHeroBackground />
      <GrainOverlay opacity={0.4} />

      <SiteHeader />

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-12">
        {status === "authenticated" && user ? (
          /* ────────────────────────────────────────────────────────
             AUTHENTICATED SCHOLAR VIEW
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-lg md:max-w-xl animate-fadeIn">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-black/55 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl text-center">
              {/* Glass Top Highlight */}
              <div
                className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
                aria-hidden="true"
              />

              <div className="relative z-[2]">
                {/* Avatar */}
                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-3xl font-extrabold text-white shadow-xl overflow-hidden backdrop-blur-xl">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name || "Student"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name?.charAt(0) || "H"
                  )}
                </div>

                {/* Verified Badge */}
                <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Verified HITK Student</span>
                  </div>
                </div>

                {/* Student Name & Email */}
                <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-0.5">
                  {user.name}
                </h2>
                <p className="text-xs text-white/50 text-center mb-6 font-mono font-medium tracking-tight">
                  {user.email}
                </p>

                {/* Student Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                    <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-white/40 mb-1">
                      Department
                    </span>
                    <span className="text-sm font-semibold text-white block">
                      {user.department || "General Engineering"}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                    <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-white/40 mb-1">
                      Year of Study
                    </span>
                    <span className="text-sm font-semibold text-white block">
                      {user.year || "3rd Year"}
                    </span>
                  </div>
                </div>

                {/* Event Registration Banner */}
                {targetEvent && (
                  <div className="mb-6 rounded-2xl border border-[#f20089]/40 bg-[#f20089]/10 p-4 text-left backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#f20089]">
                        Target Event
                      </span>
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-mono text-rose-300 font-bold uppercase">
                        {targetEvent.tag || "LIVE"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">
                      {targetEvent.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("team-registration");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="w-full rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:scale-105"
                    >
                      <Users size={13} />
                      <span>Register Team (Create / Join)</span>
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  <Link
                    href="/profile"
                    className="w-full rounded-2xl bg-white hover:bg-neutral-100 px-4 py-3 text-xs font-bold text-neutral-950 transition-all hover:scale-[1.02] active:scale-95 text-center shadow-lg"
                  >
                    Student Profile &amp; Pass →
                  </Link>
                  <Link
                    href="/events"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-3 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95 text-center backdrop-blur-md"
                  >
                    View Events
                  </Link>
                  <Link
                    href="/"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-3 text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 text-center backdrop-blur-md"
                  >
                    Homepage
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/register" })}
                    className="w-full rounded-2xl border border-red-500/30 bg-red-950/30 hover:bg-red-900/50 px-4 py-3 text-xs font-semibold text-red-300 transition-all cursor-pointer text-center backdrop-blur-md"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────
             SIGN-IN VIEW: GOOGLE OAUTH IDENTITY PORTAL
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-[540px] animate-fadeIn">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-black/55 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
              {/* Glass Top Highlight */}
              <div
                className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]"
                aria-hidden="true"
              />

              <div className="relative z-[2]">
                {/* Heading */}
                <div className="text-center mb-6 space-y-1">
                  <h1
                    className="text-[min(6.2vw,2.5rem)] font-normal tracking-wide uppercase text-white whitespace-nowrap"
                    style={{
                      fontFamily: "'IM Fell Double Pica', Georgia, serif",
                    }}
                  >
                    Student Identity
                  </h1>
                  <h2
                    className="text-xl sm:text-2xl font-bold tracking-widest uppercase text-[#f20089]"
                    style={{
                      fontFamily: "'IM Fell Double Pica', Georgia, serif",
                    }}
                  >
                    Portal 2027
                  </h2>
                  <p className="text-xs text-white/60 pt-1">
                    Sign in with your official @heritageit.edu.in account.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-200 text-left backdrop-blur-md animate-fadeIn">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-1">Authentication Restricted</span>
                      <span className="text-rose-200/80 leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3.5 rounded-2xl bg-white hover:bg-neutral-100 py-4 px-6 text-sm font-bold text-neutral-950 shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isSigningIn ? (
                    <span className="flex items-center gap-2.5 text-neutral-600">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Connecting to Google...</span>
                    </span>
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google (HITK Account)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* Domain Restricted Notice */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-md">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-white/90 mb-1">
                        Domain Restricted Access
                      </span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        This competition platform is restricted strictly to verified Heritage Institute
                        students. Only college accounts ending in{" "}
                        <strong className="text-rose-300">@heritageit.edu.in</strong> are authorized.
                        Personal accounts will be rejected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Home */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-5 text-center">
        <p className="text-[10px] sm:text-[11px] text-white/40 font-medium leading-relaxed">
          &copy; 2027 Hult Prize at Heritage Institute of Technology. All rights reserved.
        </p>
      </footer>

      {/* Target Event Registration Workspace (Inline on page) */}
      {targetEvent && (
        <section className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          <EventRegistrationModal
            event={targetEvent}
            isInline={true}
          />
        </section>
      )}
    </div>
  );
}
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { Lock, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import GrainOverlay from "@/components/hero/GrainOverlay";
import KolkataHero from "@/components/hero/KolkataHero";
import { parseHeritageEmail } from "@/lib/heritage-parser";

/**
 * Student identity portal, re-skinned in the "Kolkata" theme.
 *
 * Frontend-only note: Google OAuth + MongoDB arrive with the backend. Until
 * then a verified-college-email entry is the signing path — the supplied email
 * is parsed via @/lib/heritage-parser and persisted to a localStorage session
 * by @/lib/auth-client. Swap for OAuth when the API lands.
 */

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "DomainRestricted") {
      return "Access Restricted: Only official Heritage Institute college email addresses (@heritageit.edu.in) are permitted to sign in.";
    }
    if (error) {
      return `Authentication notice (${error}): Please verify you are using your official @heritageit.edu.in account.`;
    }
    return null;
  });
  const [isSigningIn, setIsSigningIn] = useState(false);

  // If already authenticated, redirect seamlessly to the student profile
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/profile");
    }
  }, [status, router]);

  // Computed student identity from the entered college email
  const studentInfo = useMemo(() => {
    if (!email || !/@heritageit\.edu\.in$/i.test(email)) return null;
    return parseHeritageEmail(email);
  }, [email]);

  const isHeritageDomain = email.trim().toLowerCase().endsWith("@heritageit.edu.in");
  const isEmailValid = studentInfo && /@heritageit\.edu\.in$/i.test(email.trim().toLowerCase());

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEmailValid) {
      setErrorMessage(
        "Please enter your official @heritageit.edu.in college email to proceed."
      );
      return;
    }

    setIsSigningIn(true);
    try {
      sessionStorage.setItem("hult_intro_played", "true");
    } catch {}
    signIn("college-email", { email: email.trim(), callbackUrl: "/profile" });
  };

  // Role checks (kept in sync with the live app's clearance model)
  const userRole = (session?.user as { role?: string })?.role;
  const isMasterAdmin = userRole === "master_admin";
  const isLeadAdmin = userRole === "lead_admin";
  const isJuniorAdmin = userRole === "junior_admin";
  const isAdmin = isMasterAdmin || isLeadAdmin || isJuniorAdmin;

  const adminBadgeLabel = isMasterAdmin
    ? "Master Admin"
    : isLeadAdmin
    ? "Lead Admin"
    : isJuniorAdmin
    ? "Junior Admin"
    : "Admin";

  const sessionStudentInfo = session?.user?.email
    ? parseHeritageEmail(session.user.email, session.user.name)
    : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-white/90 selection:text-black flex flex-col">
      {/* Kolkata skyline scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <KolkataHero
          mouseOffset={{ x: 0, y: 0 }}
          isRevealed={true}
          hideText={true}
          hideForeground={true}
        />
      </div>
      <GrainOverlay opacity={0.65} />

      <SiteHeader transparent theme="light" />

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-10">
        {status === "authenticated" && session?.user ? (
          /* ────────────────────────────────────────────────────────
             AUTHENTICATED VIEW — dark Kolkata glass card
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-lg md:max-w-xl animate-fadeIn">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-6 sm:p-8 md:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl">
              {/* Ambient Glows */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/[0.05] blur-3xl" />

              {/* Avatar */}
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/[0.08] text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(255,255,255,0.15)] font-[family-name:var(--font-google-sans)] overflow-hidden backdrop-blur-xl">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Student"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  sessionStudentInfo?.firstName?.charAt(0) || "H"
                )}
              </div>

              {/* Verified Badges */}
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified HITK Scholar
                </div>
                {isAdmin && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                    {adminBadgeLabel} Clearance
                  </div>
                )}
              </div>

              {/* Student Name */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center mb-0.5 font-[family-name:var(--font-google-sans)]">
                {sessionStudentInfo?.fullName || session.user.name}
              </h2>
              <p className="text-xs text-white/50 text-center mb-6 font-mono font-medium tracking-tight">
                {session.user.email}
              </p>

              {/* Student Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                <div className="rounded-2xl border border-white/10 bg-[#121216] p-4">
                  <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                    Department
                  </span>
                  <span className="text-sm font-bold text-white block font-[family-name:var(--font-google-sans)]">
                    {sessionStudentInfo?.branchName || "General Engineering"}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121216] p-4">
                  <span className="block text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mb-1">
                    Year of Study
                  </span>
                  <span className="text-sm font-bold text-white block font-[family-name:var(--font-google-sans)]">
                    {sessionStudentInfo?.academicYear || "3rd Year"}
                  </span>
                  <span className="inline-block mt-2 rounded-md bg-rose-400/15 border border-rose-300/30 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-200">
                    {sessionStudentInfo?.batch || "Class of 2028"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                <Link
                  href="/"
                  className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 text-center font-[family-name:var(--font-google-sans)]"
                >
                  Homepage
                </Link>
                <Link
                  href="/events"
                  className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-3 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95 text-center font-[family-name:var(--font-google-sans)]"
                >
                  View Events
                </Link>
                <Link
                  href="/profile"
                  className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-3 text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 text-center font-[family-name:var(--font-google-sans)]"
                >
                  Student Profile &amp; Pass
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/register" })}
                  className="w-full rounded-2xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-4 py-3 text-xs font-semibold text-red-300 transition-all cursor-pointer text-center font-[family-name:var(--font-google-sans)]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────
             SIGN-IN VIEW — Kolkata glass identity portal
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-[560px] animate-fadeIn">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-8 sm:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl">
              {/* Ambient Glows */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/[0.05] blur-3xl" />

              {/* HITK Badge */}
              <div className="relative flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 backdrop-blur-xl shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase font-[family-name:var(--font-google-sans)]">
                    HITK Student Portal
                  </span>
                </div>
              </div>

              {/* Heading */}
              <h1 className="relative text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-[family-name:var(--font-google-sans)] leading-tight text-center mb-1.5">
                Student Identity
              </h1>
              <h1
                className="relative text-4xl lg:text-5xl font-bold tracking-wider uppercase font-[family-name:var(--font-cinzel)] leading-tight text-center mb-3"
                style={{
                  background:
                    "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 80%, #94A3B8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter:
                    "drop-shadow(0 2px 24px rgba(255,255,255,0.22)) drop-shadow(0 10px 36px rgba(0,0,0,0.85))",
                }}
              >
                Portal &apos;27
              </h1>
              <p className="relative text-sm text-white/50 text-center mb-8">
                Continue with your @heritageit.edu.in college account.
              </p>

              {/* Error Banner */}
              {errorMessage && (
                <div className="relative mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300 text-left backdrop-blur animate-fadeIn">
                  <svg className="h-4 w-4 shrink-0 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-bold block mb-0.5">Authentication Denied</span>
                    <span className="text-red-300/80">{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* College Email Sign-In Form */}
              <form onSubmit={handleSignIn} className="relative">
                <label
                  htmlFor="heritage-email"
                  className="block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1.5"
                >
                  College Email
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 backdrop-blur-xl focus-within:border-white/60 focus-within:bg-white/[0.08] transition-all">
                  <input
                    id="heritage-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name.surname@heritageit.edu.in"
                    autoComplete="email"
                    disabled={isSigningIn}
                    className="w-full bg-transparent py-4 text-sm font-medium text-white placeholder:text-white/30 focus:outline-none font-mono disabled:opacity-60"
                  />
                  <span
                    className={`shrink-0 text-[10px] font-mono font-bold uppercase tracking-widest ${
                      isHeritageDomain
                        ? "text-emerald-400"
                        : email
                        ? "text-white/30"
                        : "text-white/25"
                    }`}
                  >
                    {isHeritageDomain ? "HITK" : "@heritageit.edu.in"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-4 w-full flex items-center justify-center gap-2.5 rounded-2xl bg-white hover:bg-neutral-100 py-4 px-6 text-sm font-bold text-neutral-950 shadow-lg shadow-black/40 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isSigningIn ? (
                    <span className="flex items-center gap-2 text-neutral-600">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Continue to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Domain Restricted Notice */}
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-white/80 mb-1 font-[family-name:var(--font-google-sans)]">
                      Domain Restricted Access
                    </span>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      This competition platform is restricted strictly to verified Heritage Institute
                      students. Only college accounts ending in{" "}
                      <strong className="text-rose-300">@heritageit.edu.in</strong> are authorized.
                      Personal accounts will be rejected.
                    </p>
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
        <p className="text-[10px] sm:text-[11px] text-white/30 font-medium leading-relaxed">
          &copy; 2027 Hult Prize at Heritage Institute of Technology. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
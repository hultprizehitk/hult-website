"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { ArrowLeft, Lock, ArrowRight } from "lucide-react";
import { parseHeritageEmail } from "@/lib/heritage-parser";

/* ──────────────────────────────────────────────────────────────────────────────
   Floating Petal Component
   ────────────────────────────────────────────────────────────────────────────── */

interface PetalProps {
  style: React.CSSProperties;
  size: number;
}

function FloatingPetal({ style, size }: PetalProps) {
  return (
    <div className="absolute pointer-events-none floating-petal" style={style}>
      <div
        className="rounded-full bg-pink-300/70"
        style={{
          width: size,
          height: size * 0.6,
          filter: "blur(0.5px)",
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Register Page
   ────────────────────────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // If already authenticated, redirect seamlessly to the student profile
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/profile");
    }
  }, [status, router]);

  // Compute parsed student identity from college email format
  const studentInfo = session?.user?.email
    ? parseHeritageEmail(session.user.email, session.user.name)
    : null;

  // Check URL error parameter (e.g. redirected from Google OAuth with non-heritage domain)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error === "DomainRestricted") {
        setErrorMessage(
          "Access Restricted: Only official Heritage Institute college email addresses (@heritageit.edu.in) are permitted to sign in."
        );
      } else if (error === "AccessDenied" || error === "OAuthCallbackError" || error === "OAuthSignin") {
        setErrorMessage(
          "Google Access Blocked: In Google Cloud Console, apps in 'Testing' mode only allow emails listed under 'Audience / Test users'. Please add your email to Test Users or set Publishing status to In Production."
        );
      } else if (error) {
        setErrorMessage(
          `Authentication notice (${error}): Please verify you are using your official @heritageit.edu.in account and it is added to Google Cloud Console Test Users.`
        );
      }
    }
  }, []);

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("hult_intro_played", "true");
      } catch {}
    }
    signIn("google", { callbackUrl: "/profile" });
  };

  // Check user role permissions
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

  // Stable randomized petal positions
  const petals = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      size: 6 + Math.random() * 10,
      style: {
        left: `${5 + Math.random() * 90}%`,
        top: `${10 + Math.random() * 80}%`,
        "--tx": `${-40 + Math.random() * 80}px`,
        "--ty": `${-120 - Math.random() * 160}px`,
        "--rot": `${30 + Math.random() * 120}deg`,
        "--duration": `${5 + Math.random() * 6}s`,
        animationDelay: `${Math.random() * 6}s`,
        opacity: 0,
      } as React.CSSProperties,
    }));
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans selection:bg-pink-500/30 selection:text-pink-900 flex flex-col">
      {/* ================================================================
          LAYER 0: Full-bleed Background — NO overlay on desktop
          ================================================================ */}
      <div className="absolute inset-0 z-0">
        {/* Desktop background — clean, no overlay */}
        <Image
          src="/assets/hult-prize-hero/register/bg-register-desktop.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="hidden md:block object-cover object-center"
        />
        {/* Mobile background */}
        <Image
          src="/assets/hult-prize-hero/register/bg-register-mobile.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="block md:hidden object-cover object-bottom"
        />
      </div>

      {/* ================================================================
          LAYER 1: Cherry Blossom Branch Overlays
          ================================================================ */}

      {/* Desktop: Top-left cherry branch — large, sweeping from corner */}
      <div className="hidden md:block absolute -top-4 -left-8 z-10 w-[42vw] max-w-[640px] pointer-events-none">
        <Image
          src="/assets/hult-prize-hero/branches/cherry-branch-left.png"
          alt=""
          width={1456}
          height={816}
          priority
          className="w-full h-auto drop-shadow-lg"
        />
      </div>

      {/* Desktop: Bottom-right cherry branch — mirrored bottom-left branch for correct angle */}
      <div className="hidden md:block absolute -bottom-4 -right-4 z-10 w-[30vw] max-w-[460px] pointer-events-none">
        <Image
          src="/assets/hult-prize-hero/branches/branch-left-bottom.png"
          alt=""
          width={1456}
          height={816}
          priority
          className="w-full h-auto drop-shadow-lg scale-x-[-1]"
        />
      </div>

      {/* Mobile: Top-left branch */}
      <div className="block md:hidden absolute -top-2 -left-4 z-10 w-[70vw] max-w-[340px] pointer-events-none">
        <Image
          src="/assets/hult-prize-hero/branches/branch-mobile-left.png"
          alt=""
          width={828}
          height={1200}
          priority
          className="w-full h-auto drop-shadow-lg"
        />
      </div>

      {/* Mobile: Small accent branch top-right */}
      <div className="block md:hidden absolute top-16 -right-6 z-10 w-[30vw] max-w-[160px] pointer-events-none opacity-70">
        <Image
          src="/assets/hult-prize-hero/branches/cherry-branch-right.png"
          alt=""
          width={1456}
          height={816}
          className="w-full h-auto drop-shadow-md"
        />
      </div>

      {/* ================================================================
          LAYER 2: Floating Petals
          ================================================================ */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        {petals.map((p) => (
          <FloatingPetal key={p.id} style={p.style} size={p.size} />
        ))}
      </div>

      {/* ================================================================
          LAYER 3: Side Typography — Desktop Only
          ================================================================ */}

      {/* Left vertical text: "HULT PRIZE" / "HERITAGE '27" */}
      <div className="hidden lg:flex fixed left-6 xl:left-10 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-4">
        <div className="w-px h-8 bg-neutral-400/50" />
        <span
          className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          HULT PRIZE
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          HERITAGE &apos;27
        </span>
        <div className="w-px h-8 bg-neutral-400/50" />
      </div>

      {/* Right vertical text: "A BRIGHTER TOMORROW TOGETHER" */}
      <div className="hidden lg:flex fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1.5">
        <div className="w-px h-8 bg-neutral-400/50" />
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">A</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">BRIGHTER</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">TOMORROW</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">TOGETHER</span>
        <div className="w-px h-8 bg-neutral-400/50" />
      </div>

      {/* Bottom-left motto: "IDEAS PEOPLE IMPACT" */}
      <div className="hidden lg:flex fixed left-6 xl:left-10 bottom-14 z-30 flex-col items-start gap-0.5">
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">IDEAS</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">PEOPLE</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">IMPACT</span>
      </div>

      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="relative z-40 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        {/* Brand Logos */}
        <div className="flex items-center gap-2 sm:gap-3">
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
              alt="Heritage 25 Years"
              fill
              sizes="(max-width: 640px) 40px, 56px"
              priority
              className="object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-[family-name:var(--font-google-sans)]">
          <Link
            href="/events"
            className="text-sm font-semibold tracking-wide text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/team"
            className="text-sm font-semibold tracking-wide text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Team
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white/80 hover:bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:shadow-md backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center">
          <Link
            href="/"
            className="p-2 rounded-full bg-white/60 border border-neutral-200/60 backdrop-blur-sm"
            aria-label="Menu"
          >
            <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </Link>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-8">
        {status === "authenticated" && session?.user ? (
          /* ────────────────────────────────────────────────────────
             AUTHENTICATED VIEW
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-lg md:max-w-xl animate-fadeIn">
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 sm:p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
              {/* Avatar */}
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-2xl font-extrabold text-white shadow-lg border-2 border-white/80 overflow-hidden">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name || "Student"} className="h-full w-full object-cover" />
                ) : (
                  studentInfo?.firstName?.charAt(0) || "H"
                )}
              </div>

              {/* Verified Badges */}
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified HITK Scholar
                </div>
                {isAdmin && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-pink-400/40 bg-pink-50 px-3 py-1 text-[10px] font-bold text-pink-600 uppercase tracking-widest">
                    {adminBadgeLabel} Clearance
                  </div>
                )}
              </div>

              {/* Student Name */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 text-center mb-0.5 font-[family-name:var(--font-google-sans)]">
                {studentInfo?.fullName || (session.user.email ? parseHeritageEmail(session.user.email).fullName : "") || session.user.name}
              </h2>
              <p className="text-xs text-neutral-500 text-center mb-5 font-mono font-medium tracking-tight">
                {session.user.email}
              </p>

              {/* Student Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                <div className="rounded-2xl border border-neutral-200/60 bg-white/50 p-3.5 backdrop-blur">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-neutral-400 mb-1">Department</span>
                  <span className="text-sm font-bold text-neutral-800 block font-[family-name:var(--font-google-sans)]">
                    {studentInfo?.branchName || "General Engineering"}
                  </span>
                </div>
                <div className="rounded-2xl border border-neutral-200/60 bg-white/50 p-3.5 backdrop-blur">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-neutral-400 mb-1">Year of Study</span>
                  <span className="text-sm font-bold text-neutral-800 block font-[family-name:var(--font-google-sans)]">
                    {studentInfo?.academicYear || "3rd Year"}
                  </span>
                  <span className="inline-block mt-1.5 rounded-md bg-pink-100 border border-pink-200 px-2 py-0.5 text-[9px] font-bold text-pink-600">
                    {studentInfo?.batch || "Class of 2028"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {isAdmin && (
                  <Link href="/portal" className="w-full rounded-2xl bg-pink-600 hover:bg-pink-700 px-4 py-3 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 text-center font-[family-name:var(--font-google-sans)]">
                    {adminBadgeLabel} CMS
                  </Link>
                )}
                <Link href="/" className="w-full rounded-2xl border border-neutral-300 bg-white/80 hover:bg-white px-4 py-3 text-xs font-semibold text-neutral-700 transition-all text-center font-[family-name:var(--font-google-sans)]">
                  Homepage
                </Link>
                <Link href="/events" className="w-full rounded-2xl border border-neutral-300 bg-white/80 hover:bg-white px-4 py-3 text-xs font-semibold text-neutral-700 transition-all text-center font-[family-name:var(--font-google-sans)]">
                  View Events
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/register" })}
                  className="w-full rounded-2xl border border-red-200 bg-red-50/80 hover:bg-red-100 px-4 py-3 text-xs font-semibold text-red-600 transition-all cursor-pointer text-center font-[family-name:var(--font-google-sans)]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────
             SIGN-IN VIEW
             ──────────────────────────────────────────────────────── */
          <>
            {/* ─── DESKTOP: Everything inside one card ─── */}
            <div className="hidden md:block w-full max-w-[540px] animate-fadeIn">
              <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/65 p-8 lg:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
                {/* HITK Badge */}
                <div className="flex justify-center mb-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300/60 bg-white/70 px-4 py-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-neutral-600 uppercase font-[family-name:var(--font-google-sans)]">
                      HITK Student Portal
                    </span>
                  </div>
                </div>

                {/* Heading */}
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 font-[family-name:var(--font-google-sans)] leading-tight text-center mb-2">
                  Student Sign In
                </h1>
                <p className="text-sm text-neutral-500 text-center mb-8">
                  Sign in with your @heritageit.edu.in account.
                </p>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-300/60 bg-red-50/80 p-4 text-xs text-red-700 text-left backdrop-blur animate-fadeIn">
                    <svg className="h-4 w-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-bold block mb-0.5">Authentication Denied</span>
                      <span className="text-red-600/80">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 py-4 px-6 text-sm font-bold text-neutral-800 shadow-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] cursor-pointer font-[family-name:var(--font-google-sans)] disabled:opacity-70"
                >
                  {isSigningIn ? (
                    <span className="flex items-center gap-2 text-neutral-500">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Redirecting to Google...
                    </span>
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Sign In with College Google Account</span>
                    </>
                  )}
                </button>

                {/* OR Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-neutral-300/50" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">OR</span>
                  <div className="flex-1 h-px bg-neutral-300/50" />
                </div>

                {/* Domain Restricted Notice */}
                <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-4 text-left backdrop-blur">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-neutral-700 mb-1">
                        Domain Restricted Access
                      </span>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        This competition platform is restricted strictly to verified Heritage Institute students. Only Google accounts ending in{" "}
                        <strong className="text-pink-600">@heritageit.edu.in</strong>{" "}
                        are authorized. Personal accounts (@gmail.com) will be rejected automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── MOBILE: Open layout without enclosing card ─── */}
            <div className="block md:hidden w-full max-w-[460px] animate-fadeIn">
              {/* Tagline — top-right */}
              <div className="mb-5 text-right pr-2">
                <div className="flex flex-col items-end gap-0.5">
                  <div className="w-px h-5 bg-neutral-400/40 mb-1" />
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">A</span>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">BRIGHTER</span>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">TOMORROW</span>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">TOGETHER</span>
                  <div className="w-px h-5 bg-neutral-400/40 mt-1" />
                </div>
              </div>

              {/* HITK Badge */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300/60 bg-white/60 px-4 py-1.5 backdrop-blur-xl shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-600 uppercase font-[family-name:var(--font-google-sans)]">
                    HITK Student Portal
                  </span>
                </div>
              </div>

              {/* Mobile heading — "Student" + "Sign In" (pink serif) */}
              <div className="text-center mb-4">
                <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900 font-[family-name:var(--font-google-sans)] leading-[1.1]">
                  Student
                </h1>
                <h1 className="text-5xl font-extrabold text-pink-600 font-[family-name:var(--font-cinzel)] leading-[1.1]">
                  Sign In
                </h1>
                <p className="text-sm text-neutral-500 mt-3 mx-auto">
                  Sign in with your @heritageit.edu.in account.
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-300/60 bg-red-50/80 p-4 text-xs text-red-700 text-left backdrop-blur animate-fadeIn">
                  <svg className="h-4 w-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-bold block mb-0.5">Authentication Denied</span>
                    <span className="text-red-600/80">{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 py-4 px-5 text-sm font-bold text-neutral-800 shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer font-[family-name:var(--font-google-sans)] disabled:opacity-70"
              >
                {isSigningIn ? (
                  <span className="flex items-center gap-2 text-neutral-500">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting to Google...
                  </span>
                ) : (
                  <>
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="flex-1 text-left">Sign in with College Google Account</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-neutral-300/50" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">OR</span>
                <div className="flex-1 h-px bg-neutral-300/50" />
              </div>

              {/* Domain Restricted Notice */}
              <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-4 text-left backdrop-blur">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-neutral-700 tracking-wide uppercase mb-1">
                      Heritage Students Only
                    </span>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      This portal is restricted strictly to verified Heritage Institute students. Only Google accounts ending in{" "}
                      <strong className="text-pink-600">@heritageit.edu.in</strong>{" "}
                      are authorized. Personal accounts (@gmail.com) will be rejected automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom motto */}
              <div className="mt-10 ml-2">
                <div className="flex flex-col items-start gap-0.5">
                  <div className="w-px h-5 bg-neutral-400/40 mb-1" />
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">IDEAS</span>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">PEOPLE</span>
                  <span className="text-[9px] font-bold tracking-[0.25em] text-neutral-500 uppercase">IMPACT</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="relative z-30 py-4 sm:py-5 text-center">
        <div className="hidden md:block w-8 h-px bg-neutral-400/40 mx-auto mb-3" />
        <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium leading-relaxed">
          &copy; 2027 Hult Prize at Heritage Institute of Technology. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

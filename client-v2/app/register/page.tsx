"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { parseHeritageEmail, type ParsedStudentInfo } from "@/lib/heritage-parser";

/* ──────────────────────────────────────────────────────────────────────────────
   Floating Petal Component
   ────────────────────────────────────────────────────────────────────────────── */

interface PetalProps {
  style: React.CSSProperties;
  size: number;
  rot?: number;
}

function FloatingPetal({ style, size, rot = 45 }: PetalProps) {
  return (
    <div className="absolute pointer-events-none floating-petal" style={style}>
      <div
        className="rounded-full bg-pink-300/70"
        style={{
          width: size,
          height: size * 0.6,
          filter: "blur(0.5px)",
          transform: `rotate(${rot}deg)`,
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Register Page
   ────────────────────────────────────────────────────────────────────────────── */

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackEvent = searchParams.get("event");

  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    name: string;
    email: string;
    image?: string | null;
    info: ParsedStudentInfo;
  } | null>(null);

  // Load existing profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hult_student_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAuthenticatedUser(parsed);
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable randomized petal positions
  const petals = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      size: 6 + Math.random() * 10,
      rot: Math.floor(Math.random() * 360),
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

  const handleSignInWithEmail = (emailToUse?: string, nameToUse?: string) => {
    const rawEmail = (emailToUse || emailInput).trim().toLowerCase();
    const rawName = (nameToUse || nameInput).trim();

    if (!rawEmail) {
      setErrorMessage("Please enter your college email address.");
      return;
    }

    if (!rawEmail.endsWith("@heritageit.edu.in")) {
      setErrorMessage(
        "Access Restricted: Only official Heritage Institute college email addresses (@heritageit.edu.in) are permitted to sign in."
      );
      return;
    }

    setIsSigningIn(true);
    setErrorMessage(null);

    setTimeout(() => {
      const parsedInfo = parseHeritageEmail(rawEmail, rawName);
      const profile = {
        name: rawName || parsedInfo.fullName,
        email: rawEmail,
        image: null,
        info: parsedInfo,
      };

      try {
        localStorage.setItem("hult_student_profile", JSON.stringify(profile));
      } catch {}

      setAuthenticatedUser(profile);
      setIsSigningIn(false);

      if (callbackEvent) {
        router.push(`/events?event=${callbackEvent}`);
      }
    }, 600);
  };

  const handleQuickDemoSignIn = () => {
    handleSignInWithEmail("aritra.cse28@heritageit.edu.in", "Aritra Mondal");
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem("hult_student_profile");
    } catch {}
    setAuthenticatedUser(null);
    setEmailInput("");
    setNameInput("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans selection:bg-pink-500/30 selection:text-pink-900 flex flex-col">
      {/* Dynamic Keyframes for Petal Drifts */}
      <style>{`
        @keyframes petalFloat {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          15% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--tx, 40px), var(--ty, -150px), 0) rotate(var(--rot, 120deg));
          }
        }
        .floating-petal {
          animation: petalFloat var(--duration, 7s) ease-in-out infinite;
        }
      `}</style>

      {/* ================================================================
          LAYER 0: Full-bleed Background
          ================================================================ */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/hult-prize-hero/register/bg-register-desktop.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="hidden md:block object-cover object-center"
        />
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
      {mounted && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          {petals.map((p) => (
            <FloatingPetal key={p.id} style={p.style} size={p.size} rot={p.rot} />
          ))}
        </div>
      )}

      {/* ================================================================
          LAYER 3: Side Typography — Desktop Only
          ================================================================ */}
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

      <div className="hidden lg:flex fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1.5">
        <div className="w-px h-8 bg-neutral-400/50" />
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">A</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">BRIGHTER</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">TOMORROW</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase leading-relaxed text-center">TOGETHER</span>
        <div className="w-px h-8 bg-neutral-400/50" />
      </div>

      <div className="hidden lg:flex fixed left-6 xl:left-10 bottom-14 z-30 flex-col items-start gap-0.5">
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">IDEAS</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">PEOPLE</span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">IMPACT</span>
      </div>

      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="relative z-40 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4">
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

        <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-[family-name:var(--font-google-sans)]">
          <Link
            href="/events"
            className="text-sm font-semibold tracking-wide text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Events
          </Link>
          <Link
            href="/#about"
            className="text-sm font-semibold tracking-wide text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            About
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white/80 hover:bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:shadow-md backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </nav>

        <div className="flex md:hidden items-center">
          <Link
            href="/"
            className="p-2 rounded-full bg-white/60 border border-neutral-200/60 backdrop-blur-sm"
            aria-label="Home"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-700" />
          </Link>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-8">
        {authenticatedUser ? (
          /* ────────────────────────────────────────────────────────
             AUTHENTICATED VIEW
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-lg md:max-w-xl animate-fadeIn">
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-6 sm:p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-2xl font-extrabold text-white shadow-lg border-2 border-white/80 overflow-hidden">
                {authenticatedUser.name.charAt(0)}
              </div>

              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified HITK Scholar
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 text-center mb-0.5 font-[family-name:var(--font-google-sans)]">
                {authenticatedUser.name}
              </h2>
              <p className="text-xs text-neutral-500 text-center mb-5 font-mono font-medium tracking-tight">
                {authenticatedUser.email}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6 font-sans">
                <div className="rounded-2xl border border-neutral-200/60 bg-white/60 p-3.5 backdrop-blur">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-neutral-400 mb-1">
                    Department
                  </span>
                  <span className="text-sm font-bold text-neutral-800 block font-[family-name:var(--font-google-sans)]">
                    {authenticatedUser.info.branchName}
                  </span>
                </div>
                <div className="rounded-2xl border border-neutral-200/60 bg-white/60 p-3.5 backdrop-blur">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-neutral-400 mb-1">
                    Year of Study
                  </span>
                  <span className="text-sm font-bold text-neutral-800 block font-[family-name:var(--font-google-sans)]">
                    {authenticatedUser.info.academicYear}
                  </span>
                  <span className="inline-block mt-1.5 rounded-md bg-pink-100 border border-pink-200 px-2 py-0.5 text-[9px] font-bold text-pink-600">
                    {authenticatedUser.info.batch}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full font-sans text-xs">
                <Link
                  href={callbackEvent ? `/events?event=${callbackEvent}` : "/events"}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#e60067] to-[#ff007f] hover:from-[#d6005f] hover:to-[#eb0075] px-4 py-3 font-bold text-white shadow-md shadow-[#e60067]/30 transition-all text-center flex items-center justify-center gap-1.5 font-[family-name:var(--font-google-sans)]"
                >
                  <span>{callbackEvent ? "Continue to Event Studio" : "View Events Catalog"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/"
                  className="w-full rounded-2xl border border-neutral-300 bg-white/80 hover:bg-white px-4 py-3 font-semibold text-neutral-700 transition-all text-center font-[family-name:var(--font-google-sans)]"
                >
                  Return to Homepage
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="sm:col-span-2 w-full rounded-2xl border border-red-200 bg-red-50/80 hover:bg-red-100 px-4 py-2.5 font-semibold text-red-600 transition-all cursor-pointer text-center font-[family-name:var(--font-google-sans)]"
                >
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────
             SIGN-IN VIEW
             ──────────────────────────────────────────────────────── */
          <div className="w-full max-w-[540px] animate-fadeIn">
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 sm:p-8 lg:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl text-center">
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300/60 bg-white/70 px-4 py-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-neutral-600 uppercase font-[family-name:var(--font-google-sans)]">
                    HITK Student Portal
                  </span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 font-[family-name:var(--font-google-sans)] leading-tight mb-2">
                Student Sign In
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mb-6">
                Sign in with your official Heritage Institute account.
              </p>

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

              {/* Email Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSignInWithEmail();
                }}
                className="space-y-3.5 text-left font-sans text-xs mb-5"
              >
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">
                    College Google Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aritra.cse28@heritageit.edu.in"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none focus:border-[#e60067] focus:ring-2 focus:ring-[#e60067]/20 transition-all font-mono text-xs sm:text-sm shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">
                    Full Student Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aritra Mondal"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-neutral-900 placeholder-neutral-400 outline-none focus:border-[#e60067] focus:ring-2 focus:ring-[#e60067]/20 transition-all font-medium text-xs sm:text-sm shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#e60067] to-[#ff007f] py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-[#e60067]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 font-[family-name:var(--font-google-sans)] disabled:opacity-70"
                >
                  {isSigningIn ? (
                    <span>Verifying Heritage Scholar...</span>
                  ) : (
                    <>
                      <span>Verify & Access Student Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Demo Fast Sign In */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-neutral-300/60" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase font-mono">
                  OR FAST DEMO
                </span>
                <div className="flex-1 h-px bg-neutral-300/60" />
              </div>

              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-300/80 py-3 px-5 text-xs font-bold text-neutral-800 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer font-[family-name:var(--font-google-sans)]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>1-Click Sign In as Heritage Scholar (Demo)</span>
              </button>

              <div className="mt-6 rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-3.5 text-left backdrop-blur">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-bold text-neutral-700 mb-0.5">
                      Heritage College Domain Restriction
                    </span>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Only students with official <strong className="text-pink-600">@heritageit.edu.in</strong> email accounts are eligible to participate in Hult Prize OnCampus 2027.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcecef] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-200 border-t-[#e60067]" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}


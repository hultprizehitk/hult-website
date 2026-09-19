"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import SiteHeader from "@/components/SiteHeader";
import { parseHeritageEmail } from "@/lib/heritage-parser";

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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans text-white selection:bg-[#f20089] selection:text-white flex flex-col justify-between">
      {/* 
        ========================================================================
        WebGL Aurora Animated Background (Fluid Pink & Deep Purple Swirls)
        ========================================================================
      */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 18,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        {/* Soft atmospheric vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />
      </div>

      <SiteHeader />

      {/* Main Authentication Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="w-full max-w-xl sm:max-w-2xl">
          {/* Glassmorphic Auth Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-6 sm:p-10 md:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-all duration-500 text-center">
            {/* Top Iridescent Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Ambient Aurora Glow Spheres behind Glass */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#f20089]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-900/30 blur-3xl" />

            {/* IF CURRENTLY AUTHENTICATED */}
            {status === "authenticated" && session?.user ? (
              <div className="relative z-10 py-2 animate-fadeIn font-sans">
                {/* Avatar with Glow Ring */}
                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#f20089] to-purple-600 text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(242,0,137,0.6)] border-2 border-white/40 font-[family-name:var(--font-google-sans)] overflow-hidden">
                  {session.user.image ? (
                    <img src={session.user.image} alt={session.user.name || "Student"} className="h-full w-full object-cover" />
                  ) : (
                    studentInfo?.firstName?.charAt(0) || "H"
                  )}
                </div>

                {/* Verified Pills: Student Status + Admin Clearance */}
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Verified HITK Scholar</span>
                  </div>
                  {isAdmin && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f20089]/50 bg-[#f20089]/20 px-3.5 py-1 text-[11px] font-bold text-pink-300 uppercase tracking-widest shadow-sm">
                      <span>{adminBadgeLabel} Clearance</span>
                    </div>
                  )}
                </div>

                {/* Student Name */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] mb-1">
                  {studentInfo?.fullName || (session.user.email ? parseHeritageEmail(session.user.email).fullName : "") || session.user.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mb-5 font-mono font-medium tracking-tight">
                  {session.user.email}
                </p>

                {/* Email Delivery Tip Notice */}
                <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left backdrop-blur-xl">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[9px] font-bold tracking-widest text-amber-400 uppercase border border-amber-500/40 bg-amber-500/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                      EMAIL
                    </span>
                    <div className="text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-bold text-amber-300 block mb-0.5">Confirmation Email Sent!</span>
                      We sent your welcome email. If you do not see it in your Inbox, please check your <strong className="text-white">Spam / Junk folder</strong> and mark it as <strong className="text-amber-300 font-bold">"Not Spam"</strong>.
                    </div>
                  </div>
                </div>

                {/* Student Digital ID Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                  {/* Branch / Department Tile */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <span className="block text-[10px] uppercase font-extrabold tracking-wider text-white/50 mb-1">
                      Department / Branch
                    </span>
                    <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                      {studentInfo?.branchName || "General Engineering"}
                    </span>
                    {studentInfo?.branchCode && (
                      <span className="inline-block mt-2 rounded-md bg-[#f20089]/20 border border-[#f20089]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f20089]">
                        Code: {studentInfo.branchCode}
                      </span>
                    )}
                  </div>

                  {/* Current Year of Study & Passing Year Tile */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <span className="block text-[10px] uppercase font-extrabold tracking-wider text-white/50 mb-1">
                      Current Year of Study
                    </span>
                    <span className="text-sm font-bold text-white block leading-snug font-[family-name:var(--font-google-sans)]">
                      {studentInfo?.academicYear || "3rd Year"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        {studentInfo?.batch || "Class of 2028"}
                      </span>
                      <span className="rounded-md bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
                        Passing: {studentInfo?.passingYear || "2028"}
                      </span>
                    </div>
                  </div>

                  {/* Campus Affiliation */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] uppercase font-extrabold tracking-wider text-white/50 mb-0.5">
                          Institution
                        </span>
                        <span className="text-xs font-semibold text-white/90">
                          Heritage Institute of Technology, Kolkata
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        ● Eligible 2027
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                  {isAdmin && (
                    <Link
                      href="/portal"
                      className="w-full rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/40 transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center gap-1.5"
                    >
                      <span>{adminBadgeLabel} CMS →</span>
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center"
                  >
                    Homepage →
                  </Link>
                  <Link
                    href="/events"
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-google-sans)] flex items-center justify-center"
                  >
                    View Events
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/register" })}
                    className="w-full rounded-2xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-5 py-3 text-xs sm:text-sm font-semibold text-red-300 transition-all cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center justify-center"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* GOOGLE ONLY AUTHENTICATION VIEW */
              <div className="relative z-10 py-2 animate-fadeIn">

                {/* College Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 backdrop-blur-xl mb-6 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#f20089] animate-pulse" />
                  <span className="text-xs font-semibold tracking-[0.2em] text-white/90 uppercase font-[family-name:var(--font-google-sans)]">
                    HITK Student Portal
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-[family-name:var(--font-google-sans)]">
                  Student Sign In
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-sm mx-auto mb-8 font-sans">
                  Sign in with your @heritageit.edu.in account.
                </p>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-red-500/40 bg-red-950/50 p-4 text-xs sm:text-sm text-red-200 text-left backdrop-blur-xl animate-fadeIn">
                    <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <span className="font-bold block mb-0.5">Authentication Denied</span>
                      <span className="text-white/80">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3.5 rounded-2xl bg-white hover:bg-neutral-100 py-4 px-6 text-sm font-extrabold text-neutral-900 shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-[family-name:var(--font-google-sans)] disabled:opacity-70"
                >
                  {isSigningIn ? (
                    <span className="flex items-center gap-2 text-neutral-700">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Redirecting to Google...
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
                      <span>Sign In with College Google Account</span>
                    </>
                  )}
                </button>

                {/* Domain Policy Notice */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span>Domain Restricted Access</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    This competition platform is restricted strictly to verified Heritage Institute students. Only Google accounts ending in{" "}
                    <strong className="text-[#f20089]">@heritageit.edu.in</strong> are authorized. Personal accounts (@gmail.com) will be rejected automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Footer Credits */}
      <footer className="relative z-20 py-4 text-center text-[11px] text-white/60">
        © 2027 Hult Prize at Heritage Institute of Technology. All rights reserved.
      </footer>
    </div>
  );
}

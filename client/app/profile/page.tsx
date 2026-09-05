"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import { parseHeritageEmail } from "@/lib/heritage-parser";

export default function StudentProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is unauthenticated, redirect to registration/login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/register");
    }
  }, [status, router]);

  const studentInfo = session?.user?.email
    ? parseHeritageEmail(session.user.email, session.user.name)
    : null;

  const userRole = (session?.user as { role?: string })?.role;
  const isMasterAdmin = userRole === "master_admin";
  const isLeadAdmin = userRole === "lead_admin";
  const isJuniorAdmin = userRole === "junior_admin";
  const isAdmin = isMasterAdmin || isLeadAdmin || isJuniorAdmin;

  const adminBadgeLabel = isMasterAdmin
    ? "👑 Master Admin"
    : isLeadAdmin
    ? "⭐ Lead Admin"
    : isJuniorAdmin
    ? "🛡️ Junior Admin"
    : "🛡️ Admin";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans text-white selection:bg-[#f20089] selection:text-white flex flex-col justify-between">
      {/* WebGL Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <AnimatedGradient
          config={{
            preset: "Aurora",
            speed: 18,
          }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/85" />
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-google-sans)] bg-transparent border-none">
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
              {isAdmin && (
                <Link
                  href="/portal"
                  className="rounded-full bg-[#f20089]/20 hover:bg-[#f20089]/35 border border-[#f20089]/50 px-3 py-1.5 text-xs font-bold text-pink-300 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>{adminBadgeLabel} CMS</span>
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {session.user.name?.split(" ")[0] || "Student"}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/register" })}
                className="rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-[#f20089]/40 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Right Bar */}
        <div className="flex md:hidden items-center gap-2">
          {status === "authenticated" ? (
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <Link
                  href="/portal"
                  className="rounded-full bg-[#f20089]/30 border border-[#f20089]/60 px-2.5 py-1 text-[11px] font-bold text-pink-200"
                >
                  👑 CMS
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/register" })}
                className="rounded-full bg-white/[0.08] border border-white/20 px-3 py-1.5 text-[11px] font-bold text-white shadow-md active:scale-95 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md active:scale-95"
            >
              Sign In
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
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Home
          </Link>
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
        </div>
      )}

      {/* Main Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg">
          {/* Glassmorphic Auth Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-8 sm:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-all duration-500 text-center">
            {/* Top Iridescent Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Ambient Aurora Glow Spheres behind Glass */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#f20089]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-900/30 blur-3xl" />

            {status === "loading" ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="h-14 w-14 rounded-full border-2 border-[#f20089] border-t-transparent animate-spin" />
                <p className="text-xs font-medium text-white/60 uppercase tracking-widest font-mono">
                  Loading Student Profile...
                </p>
              </div>
            ) : status === "authenticated" && session?.user ? (
              <div className="relative z-10 py-2 animate-fadeIn font-sans">
                {/* Avatar with Glow Ring */}
                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#f20089] to-purple-600 text-3xl font-extrabold text-white shadow-[0_0_35px_rgba(242,0,137,0.6)] border-2 border-white/40 font-[family-name:var(--font-google-sans)] overflow-hidden">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Student"}
                      className="h-full w-full object-cover"
                    />
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
                  {studentInfo?.fullName || session.user.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mb-6 font-mono font-medium tracking-tight">
                  {session.user.email}
                </p>

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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {isAdmin && (
                    <Link
                      href="/portal"
                      className="w-full sm:w-auto rounded-full bg-[#f20089] hover:bg-[#d8007a] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/40 transition-all hover:scale-105 font-[family-name:var(--font-google-sans)] flex items-center justify-center gap-1.5"
                    >
                      <span>{adminBadgeLabel} CMS →</span>
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="w-full sm:w-auto rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/15 px-6 py-3 text-xs sm:text-sm font-semibold text-white transition-all font-[family-name:var(--font-google-sans)]"
                  >
                    Go to Homepage →
                  </Link>
                  <Link
                    href="/events"
                    className="w-full sm:w-auto rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/15 px-6 py-3 text-xs sm:text-sm font-semibold text-white transition-all font-[family-name:var(--font-google-sans)]"
                  >
                    View Events
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/register" })}
                    className="w-full sm:w-auto rounded-full border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-5 py-3 text-xs sm:text-sm font-semibold text-red-300 transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/40 font-mono">
        © 2026-2027 Hult Prize at Heritage Institute of Technology • Student Portal
      </footer>
    </div>
  );
}

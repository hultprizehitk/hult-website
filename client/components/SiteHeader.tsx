"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface SiteHeaderProps {
  className?: string;
  transparentUntilScroll?: boolean;
  transparent?: boolean;
  theme?: "dark" | "light";
  isLandingRevealed?: boolean;
}

export default function SiteHeader({
  className = "",
  transparentUntilScroll = false,
  transparent = false,
  theme = "dark",
  isLandingRevealed = true,
}: SiteHeaderProps) {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!transparentUntilScroll) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparentUntilScroll]);

  const headerBgClass = transparent
    ? "bg-transparent border-none py-3.5"
    : transparentUntilScroll
      ? isScrolled
        ? "bg-black/75 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3"
        : "bg-transparent border-none py-3.5"
      : "bg-black/75 backdrop-blur-xl border-b border-white/10 shadow-lg py-3";

  const visibilityClass = isLandingRevealed
    ? "opacity-100 translate-y-0"
    : "opacity-0 -translate-y-4 pointer-events-none";

  const userRole = (session?.user as { role?: string })?.role || "";
  const isAdmin = ["junior_admin", "lead_admin", "master_admin"].includes(userRole);

  return (
    <>
      <header
        style={{ top: "var(--banner-height, 0px)" }}
        className={`fixed inset-x-0 z-50 flex w-full items-center justify-between px-4 sm:px-6 md:px-8 transition-all duration-300 font-[family-name:var(--font-google-sans)] ${headerBgClass} ${visibilityClass} ${className}`}
      >
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
            href="/"
            className={`text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 ${theme === "light"
                ? "text-[#2b161f]/85 hover:text-neutral-950"
                : "text-white/85 drop-shadow hover:text-white"
              }`}
          >
            Home
          </Link>

          <a
            href="#about"
            className={`text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 ${theme === "light"
                ? "text-[#2b161f]/85 hover:text-neutral-950"
                : "text-white/85 drop-shadow hover:text-white"
              }`}
          >
            About
          </a>
          <Link
            href="/events"
            className={`text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 ${theme === "light"
                ? "text-[#2b161f]/85 hover:text-neutral-950"
                : "text-white/85 drop-shadow hover:text-white"
              }`}
          >
            Events
          </Link>

          <Link
            href="/team"
            className={`text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 ${theme === "light"
                ? "text-[#2b161f]/85 hover:text-neutral-950"
                : "text-white/85 drop-shadow hover:text-white"
              }`}
          >
            Team
          </Link>



          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 px-3 py-1.5 text-xs font-mono font-bold text-neutral-200 hover:text-white transition-all shadow-sm hover:scale-[1.02]"
                >
                  <span>
                    {userRole === "master_admin"
                      ? "Master Admin CMS"
                      : userRole === "lead_admin"
                        ? "Lead Admin CMS"
                        : "Junior Admin CMS"}
                  </span>
                </Link>
              )}
              <Link
                href="/profile"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm hover:scale-[1.02] transition-all ${theme === "light"
                    ? "border-[#2b161f]/20 bg-[#2b161f]/5 hover:bg-[#2b161f]/10 text-[#2b161f]"
                    : "border-white/20 bg-white/10 hover:bg-white/15 text-white"
                  }`}
                title="View User Profile"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {session.user.name?.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className={`text-xs font-semibold transition-colors cursor-pointer ${theme === "light"
                    ? "text-[#2b161f]/70 hover:text-neutral-950"
                    : "text-white/70 hover:text-white"
                  }`}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-neutral-900 hover:bg-neutral-800 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-neutral-900/20 border border-neutral-700 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <span>Register Now</span>
              <span>→</span>
            </Link>
          )}
        </nav>

        {/* Mobile Right Bar: Register / User + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <Link
                  href="/portal"
                  className="rounded-full bg-neutral-800 border border-neutral-700 px-2.5 py-1 text-[10px] font-mono font-bold text-neutral-200 uppercase tracking-wider"
                >
                  Admin CMS
                </Link>
              )}
              <Link
                href="/profile"
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide shadow-md active:scale-95 ${theme === "light"
                    ? "border-[#2b161f]/20 bg-[#2b161f]/5 text-[#2b161f]"
                    : "border-white/20 bg-white/[0.1] text-white"
                  }`}
              >
                {session.user.name?.split(" ")[0]}
              </Link>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-neutral-900 hover:bg-neutral-800 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md shadow-neutral-900/20 border border-neutral-700 active:scale-95"
            >
              Register
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${theme === "light"
                ? "bg-black/[0.05] hover:bg-black/[0.1] border-black/15 text-[#2b161f]"
                : "bg-white/[0.08] hover:bg-white/[0.15] border-white/20 text-white"
              }`}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{ top: "calc(var(--banner-height, 0px) + 52px)" }}
          className="fixed inset-x-0 z-40 md:hidden bg-black/95 backdrop-blur-3xl border-b border-white/15 px-6 py-6 shadow-2xl flex flex-col gap-4 font-[family-name:var(--font-google-sans)] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
          >
            Events Calendar
          </Link>
          <Link
            href="/team"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
          >
            Organizing Team
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
          >
            Team Registration
          </Link>
          {status === "authenticated" && (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
              >
                Student Profile & Pass
              </Link>
              {isAdmin && (
                <Link
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-neutral-300 hover:text-white py-2 border-b border-white/5 transition-colors"
                >
                  Admin CMS Portal
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="text-left text-base font-semibold text-red-400 py-2 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

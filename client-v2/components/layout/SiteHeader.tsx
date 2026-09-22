"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface SiteHeaderProps {
  isVisible?: boolean;
  transparent?: boolean;
  theme?: "light" | "dark";
}

export default function SiteHeader({
  isVisible = true,
  transparent = true,
  theme = "dark",
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLight = theme === "light";

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-500 font-[family-name:var(--font-google-sans)] ${
          transparent
            ? "bg-transparent border-none"
            : isLight
            ? "bg-white/80 backdrop-blur-md border-b border-black/5"
            : "bg-black/60 backdrop-blur-md border-b border-white/10"
        } ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
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

        <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-[family-name:var(--font-google-sans)]">
          <Link
            href="/#about"
            className={`text-xs sm:text-sm font-semibold tracking-wide drop-shadow transition-colors duration-200 ${
              isLight ? "text-[#2b161f]/85 hover:text-[#f20089]" : "text-white/85 hover:text-white"
            }`}
          >
            About
          </Link>
          <Link
            href="/events"
            className={`text-xs sm:text-sm font-semibold tracking-wide drop-shadow transition-colors duration-200 ${
              isLight ? "text-[#2b161f]/85 hover:text-[#f20089]" : "text-white/85 hover:text-white"
            }`}
          >
            Events
          </Link>
          <Link
            href="/#about"
            className={`text-xs sm:text-sm font-semibold tracking-wide drop-shadow transition-colors duration-200 ${
              isLight ? "text-[#2b161f]/85 hover:text-[#f20089]" : "text-white/85 hover:text-white"
            }`}
          >
            Mission
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white shadow-lg shadow-[#f20089]/40 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
          >
            Register Now
          </Link>
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/register"
            className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md shadow-[#f20089]/40 active:scale-95"
          >
            Register
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              isLight
                ? "bg-black/[0.05] hover:bg-black/[0.1] border-black/15 text-[#2b161f]"
                : "bg-white/[0.08] hover:bg-white/[0.15] border-white/20 text-white"
            }`}
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
            Events Calendar
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Mission & Narrative
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 text-center rounded-full bg-[#f20089] py-3 text-sm font-bold text-white shadow-lg shadow-[#f20089]/40"
          >
            Register for OnCampus 2027
          </Link>
        </div>
      )}
    </>
  );
}

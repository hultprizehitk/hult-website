"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface SiteHeaderProps {
  className?: string;
}

export default function SiteHeader({ className = "" }: SiteHeaderProps) {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-google-sans)] bg-black/60 backdrop-blur-md border-b border-white/10 ${className}`}
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
          <div className="relative h-9 sm:h-10 w-9 sm:w-10 shrink-0">
            <Image
              src="/assets/bento/heritage-h-emblem.png"
              alt="Heritage 3D H Emblem"
              width={40}
              height={40}
              unoptimized
              className="object-contain drop-shadow-[0_6px_15px_rgba(242,0,137,0.6)] hover:scale-110 transition-transform duration-300"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-[1.02] transition-all"
                title="View User Profile"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#f20089]" />
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

        {/* Mobile Right Bar: Register / User + Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-1.5">
              {["junior_admin", "lead_admin", "master_admin"].includes(
                (session.user as { role?: string })?.role || ""
              ) && (
                <Link
                  href="/portal"
                  className="rounded-full bg-[#f20089]/20 border border-[#f20089]/50 px-2.5 py-1 text-[10px] font-mono font-bold text-pink-200 uppercase tracking-wider"
                >
                  Admin CMS
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
        <div className="fixed inset-x-0 top-[52px] z-40 md:hidden bg-black/95 backdrop-blur-3xl border-b border-white/15 px-6 py-6 shadow-2xl flex flex-col gap-4 font-[family-name:var(--font-google-sans)] animate-in fade-in slide-in-from-top-2 duration-200">
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
            href="/team"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-semibold text-white/90 hover:text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Team
          </Link>
          {status === "authenticated" && (
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
          )}
        </div>
      )}
    </>
  );
}

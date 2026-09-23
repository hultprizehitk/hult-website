"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ArrowRight, Menu, X } from "lucide-react";

interface SiteHeaderProps {
  className?: string;
  transparentUntilScroll?: boolean;
  transparent?: boolean;
  theme?: "dark" | "light";
  isLandingRevealed?: boolean;
}

export default function SiteHeader({
  className = "",
}: SiteHeaderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "Student";

  return (
    <>
      {/* Top Viewport Scrim Gradient — Black at top fading to transparent at bottom */}
      <div
        className="pointer-events-none fixed top-0 inset-x-0 h-20 sm:h-24 md:h-28 z-40"
        style={{
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 65%, transparent 100%)",
        }}
      />

      <header
        style={{ top: "var(--banner-height, 0px)" }}
        className={`fixed inset-x-0 z-50 flex w-full items-center justify-between px-6 sm:px-10 md:px-14 py-4 sm:py-5 bg-transparent border-none text-white select-none font-[family-name:var(--font-google-sans)] pointer-events-auto ${className}`}
      >
        {/* Brand Lockup Left */}
        <div className="flex items-center gap-3 sm:gap-3.5 select-none">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 sm:h-9 md:h-10 w-[48px] sm:w-[54px] md:w-[60px] transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/ef-hult-prize-logo.png"
                alt="EF Hult Prize Logo"
                fill
                sizes="(max-width: 640px) 48px, 60px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Thin Hairline Divider */}
          <div className="h-6 w-px bg-white/25" />

          {/* Heritage Institute of Technology 25 Years Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative aspect-[1024/895] h-8 sm:h-9 md:h-10 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/hitk-25-logo.png"
                alt="Heritage Institute of Technology 25 Years Logo"
                fill
                sizes="(max-width: 640px) 42px, 52px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation Links Center */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium select-none text-white/85">
          <Link
            href="/"
            className={`relative transition-colors duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-white hover:after:w-full after:transition-all after:duration-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] ${pathname === "/" ? "text-white font-semibold after:w-full" : "text-white/80 after:w-0"
              }`}
          >
            Home
          </Link>
          <Link
            href="/events"
            className={`relative transition-colors duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-white hover:after:w-full after:transition-all after:duration-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] ${pathname.startsWith("/events") ? "text-white font-semibold after:w-full" : "text-white/80 after:w-0"
              }`}
          >
            Events
          </Link>
          {pathname.startsWith("/team") && (
            <Link
              href="/team"
              className="relative text-white font-semibold after:w-full transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            >
              Team
            </Link>
          )}
        </nav>

        {/* Right CTA Group */}
        <div className="flex items-center gap-3 sm:gap-4 select-none">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white border border-white/25 shadow-md transition-all duration-200 hover:border-white/50"
                title="View Student Profile"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[100px] sm:max-w-[130px] truncate">{firstName}</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-white/70 hover:text-white transition-colors duration-200 px-2 py-1 cursor-pointer font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-full bg-white hover:bg-neutral-100 px-5 py-2 text-xs font-semibold text-neutral-950 shadow-md shadow-black/30 border border-white/80 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Register Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white md:hidden cursor-pointer transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{ top: "calc(var(--banner-height, 0px) + 64px)" }}
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
          {pathname.startsWith("/team") && (
            <Link
              href="/team"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
            >
              Organizing Team
            </Link>
          )}
          {status === "authenticated" ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
              >
                Student Profile &amp; Pass
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="text-left text-base font-semibold text-rose-400 py-2 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-white/90 hover:text-white py-2 border-b border-white/5 transition-colors"
            >
              Student Portal &amp; Registration
            </Link>
          )}
        </div>
      )}
    </>
  );
}

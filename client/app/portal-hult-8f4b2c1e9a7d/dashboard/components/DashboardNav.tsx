"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface DashboardNavProps {
  userEmail: string;
  isSuperAdmin: boolean;
}

export default function DashboardNav({ userEmail, isSuperAdmin }: DashboardNavProps) {
  const pathname = usePathname();

  const isEvents =
    pathname === "/portal-hult-8f4b2c1e9a7d/dashboard" ||
    pathname === "/portal-hult-8f4b2c1e9a7d/dashboard/";
  const isStudents = pathname?.includes("/dashboard/student");
  const isAdmins = pathname?.includes("/dashboard/admin") || pathname?.includes("/dashboard/user");

  return (
    <>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/75 backdrop-blur-2xl px-4 sm:px-6 py-4 font-[family-name:var(--font-google-sans)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image
              src="/Hult-Prize.png"
              alt="Hult Prize Logo"
              fill
              sizes="48px"
              className="object-contain drop-shadow"
            />
          </Link>
          <div className="h-5 w-[1px] bg-white/20" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white">
            ADMIN <span className="text-[#f20089]">CMS</span>
          </span>
          <span className="hidden sm:inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
            Stealth Mode
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail && (
            <span className="hidden md:inline-block text-xs text-white/60">
              Logged in as <span className="text-white font-medium">{userEmail}</span>
            </span>
          )}
          <Link
            href="/profile"
            className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <span>User Profile</span>
          </Link>
          <Link
            href="/"
            className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white transition-all whitespace-nowrap"
          >
            ← Back to Site
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/portal-hult-8f4b2c1e9a7d" })}
            className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-3.5 sm:px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#f20089]/40 transition-all cursor-pointer whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav
          aria-label="Dashboard Tabs"
          className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto"
        >
          <Link
            href="/portal-hult-8f4b2c1e9a7d/dashboard"
            className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
              isEvents
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            📅 Events Manager
          </Link>

          <Link
            href="/portal-hult-8f4b2c1e9a7d/dashboard/students"
            className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
              isStudents
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Users
          </Link>

          {isSuperAdmin && (
            <Link
              href="/portal-hult-8f4b2c1e9a7d/dashboard/admins"
              className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
                isAdmins
                  ? "bg-gradient-to-r from-amber-500 to-[#f20089] text-white shadow-lg shadow-amber-500/20"
                  : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}

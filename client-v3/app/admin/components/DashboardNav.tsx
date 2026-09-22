"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface DashboardNavProps {
  userEmail: string;
  isSuperAdmin: boolean;
}

export default function DashboardNav({ userEmail, isSuperAdmin }: DashboardNavProps) {
  const pathname = usePathname();
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSub = window.location.host.startsWith("admin.");
      setIsSubdomain(isSub);
      if (isSub) {
        setMainSiteUrl(`${window.location.protocol}//${window.location.host.replace(/^admin\./, "")}`);
      } else {
        setMainSiteUrl("/");
      }
    }
  }, []);

  const isLiveEvent =
    pathname?.includes("/live-event") || pathname?.includes("/live");
  const isStudents =
    pathname?.includes("/students") || pathname?.includes("/student");
  const isTeams = pathname?.includes("/teams");
  const isAdmins =
    pathname?.includes("/admins") || pathname?.includes("/admin/admin");
  const isEvents = !isLiveEvent && !isStudents && !isTeams && !isAdmins;

  const getHref = (path: string) => {
    if (isSubdomain) {
      return path;
    }
    return path === "/" ? "/admin" : `/admin${path}`;
  };

  return (
    <>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#08080a] px-4 sm:px-6 py-3.5 shadow-md font-[family-name:var(--font-google-sans)]">
        <div className="flex items-center gap-3">
          <Link href={isSubdomain ? "/" : "/admin"} className="relative aspect-[1080/659] h-7 sm:h-8">
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
            ADMIN <span className="text-neutral-400">CMS</span>
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
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs bg-[#16161d] border-white/15 hover:bg-[#202028]">
            <Link href={isSubdomain ? `${mainSiteUrl}/profile` : "/profile"}>
              User Profile
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-xs hidden sm:inline-flex hover:bg-[#16161d]">
            <Link href={mainSiteUrl}>
              ← Back to Site
            </Link>
          </Button>
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: isSubdomain ? mainSiteUrl : "/" })}
            className="rounded-full text-xs"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav
          aria-label="Dashboard Tabs"
          className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto"
        >
          <Link
            href={getHref("/")}
            className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
              isEvents
                ? "bg-white text-black shadow-lg shadow-white/15"
                : "bg-[#16161d] text-white/70 hover:text-white hover:bg-[#202028] border border-white/10"
            }`}
          >
            Events
          </Link>

          <Link
            href={getHref("/teams")}
            className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
              isTeams
                ? "bg-white text-black shadow-lg shadow-white/15"
                : "bg-[#16161d] text-white/70 hover:text-white hover:bg-[#202028] border border-white/10"
            }`}
          >
            Teams
          </Link>

          <Link
            href={getHref("/live-event")}
            className={`relative flex items-center gap-2 rounded-xl px-5 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
              isLiveEvent
                ? "bg-white text-black shadow-lg shadow-white/15"
                : "bg-[#16161d] text-white/70 hover:text-white hover:bg-[#202028] border border-white/10"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Event</span>
          </Link>

          <Link
            href={getHref("/students")}
            className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
              isStudents
                ? "bg-white text-black shadow-lg shadow-white/15"
                : "bg-[#16161d] text-white/70 hover:text-white hover:bg-[#202028] border border-white/10"
            }`}
          >
            Users
          </Link>

          {isSuperAdmin && (
            <Link
              href={getHref("/admins")}
              className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
                isAdmins
                  ? "bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-400/20"
                  : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
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

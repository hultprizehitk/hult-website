"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import { TEAM_SECTIONS, INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import type { TeamCategory, TeamMember } from "@/types";

export default function TeamPage() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | TeamCategory>("all");

  const cdMembers = INITIAL_TEAM_MEMBERS.filter((m) => m.category === "cd");
  const dcdMembers = INITIAL_TEAM_MEMBERS.filter((m) => m.category === "dcd");
  const eventMembers = INITIAL_TEAM_MEMBERS.filter((m) => m.category === "event_management");
  const workshopMembers = INITIAL_TEAM_MEMBERS.filter((m) => m.category === "workshop");
  const techMembers = INITIAL_TEAM_MEMBERS.filter((m) => m.category === "tech");
  const designMembers = INITIAL_TEAM_MEMBERS.filter((m) => m.category === "design");

  const filteredMembers =
    activeCategory === "all"
      ? INITIAL_TEAM_MEMBERS
      : INITIAL_TEAM_MEMBERS.filter((m) => m.category === activeCategory);

  const getTeamColor = (category: TeamCategory) => {
    switch (category) {
      case "cd":
        return {
          badge: "bg-gradient-to-r from-amber-500/20 to-[#f20089]/20 border-amber-500/40 text-amber-300",
          ring: "from-amber-400 via-[#f20089] to-purple-600",
          accent: "text-amber-300",
        };
      case "dcd":
        return {
          badge: "bg-sky-500/20 border-sky-500/40 text-sky-300",
          ring: "from-sky-400 via-blue-500 to-[#f20089]",
          accent: "text-sky-300",
        };
      case "event_management":
        return {
          badge: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
          ring: "from-emerald-400 to-teal-600",
          accent: "text-emerald-300",
        };
      case "workshop":
        return {
          badge: "bg-amber-500/20 border-amber-500/40 text-amber-300",
          ring: "from-amber-400 to-orange-600",
          accent: "text-amber-300",
        };
      case "tech":
        return {
          badge: "bg-sky-500/20 border-sky-500/40 text-sky-300",
          ring: "from-cyan-400 via-sky-500 to-indigo-600",
          accent: "text-sky-300",
        };
      case "design":
      default:
        return {
          badge: "bg-[#f20089]/20 border-[#f20089]/40 text-[#f20089]",
          ring: "from-[#f20089] via-pink-500 to-purple-600",
          accent: "text-[#f20089]",
        };
    }
  };

  const renderMemberCard = (member: TeamMember) => {
    const style = getTeamColor(member.category);
    const initials = member.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        key={member.id}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl transition-all duration-300 hover:border-[#f20089]/60 hover:bg-white/[0.06] hover:shadow-[0_20px_45px_rgba(242,0,137,0.18)] hover:-translate-y-1.5 flex flex-col justify-between"
      >
        {/* Top Iridescent Edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#f20089]/10 blur-2xl group-hover:bg-[#f20089]/20 transition-all" />

        <div className="relative z-10">
          {/* Avatar / Photo Frame */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-2xl p-[2px] bg-gradient-to-tr ${style.ring} shadow-md overflow-hidden`}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-2xl bg-neutral-950/90 flex items-center justify-center font-[family-name:var(--font-google-sans)] text-lg sm:text-xl font-black text-white">
                  {initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${style.badge}`}
              >
                {member.role}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-white truncate font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors">
                {member.name}
              </h4>
              <p className="text-[11px] text-white/60 truncate">
                {member.department}
              </p>
            </div>
          </div>

          {member.academicYear && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[11px] text-white/70 font-mono mb-3">
              <span>🎓</span>
              <span>{member.academicYear}</span>
            </div>
          )}

          {member.bio && (
            <p className="text-xs text-white/65 leading-relaxed mb-4 line-clamp-3 font-sans">
              {member.bio}
            </p>
          )}
        </div>

        {/* Social / Contact Links */}
        <div className="relative z-10 pt-3 border-t border-white/5 flex items-center gap-2">
          {member.socials?.linkedin && (
            <a
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} LinkedIn`}
              className="h-8 w-8 rounded-xl bg-white/[0.05] hover:bg-[#0077b5]/30 border border-white/10 hover:border-[#0077b5]/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
          )}

          {member.socials?.github && (
            <a
              href={member.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} GitHub`}
              className="h-8 w-8 rounded-xl bg-white/[0.05] hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
              </svg>
            </a>
          )}

          {member.socials?.instagram && (
            <a
              href={member.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} Instagram`}
              className="h-8 w-8 rounded-xl bg-white/[0.05] hover:bg-[#e1306c]/30 border border-white/10 hover:border-[#e1306c]/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          )}

          {member.socials?.email && (
            <a
              href={`mailto:${member.socials.email}`}
              aria-label={`Email ${member.name}`}
              className="h-8 w-8 rounded-xl bg-white/[0.05] hover:bg-[#f20089]/30 border border-white/10 hover:border-[#f20089]/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-[#f20089] selection:text-white overflow-x-hidden flex flex-col justify-between">
      {/* WebGL Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <AnimatedGradient
          config={{ preset: "Aurora", speed: 16 }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90" />
      </div>

      {/* Atmospheric Ambient Glow */}
      <div className="pointer-events-none fixed top-20 left-1/4 w-[600px] h-[350px] bg-[#f20089]/15 blur-[160px] rounded-full z-0" />
      <div className="pointer-events-none fixed bottom-10 right-10 w-[500px] h-[350px] bg-purple-900/20 blur-[150px] rounded-full z-0" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 transition-all duration-300 font-[family-name:var(--font-google-sans)] bg-black/40 backdrop-blur-2xl border-b border-white/10">
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
            className="text-xs sm:text-sm font-extrabold tracking-wide text-[#f20089] drop-shadow transition-colors duration-200"
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
                  className="inline-flex items-center gap-1 rounded-full border border-[#f20089]/60 bg-[#f20089]/25 hover:bg-[#f20089]/40 px-3 py-1.5 text-xs font-bold text-pink-300 hover:text-white transition-all shadow-sm hover:scale-105"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 transition-all"
                title="View User Profile"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {session.user.name?.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 py-1.5 text-xs sm:text-sm font-bold tracking-wide text-white shadow-md shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          {status === "authenticated" && session?.user ? (
            <Link
              href="/profile"
              className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-white border border-white/20"
            >
              {session.user.name?.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/register"
              className="rounded-full bg-[#f20089] px-3 py-1 text-xs font-bold text-white shadow-md"
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
          <Link
            href="/team"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-bold text-[#f20089] py-2 border-b border-white/5 transition-colors"
          >
            Organizing Committee
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f20089]/40 bg-[#f20089]/15 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-[#f20089] mb-4 shadow-[0_0_20px_rgba(242,0,137,0.3)]">
            Organizing Committee 2026-27
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-google-sans)] drop-shadow-lg mb-4">
            THE MINDS BEHIND{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-[#f20089]">
              HULT PRIZE
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans">
            The student innovators, coordinators, software engineers, and visual designers steering the world’s largest youth social entrepreneurship movement at Heritage Institute of Technology.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl max-w-xl mx-auto">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)]">
                6
              </div>
              <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                Teams
              </div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-xl sm:text-2xl font-black text-[#f20089] font-[family-name:var(--font-google-sans)]">
                $1M
              </div>
              <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                Global Prize
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-[family-name:var(--font-google-sans)]">
                HITK
              </div>
              <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                Chapter
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="sticky top-[61px] z-40 py-3 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 bg-black/60 backdrop-blur-xl border-y sm:border-none border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:justify-center">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                activeCategory === "all"
                  ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/40 scale-105"
                  : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
            >
              All Divisions ({INITIAL_TEAM_MEMBERS.length})
            </button>

            {TEAM_SECTIONS.map((sec) => {
              const count = INITIAL_TEAM_MEMBERS.filter((m) => m.category === sec.key).length;
              const isSelected = activeCategory === sec.key;

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveCategory(sec.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                    isSelected
                      ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/40 scale-105"
                      : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {sec.title} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Sections Layout */}
        <div className="space-y-16 sm:space-y-20">
          {/* SECTION 1 & 2: EXECUTIVE LEADERSHIP (CD & DCD) */}
          {(activeCategory === "all" || activeCategory === "cd" || activeCategory === "dcd") && (
            <section className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f20089]">
                    Executive Steering
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    Leadership & Directorship
                  </h2>
                </div>
                <span className="text-xs text-white/50 font-mono">
                  Campus Director & Deputy Campus Director
                </span>
              </div>

              {/* Spotlight Duo Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* Campus Director Card */}
                {(activeCategory === "all" || activeCategory === "cd") &&
                  cdMembers.map((cd) => (
                    <div
                      key={cd.id}
                      className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] via-white/[0.03] to-black/60 p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-amber-400 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] flex flex-col justify-between"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <span className="rounded-full bg-gradient-to-r from-amber-500/25 to-[#f20089]/25 border border-amber-500/40 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                            Campus Director • CD
                          </span>
                          <span className="text-[11px] text-amber-300/80 font-mono font-semibold">
                            Head of Chapter
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                          <div className="h-24 w-24 rounded-3xl p-[2px] bg-gradient-to-tr from-amber-400 via-[#f20089] to-purple-600 shadow-xl overflow-hidden shrink-0">
                            {cd.image ? (
                              <img
                                src={cd.image}
                                alt={cd.name}
                                className="h-full w-full rounded-3xl object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-3xl bg-neutral-950 flex items-center justify-center font-[family-name:var(--font-google-sans)] text-2xl font-black text-amber-300">
                                {cd.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                              {cd.name}
                            </h3>
                            <p className="text-xs text-white/80 font-medium">
                              {cd.department}
                            </p>
                            <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                              {cd.academicYear}
                            </p>
                          </div>
                        </div>

                        {cd.bio && (
                          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-6">
                            "{cd.bio}"
                          </p>
                        )}
                      </div>

                      {/* Socials */}
                      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-3">
                        {cd.socials?.linkedin && (
                          <a
                            href={cd.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-white/[0.05] hover:bg-[#0077b5]/30 border border-white/10 hover:border-[#0077b5]/50 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {cd.socials?.email && (
                          <a
                            href={`mailto:${cd.socials.email}`}
                            className="rounded-xl bg-white/[0.05] hover:bg-[#f20089]/30 border border-white/10 hover:border-[#f20089]/50 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                {/* Deputy Campus Director Card */}
                {(activeCategory === "all" || activeCategory === "dcd") &&
                  dcdMembers.map((dcd) => (
                    <div
                      key={dcd.id}
                      className="relative overflow-hidden rounded-[2.5rem] border border-sky-500/30 bg-gradient-to-b from-sky-500/[0.08] via-white/[0.03] to-black/60 p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-sky-400 hover:shadow-[0_20px_50px_rgba(56,189,248,0.15)] flex flex-col justify-between"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
                      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <span className="rounded-full bg-sky-500/20 border border-sky-500/40 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
                            Deputy Campus Director • DCD
                          </span>
                          <span className="text-[11px] text-sky-300/80 font-mono font-semibold">
                            Executive Co-Lead
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                          <div className="h-24 w-24 rounded-3xl p-[2px] bg-gradient-to-tr from-sky-400 via-blue-500 to-[#f20089] shadow-xl overflow-hidden shrink-0">
                            {dcd.image ? (
                              <img
                                src={dcd.image}
                                alt={dcd.name}
                                className="h-full w-full rounded-3xl object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-3xl bg-neutral-950 flex items-center justify-center font-[family-name:var(--font-google-sans)] text-2xl font-black text-sky-300">
                                {dcd.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                              {dcd.name}
                            </h3>
                            <p className="text-xs text-white/80 font-medium">
                              {dcd.department}
                            </p>
                            <p className="text-xs text-sky-300/80 font-mono mt-0.5">
                              {dcd.academicYear}
                            </p>
                          </div>
                        </div>

                        {dcd.bio && (
                          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-6">
                            "{dcd.bio}"
                          </p>
                        )}
                      </div>

                      {/* Socials */}
                      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-3">
                        {dcd.socials?.linkedin && (
                          <a
                            href={dcd.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-white/[0.05] hover:bg-[#0077b5]/30 border border-white/10 hover:border-[#0077b5]/50 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {dcd.socials?.email && (
                          <a
                            href={`mailto:${dcd.socials.email}`}
                            className="rounded-xl bg-white/[0.05] hover:bg-[#f20089]/30 border border-white/10 hover:border-[#f20089]/50 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* SECTION 3: EVENT MANAGEMENT TEAM */}
          {(activeCategory === "all" || activeCategory === "event_management") && (
            <section className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                    Operations & Logistics
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    Event Management Team
                  </h2>
                </div>
                <p className="text-xs text-white/50 max-w-sm">
                  Orchestrating OnCampus qualifiers, stage flow, venue protocols, and guest judge hospitality.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventMembers.map((member) => renderMemberCard(member))}
              </div>
            </section>
          )}

          {/* SECTION 4: WORKSHOP TEAM */}
          {(activeCategory === "all" || activeCategory === "workshop") && (
            <section className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                    Mentorship & Ideation
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    Workshop Team
                  </h2>
                </div>
                <p className="text-xs text-white/50 max-w-sm">
                  Curating founder bootcamps, speaker masterclasses, pitching clinics, and investor networking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {workshopMembers.map((member) => renderMemberCard(member))}
              </div>
            </section>
          )}

          {/* SECTION 5: TECH TEAM */}
          {(activeCategory === "all" || activeCategory === "tech") && (
            <section className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                    Engineering & Platforms
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    Tech Team
                  </h2>
                </div>
                <p className="text-xs text-white/50 max-w-sm">
                  Developing the official web application, participant portal, automated email parser, and admin CMS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {techMembers.map((member) => renderMemberCard(member))}
              </div>
            </section>
          )}

          {/* SECTION 6: DESIGN TEAM */}
          {(activeCategory === "all" || activeCategory === "design") && (
            <section className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f20089]">
                    Creative & Brand Media
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    Design Team
                  </h2>
                </div>
                <p className="text-xs text-white/50 max-w-sm">
                  Directing visual identity, motion graphics, stage visuals, social media creatives, and UI aesthetics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {designMembers.map((member) => renderMemberCard(member))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-xs text-white/50 font-sans border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Hult Prize HITK</span>
            <span className="text-white/30">•</span>
            <span>Organizing Committee Roster</span>
          </div>
          <p>© 2027 Heritage Institute of Technology Chapter. Built for global changemakers.</p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Building2, IdCard, Search } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import AnimatedGradient from "@/components/ui/animated-gradient";
import { TEAM_SECTIONS, INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import type { TeamCategory, TeamMember } from "@/types";

export default function TeamPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | TeamCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbMembers, setDbMembers] = useState<TeamMember[]>([]);

  React.useEffect(() => {
    fetch("/api/content?type=committee")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (Array.isArray(data.items) && data.items.length > 0) {
          const mapped: TeamMember[] = data.items.map((item: any) => ({
            id: item._id,
            slug: item.slug || item.title?.toLowerCase().replace(/\s+/g, "-"),
            name: item.title,
            role: item.subtitle,
            category: item.category as TeamCategory,
            department: item.description || "",
            image: item.image || "",
            socials: {
              linkedin: item.links?.linkedin || "",
              github: item.links?.github || "",
              email: item.links?.email || "",
            },
          }));
          setDbMembers(mapped);
        }
      })
      .catch((err) => console.warn("Notice: Using static team data fallback:", err));
  }, []);

  const baseMembers = dbMembers.length > 0 ? dbMembers : INITIAL_TEAM_MEMBERS;
  const members = searchQuery.trim()
    ? baseMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : baseMembers;

  const facultyMembers = members.filter((m) => m.category === "faculty_coordinator");
  const cdMembers = members.filter((m) => m.category === "cd");
  const dcdMembers = members.filter((m) => m.category === "dcd");
  const eventMembers = members.filter((m) => m.category === "event_management");
  const workshopMembers = members.filter((m) => m.category === "workshop");
  const techMembers = members.filter((m) => m.category === "tech");
  const designMembers = members.filter((m) => m.category === "design");

  const filteredMembers =
    activeCategory === "all"
      ? members
      : members.filter((m) => m.category === activeCategory);

  const getTeamColor = (category: TeamCategory) => {
    switch (category) {
      case "faculty_coordinator":
        return {
          badge: "bg-sky-500/20 border-sky-500/40 text-sky-300",
          ring: "from-sky-400 via-blue-500 to-indigo-600",
          accent: "text-sky-300",
        };
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
      case "workshop":
        return {
          badge: "bg-amber-500/20 border-amber-500/40 text-amber-300",
          ring: "from-amber-400 to-orange-600",
          accent: "text-amber-300",
        };
      case "event_management":
        return {
          badge: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
          ring: "from-emerald-400 to-teal-600",
          accent: "text-emerald-300",
        };
      case "social_pr":
        return {
          badge: "bg-pink-500/20 border-pink-500/40 text-pink-300",
          ring: "from-pink-500 via-rose-500 to-purple-600",
          accent: "text-pink-300",
        };
      case "photography":
        return {
          badge: "bg-violet-500/20 border-violet-500/40 text-violet-300",
          ring: "from-violet-500 via-purple-500 to-indigo-600",
          accent: "text-violet-300",
        };
      case "tech":
        return {
          badge: "bg-sky-500/20 border-sky-500/40 text-sky-300",
          ring: "from-cyan-400 via-sky-500 to-indigo-600",
          accent: "text-sky-300",
        };
      case "design":
        return {
          badge: "bg-[#f20089]/20 border-[#f20089]/40 text-[#f20089]",
          ring: "from-[#f20089] via-pink-500 to-purple-600",
          accent: "text-[#f20089]",
        };
      case "judges_support":
      default:
        return {
          badge: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
          ring: "from-teal-400 via-cyan-500 to-blue-600",
          accent: "text-cyan-300",
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
            {member.slug ? (
              <Link
                href={`/team/${member.slug}`}
                className={`relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-2xl p-[2px] bg-gradient-to-tr ${style.ring} shadow-md overflow-hidden hover:scale-105 transition-transform`}
                title={`View ${member.name}'s 3D ID Profile`}
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
              </Link>
            ) : (
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
            )}

            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${style.badge}`}
              >
                {member.role}
              </span>
              {member.slug ? (
                <Link
                  href={`/team/${member.slug}`}
                  className="block text-base sm:text-lg font-bold text-white truncate font-[family-name:var(--font-google-sans)] hover:text-[#f20089] transition-colors"
                >
                  {member.name}
                </Link>
              ) : (
                <h4 className="text-base sm:text-lg font-bold text-white truncate font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors">
                  {member.name}
                </h4>
              )}
              <p className="text-[11px] text-white/60 truncate">
                {member.department}
              </p>
            </div>
          </div>

          {member.academicYear && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[11px] text-white/70 font-mono mb-3">
              <GraduationCap className="h-3 w-3 text-pink-400" />
              <span>{member.academicYear}</span>
            </div>
          )}

          {member.bio && (
            <p className="text-xs text-white/65 leading-relaxed mb-3 line-clamp-3 font-sans">
              {member.bio}
            </p>
          )}

          {member.slug && (
            <div className="mb-3">
              <Link
                href={`/team/${member.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/25 px-3 py-1 text-[11px] font-bold text-pink-300 hover:text-white transition-all shadow-sm group/btn"
              >
                <IdCard className="h-3.5 w-3.5" />
                <span>View 3D ID Profile</span>
                <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
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

      <SiteHeader />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="relative mx-auto mb-4 h-24 w-24 flex items-center justify-center">
            <Image
              src="/assets/bento/team-podium.png"
              alt="3D Organizing Committee Team Podium"
              width={96}
              height={96}
              unoptimized
              className="object-contain drop-shadow-[0_10px_30px_rgba(242,0,137,0.5)] hover:scale-110 transition-transform duration-300"
            />
          </div>

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
                {TEAM_SECTIONS.filter((s) => s.key !== "cd" && s.key !== "dcd").length}
              </div>
              <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                Divisions
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

        {/* Interactive Search & Category Filter Bar */}
        <div className="sticky top-[61px] z-40 py-3 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 bg-black/60 backdrop-blur-xl border-y sm:border-none border-white/10 space-y-3">
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search committee member by name, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121216] border border-white/15 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f20089] transition-all"
            />
          </div>

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
              All Divisions {members.length > 0 ? `(${members.length})` : ""}
            </button>

            {TEAM_SECTIONS.map((sec) => {
              const count = members.filter((m) => m.category === sec.key).length;
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
                  {sec.title} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Sections Layout */}
        <div className="space-y-16 sm:space-y-20">
          {/* FACULTY MENTORSHIP & COORDINATION */}
          {(activeCategory === "all" || activeCategory === "faculty_coordinator") && facultyMembers.length > 0 && (
            <section className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                    Faculty Mentorship
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    Faculty Coordinator
                  </h2>
                </div>
                <span className="text-xs text-white/50 font-mono">
                  Heritage Institute of Technology
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {facultyMembers.map((fac) => (
                  <div
                    key={fac.id}
                    className="relative overflow-hidden rounded-[2.5rem] border border-sky-500/30 bg-gradient-to-b from-sky-500/[0.08] via-white/[0.03] to-black/60 p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-sky-400 hover:shadow-[0_20px_50px_rgba(56,189,248,0.15)] flex flex-col justify-between"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
                    <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <span className="rounded-full bg-gradient-to-r from-sky-500/25 to-blue-600/25 border border-sky-500/40 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
                          Faculty Coordinator
                        </span>
                        <span className="text-[11px] text-sky-300/80 font-mono font-semibold">
                          Assistant Professor, CSE
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                        {fac.slug ? (
                          <Link
                            href={`/team/${fac.slug}`}
                            className="h-24 w-24 rounded-3xl p-[2px] bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 shadow-xl overflow-hidden shrink-0 hover:scale-105 transition-transform"
                            title={`View ${fac.name}'s 3D ID Profile`}
                          >
                            {fac.image ? (
                              <img
                                src={fac.image}
                                alt={fac.name}
                                className="h-full w-full rounded-3xl object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-3xl bg-neutral-950 flex items-center justify-center font-[family-name:var(--font-google-sans)] text-2xl font-black text-sky-300">
                                JD
                              </div>
                            )}
                          </Link>
                        ) : (
                          <div className="h-24 w-24 rounded-3xl p-[2px] bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 shadow-xl overflow-hidden shrink-0">
                            {fac.image ? (
                              <img
                                src={fac.image}
                                alt={fac.name}
                                className="h-full w-full rounded-3xl object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-3xl bg-neutral-950 flex items-center justify-center font-[family-name:var(--font-google-sans)] text-2xl font-black text-sky-300">
                                JD
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          {fac.slug ? (
                            <Link
                              href={`/team/${fac.slug}`}
                              className="text-2xl font-black text-white hover:text-sky-300 transition-colors font-[family-name:var(--font-google-sans)] block"
                            >
                              {fac.name}
                            </Link>
                          ) : (
                            <h3 className="text-2xl font-black text-white font-[family-name:var(--font-google-sans)]">
                              {fac.name}
                            </h3>
                          )}
                          <p className="text-xs text-sky-300/80 font-medium">
                            {fac.department}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 px-3 py-0.5 text-[11px] text-sky-300 font-mono">
                            <Building2 className="h-3 w-3 text-sky-400" /> Faculty Mentor
                          </div>
                        </div>
                      </div>

                      {fac.bio && (
                        <p className="text-sm text-white/75 leading-relaxed mb-6 font-sans">
                          {fac.bio}
                        </p>
                      )}

                      {fac.slug && (
                        <div className="mb-6">
                          <Link
                            href={`/team/${fac.slug}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/25 px-4 py-2 text-xs font-bold text-sky-300 hover:text-white transition-all shadow-md group/id"
                          >
                            <IdCard className="h-4 w-4 text-sky-400" />
                            <span>View Interactive 3D ID Badge</span>
                            <span className="group-hover/id:translate-x-1 transition-transform">→</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-3">
                      {fac.socials?.linkedin && (
                        <a
                          href={fac.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-2xl bg-white/[0.05] hover:bg-[#0077b5] border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
                          aria-label={`${fac.name} LinkedIn`}
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                          </svg>
                        </a>
                      )}
                      {fac.socials?.email && (
                        <a
                          href={`mailto:${fac.socials.email}`}
                          className="h-10 w-10 rounded-2xl bg-white/[0.05] hover:bg-sky-500 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
                          aria-label={`Email ${fac.name}`}
                        >
                          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                {(activeCategory === "all" || activeCategory === "cd") && (
                  cdMembers.length > 0 ? (
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
                            {cd.slug ? (
                              <Link
                                href={`/team/${cd.slug}`}
                                className="h-24 w-24 rounded-3xl p-[2px] bg-gradient-to-tr from-amber-400 via-[#f20089] to-purple-600 shadow-xl overflow-hidden shrink-0 hover:scale-105 transition-transform"
                                title={`View ${cd.name}'s 3D ID Profile`}
                              >
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
                              </Link>
                            ) : (
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
                            )}

                            <div>
                              {cd.slug ? (
                                <Link
                                  href={`/team/${cd.slug}`}
                                  className="block text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1 hover:text-amber-300 transition-colors"
                                >
                                  {cd.name}
                                </Link>
                              ) : (
                                <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                                  {cd.name}
                                </h3>
                              )}
                              <p className="text-xs text-white/80 font-medium">
                                {cd.department}
                              </p>
                              <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                                {cd.academicYear}
                              </p>
                            </div>
                          </div>

                          {cd.bio && (
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-4">
                              "{cd.bio}"
                            </p>
                          )}

                          {cd.slug && (
                            <div className="mb-6">
                              <Link
                                href={`/team/${cd.slug}`}
                                className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/15 hover:bg-amber-400/30 px-4 py-1.5 text-xs font-bold text-amber-200 hover:text-white shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                              >
                                <IdCard className="h-3.5 w-3.5" />
                                <span>View 3D ID Profile</span>
                                <span>→</span>
                              </Link>
                            </div>
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
                    ))
                  ) : (
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-dashed border-amber-500/25 bg-amber-500/[0.02] p-8 sm:p-10 backdrop-blur-xl text-center flex flex-col items-center justify-center min-h-[220px]">
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-3">
                        Campus Director • CD
                      </span>
                      <h3 className="text-xl font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                        Announcement Coming Soon
                      </h3>
                      <p className="text-xs text-white/50 max-w-sm leading-relaxed">
                        The Campus Director appointment for Hult Prize HITK 2026-27 will be officially revealed soon.
                      </p>
                    </div>
                  )
                )}

                {/* Deputy Campus Director Card */}
                {(activeCategory === "all" || activeCategory === "dcd") && (
                  dcdMembers.length > 0 ? (
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
                            {dcd.slug ? (
                              <Link
                                href={`/team/${dcd.slug}`}
                                className="h-24 w-24 rounded-3xl p-[2px] bg-gradient-to-tr from-sky-400 via-blue-500 to-[#f20089] shadow-xl overflow-hidden shrink-0 hover:scale-105 transition-transform"
                                title={`View ${dcd.name}'s 3D ID Profile`}
                              >
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
                              </Link>
                            ) : (
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
                            )}

                            <div>
                              {dcd.slug ? (
                                <Link
                                  href={`/team/${dcd.slug}`}
                                  className="block text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1 hover:text-sky-300 transition-colors"
                                >
                                  {dcd.name}
                                </Link>
                              ) : (
                                <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                                  {dcd.name}
                                </h3>
                              )}
                              <p className="text-xs text-white/80 font-medium">
                                {dcd.department}
                              </p>
                              <p className="text-xs text-sky-300/80 font-mono mt-0.5">
                                {dcd.academicYear}
                              </p>
                            </div>
                          </div>

                          {dcd.bio && (
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans mb-4">
                              "{dcd.bio}"
                            </p>
                          )}

                          {dcd.slug && (
                            <div className="mb-6">
                              <Link
                                href={`/team/${dcd.slug}`}
                                className="inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-sky-400/15 hover:bg-sky-400/30 px-4 py-1.5 text-xs font-bold text-sky-200 hover:text-white shadow-md shadow-sky-500/20 transition-all hover:scale-105"
                              >
                                <IdCard className="h-3.5 w-3.5" />
                                <span>View 3D ID Profile</span>
                                <span>→</span>
                              </Link>
                            </div>
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
                    ))
                  ) : (
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-dashed border-sky-500/25 bg-sky-500/[0.02] p-8 sm:p-10 backdrop-blur-xl text-center flex flex-col items-center justify-center min-h-[220px]">
                      <span className="rounded-full bg-sky-500/10 border border-sky-500/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-300 mb-3">
                        Deputy Campus Director • DCD
                      </span>
                      <h3 className="text-xl font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                        Announcement Coming Soon
                      </h3>
                      <p className="text-xs text-white/50 max-w-sm leading-relaxed">
                        The Deputy Campus Director appointment for Hult Prize HITK 2026-27 will be officially revealed soon.
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* DEPARTMENT SECTIONS */}
          {TEAM_SECTIONS.filter((sec) => sec.key !== "cd" && sec.key !== "dcd").map((sec) => {
            if (activeCategory !== "all" && activeCategory !== sec.key) return null;
            const secMembers = members.filter((m) => m.category === sec.key);

            return (
              <section key={sec.key} className="space-y-6 animate-fadeIn">
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ color: sec.accentColor }}
                    >
                      {sec.subtitle}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                      {sec.title}
                    </h2>
                  </div>
                  <p className="text-xs text-white/50 max-w-sm">
                    {sec.description}
                  </p>
                </div>

                {secMembers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {secMembers.map((member) => renderMemberCard(member))}
                  </div>
                ) : (
                  <div className={`rounded-3xl border border-dashed p-8 sm:p-10 text-center backdrop-blur-xl ${sec.borderClass}`}>
                    <h4 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                      Team Members Being Finalized
                    </h4>
                    <p className="text-xs text-white/50 max-w-md mx-auto">
                      Official appointments for {sec.title} will be announced soon.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
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

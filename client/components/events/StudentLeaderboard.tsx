"use client";

import Image from "next/image";
import React, { useState } from "react";
import {
  Trophy,
  Award,
  Medal,
  Target,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Flame,
  Sparkles,
  ChevronRight,
  Star,
  X,
  Users,
  Building2,
  GraduationCap,
} from "lucide-react";

export interface TeamLeaderboardItem {
  id: string;
  rank: number;
  teamName: string;
  ventureTitle: string;
  tagline: string;
  track: "CleanTech" | "AI & Health" | "EduTech" | "AgriTech" | "FinTech";
  leadName: string;
  department: string;
  membersCount: number;
  score: number; // Max 100
  milestoneStage: number; // 1 to 5
  milestoneStatus: string;
  problemStatement: string;
  sdgTag: string;
  badge?: string;
}

const LEADERBOARD_DATA: TeamLeaderboardItem[] = [
  {
    id: "team-1",
    rank: 1,
    teamName: "Ecosphere Innovations",
    ventureTitle: "BioPurify Labs",
    tagline: "Converting agricultural waste into biodegradable water purification filters for rural Bengal.",
    track: "CleanTech",
    leadName: "Ananya Mukherjee",
    department: "Chemical Engineering (4th Yr)",
    membersCount: 4,
    score: 94.8,
    milestoneStage: 4,
    milestoneStatus: "OnCampus Finalist Defense",
    problemStatement: "Over 45% of rural tube wells contain high arsenic levels. Our bio-cellulose filter removes 99.2% of heavy metals at 1/10th the cost of conventional RO.",
    sdgTag: "SDG 6: Clean Water & Sanitation",
    badge: "1st Place Candidate",
  },
  {
    id: "team-2",
    rank: 2,
    teamName: "PulseAI Health",
    ventureTitle: "CardioDetect Portable",
    tagline: "Low-cost mobile ECG and AI early arrhythmia warning patch for peripheral healthcare centers.",
    track: "AI & Health",
    leadName: "Subhadip Paul",
    department: "Electronics & Comm (4th Yr)",
    membersCount: 4,
    score: 91.5,
    milestoneStage: 4,
    milestoneStatus: "Prototype Defense Complete",
    problemStatement: "Lack of immediate cardiac diagnostics in tier-3 clinics leads to high mortality. Our Bluetooth sensor delivers AI diagnostic reports within 45 seconds.",
    sdgTag: "SDG 3: Good Health & Well-being",
    badge: "High Impact Runner-Up",
  },
  {
    id: "team-3",
    rank: 3,
    teamName: "Verdant Harvest",
    ventureTitle: "AgriSense Mesh",
    tagline: "Solar-powered IoT soil moisture & pest predicting mesh network for smallholder farmers.",
    track: "AgriTech",
    leadName: "Debatri Saha",
    department: "Information Tech (3rd Yr)",
    membersCount: 3,
    score: 88.7,
    milestoneStage: 3,
    milestoneStatus: "Field Prototype Testing",
    problemStatement: "Overwatering and unchecked crop blight destroy 30% of annual yields. AgriSense mesh optimizes irrigation intervals via local LoRa gateways.",
    sdgTag: "SDG 2: Zero Hunger",
    badge: "Audience Favorite",
  },
  {
    id: "team-4",
    rank: 4,
    teamName: "SkillBridge Global",
    ventureTitle: "SkillVerse AI",
    tagline: "Gamified micro-internships and VR vocational training for rural ITI students.",
    track: "EduTech",
    leadName: "Arpan Das",
    department: "Computer Science (3rd Yr)",
    membersCount: 5,
    score: 85.2,
    milestoneStage: 3,
    milestoneStatus: "Pitch Deck & Financial Model",
    problemStatement: "Gap between vocational syllabus and modern tech industry requirements leaves 60% of graduates underemployed.",
    sdgTag: "SDG 4: Quality Education",
  },
  {
    id: "team-5",
    rank: 5,
    teamName: "AquaLoop",
    ventureTitle: "HydroRecycle Systems",
    tagline: "Zero-liquid-discharge greywater recycling unit designed for college dormitories and hostels.",
    track: "CleanTech",
    leadName: "Sourav Bhattacharya",
    department: "Mechanical Engineering (4th Yr)",
    membersCount: 4,
    score: 83.9,
    milestoneStage: 2,
    milestoneStatus: "Lab MVP Validation",
    problemStatement: "Campus dormitories waste thousands of liters of shower greywater daily. AquaLoop reclaims 80% for sanitation.",
    sdgTag: "SDG 12: Responsible Consumption",
  },
];

const MILESTONE_STAGES = [
  { stage: 1, title: "Problem Validation", desc: "User interviews & market survey" },
  { stage: 2, title: "Lab MVP & Prototype", desc: "Functional working model" },
  { stage: 3, title: "Unit Economics", desc: "Financial model & TAM sizing" },
  { stage: 4, title: "OnCampus Finalist", desc: "Live stage pitch defense" },
  { stage: 5, title: "Global Accelerator", desc: "$1M Hult Prize qualifier" },
];

export default function StudentLeaderboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<TeamLeaderboardItem | null>(null);

  const filteredTeams = LEADERBOARD_DATA.filter((team) => {
    const matchesSearch =
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.ventureTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.leadName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = selectedTrack === "all" || team.track === selectedTrack;
    return matchesSearch && matchesTrack;
  });

  const top3 = LEADERBOARD_DATA.slice(0, 3);

  return (
    <section className="w-full bg-[#09090b] text-white py-10 px-4 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#f20089]/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header Title */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#f20089]/20 border border-[#f20089]/50 text-[#f20089] mb-3">
          <Trophy className="w-3.5 h-3.5 text-[#f20089]" />
          VENTURE SHOWCASE
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Competing Teams & Leaderboard
        </h2>
      </div>

      {/* TOP 3 PODIUM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* 2ND PLACE (Silver) */}
        {top3[1] && (
          <div className="order-2 md:order-1 bg-[#121216] border border-white/15 hover:border-slate-300/40 p-6 rounded-2xl flex flex-col justify-between transition-all transform hover:-translate-y-1 relative">
            <div className="absolute -top-3 left-6 bg-slate-300/20 border border-slate-300/50 text-slate-200 px-3 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-300" /> 2ND PLACE
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-sky-400 font-semibold">{top3[1].track}</span>
                <span className="text-xs font-mono font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-md">
                  {top3[1].score} pts
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{top3[1].teamName}</h3>
              <p className="text-xs font-semibold text-[#f20089] mt-0.5">{top3[1].ventureTitle}</p>
              <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{top3[1].tagline}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">TEAM LEAD</span>
                <span className="font-semibold text-neutral-300">{top3[1].leadName}</span>
              </div>
              <button
                onClick={() => setSelectedTeam(top3[1])}
                className="text-[#f20089] hover:underline font-semibold flex items-center gap-1 text-xs"
              >
                View Overview <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 1ST PLACE (Gold Champion) */}
        {top3[0] && (
          <div className="order-1 md:order-2 bg-gradient-to-b from-[#1c1220] via-[#121216] to-[#121216] border-2 border-[#f20089] p-7 rounded-2xl flex flex-col justify-between transition-all transform hover:-translate-y-1.5 shadow-xl shadow-[#f20089]/20 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f20089] text-white px-4 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#f20089]/50">
              <Trophy className="w-4 h-4 text-amber-300" /> TOP PITCH
            </div>

            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#f20089] font-bold uppercase tracking-wide">{top3[0].track}</span>
                  <span className="text-sm font-mono font-black text-amber-300 bg-[#f20089]/20 border border-[#f20089]/50 px-3 py-1 rounded-lg">
                    {top3[0].score} pts
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">{top3[0].teamName}</h3>
                <p className="text-xs font-bold text-[#f20089] mt-0.5">{top3[0].ventureTitle}</p>
                <p className="text-xs text-neutral-300 mt-2 line-clamp-2">{top3[0].tagline}</p>
              </div>
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 hidden sm:block">
                <Image
                  src="/assets/bento/leaderboard-trophy.png"
                  alt="3D Champion Trophy"
                  width={144}
                  height={144}
                  unoptimized
                  className="object-contain drop-shadow-[0_12px_30px_rgba(242,0,137,0.7)] hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Milestone Indicator */}
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-medium">Stage Progress</span>
                <span className="text-[#f20089] font-bold">Stage 4 of 5</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#f20089] to-purple-500 w-4/5 rounded-full" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">TEAM LEAD</span>
                <span className="font-bold text-white">{top3[0].leadName}</span>
              </div>
              <button
                onClick={() => setSelectedTeam(top3[0])}
                className="px-3.5 py-1.5 bg-[#f20089] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-[#f20089]/30 hover:bg-[#d00076]"
              >
                View Brief <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3RD PLACE (Bronze) */}
        {top3[2] && (
          <div className="order-3 bg-[#121216] border border-white/15 hover:border-amber-600/40 p-6 rounded-2xl flex flex-col justify-between transition-all transform hover:-translate-y-1 relative">
            <div className="absolute -top-3 left-6 bg-amber-700/20 border border-amber-600/50 text-amber-300 px-3 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-amber-400" /> 3RD PLACE
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-400 font-semibold">{top3[2].track}</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-white/5 px-2.5 py-1 rounded-md">
                  {top3[2].score} pts
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{top3[2].teamName}</h3>
              <p className="text-xs font-semibold text-[#f20089] mt-0.5">{top3[2].ventureTitle}</p>
              <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{top3[2].tagline}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">TEAM LEAD</span>
                <span className="font-semibold text-neutral-300">{top3[2].leadName}</span>
              </div>
              <button
                onClick={() => setSelectedTeam(top3[2])}
                className="text-[#f20089] hover:underline font-semibold flex items-center gap-1 text-xs"
              >
                View Overview <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH & TRACK FILTER ROW */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-[#121216] p-4 rounded-2xl border border-white/10">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search startup name, lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#09090b] border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#f20089]"
          />
        </div>

        {/* Track Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["all", "CleanTech", "AI & Health", "AgriTech", "EduTech"].map((track) => (
            <button
              key={track}
              onClick={() => setSelectedTrack(track)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTrack === track
                  ? "bg-[#f20089] text-white shadow-md shadow-[#f20089]/30"
                  : "bg-[#09090b] text-neutral-400 hover:text-white border border-white/5"
              }`}
            >
              {track === "all" ? "All Tracks" : track}
            </button>
          ))}
        </div>
      </div>

      {/* FULL LEADERBOARD TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121216]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 text-center">Rank</th>
              <th className="py-3.5 px-4">Venture & Team</th>
              <th className="py-3.5 px-4">Track</th>
              <th className="py-3.5 px-4">Lead Student</th>
              <th className="py-3.5 px-4">Milestone Progress</th>
              <th className="py-3.5 px-4 text-right">Score</th>
              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredTeams.map((team) => (
              <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                {/* Rank */}
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold font-mono text-xs ${
                      team.rank === 1
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                        : team.rank === 2
                        ? "bg-slate-300/20 text-slate-200 border border-slate-300/40"
                        : team.rank === 3
                        ? "bg-amber-700/20 text-amber-300 border border-amber-600/40"
                        : "bg-white/5 text-neutral-400"
                    }`}
                  >
                    {team.rank}
                  </span>
                </td>

                {/* Team Name */}
                <td className="py-4 px-4">
                  <div className="font-bold text-white flex items-center gap-2">
                    {team.teamName}
                    {team.badge && (
                      <span className="text-[10px] bg-[#f20089]/20 text-[#f20089] px-2 py-0.5 rounded-full border border-[#f20089]/40 font-semibold">
                        {team.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#f20089] font-medium mt-0.5">{team.ventureTitle}</div>
                </td>

                {/* Track */}
                <td className="py-4 px-4">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/5 border border-white/10 text-neutral-300">
                    {team.track}
                  </span>
                </td>

                {/* Lead */}
                <td className="py-4 px-4">
                  <div className="font-medium text-neutral-200">{team.leadName}</div>
                  <div className="text-[11px] text-neutral-500">{team.department}</div>
                </td>

                {/* Milestone Bar */}
                <td className="py-4 px-4 min-w-[180px]">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Stage {team.milestoneStage}/5</span>
                    <span className="text-neutral-500 truncate max-w-[110px]">{team.milestoneStatus}</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f20089] rounded-full"
                      style={{ width: `${(team.milestoneStage / 5) * 100}%` }}
                    />
                  </div>
                </td>

                {/* Score */}
                <td className="py-4 px-4 text-right font-mono font-bold text-sm text-white">
                  {team.score}
                </td>

                {/* Brief Modal Trigger */}
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="p-1.5 bg-white/5 hover:bg-[#f20089] hover:text-white text-neutral-300 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VENTURE BRIEF MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/20 rounded-3xl max-w-xl w-full p-6 md:p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f20089]/20 text-[#f20089] border border-[#f20089]/40">
                  {selectedTeam.track} Track
                </span>
                <span className="text-xs font-mono font-bold bg-white/10 text-white px-3 py-1 rounded-full">
                  Rank #{selectedTeam.rank} • {selectedTeam.score} pts
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">{selectedTeam.teamName}</h3>
              <p className="text-sm font-semibold text-[#f20089]">{selectedTeam.ventureTitle}</p>
            </div>

            {/* Problem Statement */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Social Problem & Solution Brief
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {selectedTeam.problemStatement}
              </p>
              <div className="pt-2 text-[11px] text-sky-400 font-medium">
                {selectedTeam.sdgTag}
              </div>
            </div>

            {/* Milestone Stepper */}
            <div>
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-3">
                Venture Development Stepper
              </span>
              <div className="space-y-2">
                {MILESTONE_STAGES.map((m) => {
                  const isPassed = m.stage <= selectedTeam.milestoneStage;
                  const isCurrent = m.stage === selectedTeam.milestoneStage;

                  return (
                    <div
                      key={m.stage}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${
                        isCurrent
                          ? "bg-[#f20089]/15 border-[#f20089] text-white"
                          : isPassed
                          ? "bg-white/5 border-white/10 text-neutral-300"
                          : "bg-black/40 border-white/5 text-neutral-600"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isCurrent
                            ? "bg-[#f20089] text-white"
                            : isPassed
                            ? "bg-emerald-500 text-black"
                            : "bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : m.stage}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{m.title}</div>
                        <div className="text-[11px] opacity-70">{m.desc}</div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f20089] text-white">
                          CURRENT STAGE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Lead Info */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#f20089]" />
                <span>Lead: <strong className="text-white">{selectedTeam.leadName}</strong> ({selectedTeam.department})</span>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Close Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

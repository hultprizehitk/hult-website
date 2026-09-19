"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import type { PublicEvent } from "../page";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import EventAuditoriumPass from "@/components/events/EventAuditoriumPass";
import TeamRosterCard from "@/components/events/TeamRosterCard";
import TeamRegistrationWizard from "@/components/events/TeamRegistrationWizard";

interface EventInsideViewProps {
  event: PublicEvent;
  sessionUser: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  registeredTeam: any | null;
  onBack: () => void;
  onRegisterSuccess: (teamData: any) => void;
}

export default function EventInsideView({
  event,
  sessionUser,
  registeredTeam,
  onBack,
  onRegisterSuccess,
}: EventInsideViewProps) {
  const reg = useEventRegistration({
    event,
    sessionUser,
    registeredTeam,
    onRegisterSuccess,
  });

  return (
    <div className="w-full text-left space-y-8 animate-fadeIn font-[family-name:var(--font-google-sans)]">
      {/* Top Back Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-pink-400" />
          <span>Back to All Events</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-white/50 font-sans">
          <Link href="/events" onClick={onBack} className="hover:text-white transition-colors">
            Events
          </Link>
          <span>/</span>
          <span className="text-[#f20089] font-medium truncate max-w-[200px] sm:max-w-none">
            {event.title}
          </span>
        </div>
      </div>

      {/* Hero Event Card (Hult Theme Glassmorphism) */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089] to-transparent" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#f20089]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-900/20 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#f20089]">
                {event.tag}
              </span>

              {event.registrationStatus === "closed" ? (
                <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-[11px] font-bold text-red-300 uppercase tracking-wider">
                  Registrations Closed
                </span>
              ) : event.registrationStatus === "extended" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-1 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                  Extended Deadline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Registrations Open
                </span>
              )}

              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-[11px] font-bold text-purple-200">
                Team Size: {reg.minMembers} to {reg.maxMembers} Members
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 font-sans text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-pink-400" />
                <span>Schedule & Time</span>
              </span>
              <span className="font-semibold text-white block text-xs sm:text-sm">
                {event.date}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-pink-400" />
                <span>Venue Location</span>
              </span>
              <span className="font-semibold text-white block text-xs sm:text-sm">
                {event.venue}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-emerald-400" />
                <span>Team Size Limits</span>
              </span>
              <span className="font-bold text-[#f20089] block text-xs sm:text-sm">
                {reg.minMembers} to {reg.maxMembers} Students / Team
              </span>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-white/50 mb-2">
              About This Event
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {event.link && event.link.startsWith("http") && (
            <div className="pt-2">
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[#f20089] hover:underline font-bold"
              >
                <svg className="h-3.5 w-3.5 text-[#f20089]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>External RSVP & Event Page</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* TEAM REGISTRATION & PASS STUDIO CONTAINER */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089] to-transparent" />

        {registeredTeam ? (
          <div className="space-y-6 animate-scaleUp">
            <TeamRosterCard
              registeredTeam={registeredTeam}
              onRefreshRoster={reg.handleRefreshRoster}
              refreshing={reg.refreshing}
              isTeamCriteriaMet={reg.isTeamCriteriaMet}
              totalJoined={reg.totalJoined}
              minMembers={reg.minMembers}
              targetCount={reg.targetCount}
              openSlotsCount={reg.openSlotsCount}
              currentMembersList={reg.currentMembersList}
              copiedCode={reg.copiedCode}
              onCopyCode={reg.handleCopyCode}
              whatsAppShareUrl={reg.getWhatsAppShareUrl(registeredTeam)}
            />

            <EventAuditoriumPass
              event={event}
              registeredTeam={registeredTeam}
              isTeamCriteriaMet={reg.isTeamCriteriaMet}
              minMembers={reg.minMembers}
              totalJoined={reg.totalJoined}
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={onBack}
                className="rounded-2xl bg-white/[0.08] hover:bg-white/15 px-6 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                ← Back to All Events
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!reg.isTeamCriteriaMet) {
                      alert(`Team Roster Incomplete (${reg.totalJoined}/${reg.minMembers} Members)\n\nOfficial Hult Prize rules require at least ${reg.minMembers} members per team to validate your pass. Please share your Team Code (${registeredTeam.teamCode}) with teammates so they can join!`);
                      return;
                    }
                    const text = `HULT PRIZE REGISTRATION PASS\nEvent: ${event.title}\nTeam: ${registeredTeam.teamName}\nTeam Code: ${registeredTeam.teamCode || "N/A"}\nLeader: ${registeredTeam.leadName} (${registeredTeam.leadEmail})\nMembers Count: ${reg.totalJoined} / ${reg.targetCount}\nStatus: Confirmed\nVenue: ${event.venue}\nDate: ${event.date}`;
                    navigator.clipboard.writeText(text);
                    alert("Registration Pass details copied to clipboard!");
                  }}
                  className={`rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    reg.isTeamCriteriaMet
                      ? "bg-white/[0.06] hover:bg-white/15 border-white/10 text-white/80 hover:text-white"
                      : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white/60"
                  }`}
                >
                  <span>Copy Pass Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!reg.isTeamCriteriaMet) {
                      alert(`Team Criteria Not Met\n\nYou have ${reg.totalJoined} member(s). Official passes can only be printed once at least ${reg.minMembers} members have joined your team roster.`);
                      return;
                    }
                    window.print();
                  }}
                  className={`rounded-2xl border px-5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    reg.isTeamCriteriaMet
                      ? "bg-[#f20089]/20 hover:bg-[#f20089]/30 border-[#f20089]/40 text-[#f20089] hover:text-white"
                      : "bg-white/[0.03] border-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <span>{reg.isTeamCriteriaMet ? "Print Pass" : `Pass Locked (Needs ${reg.minMembers - reg.totalJoined} More)`}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <TeamRegistrationWizard
            event={event}
            sessionUser={sessionUser}
            registrationMode={reg.registrationMode}
            setRegistrationMode={reg.setRegistrationMode}
            teamName={reg.teamName}
            setTeamName={reg.setTeamName}
            ventureName={reg.ventureName}
            setVentureName={reg.setVentureName}
            leadPhone={reg.leadPhone}
            setLeadPhone={reg.setLeadPhone}
            leadRoll={reg.leadRoll}
            setLeadRoll={reg.setLeadRoll}
            department={reg.department}
            setDepartment={reg.setDepartment}
            joinCode={reg.joinCode}
            setJoinCode={reg.setJoinCode}
            memberPhone={reg.memberPhone}
            setMemberPhone={reg.setMemberPhone}
            memberRoll={reg.memberRoll}
            setMemberRoll={reg.setMemberRoll}
            memberDepartment={reg.memberDepartment}
            setMemberDepartment={reg.setMemberDepartment}
            loading={reg.loading}
            errorMessage={reg.errorMessage}
            setErrorMessage={reg.setErrorMessage}
            createStep={reg.createStep}
            setCreateStep={reg.setCreateStep}
            joinStep={reg.joinStep}
            setJoinStep={reg.setJoinStep}
            handleCreateTeam={reg.handleCreateTeam}
            handleJoinTeam={reg.handleJoinTeam}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}

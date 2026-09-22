"use client";

import React from "react";
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
    <div className="relative w-full max-w-[960px] mx-auto flex flex-col gap-7 text-white font-sans animate-fadeIn">
      {/* ── Top Back Navigation Breadcrumb ───────────────────────── */}
      <nav className="flex items-center justify-between gap-4 flex-wrap" aria-label="Event navigation">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-5 py-2.5 text-xs font-semibold tracking-wider text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
        >
          <ArrowLeft size={14} className="text-white" />
          <span className="uppercase">Back to Events</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-widest">
          <Link href="/events" onClick={onBack} className="hover:text-white transition-colors">
            Events
          </Link>
          <span>/</span>
          <span className="text-white font-bold max-w-[200px] truncate">
            {event.title}
          </span>
        </div>
      </nav>

      {/* ── Hero Event Card (Frosted Glassmorphic) ───────────────── */}
      <article className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-9 shadow-2xl overflow-hidden">
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

        <div className="relative z-[2] flex flex-col gap-5">
          {/* Status Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/30 text-white/90">
              {event.tag || "FLAGSHIP"}
            </span>

            {event.registrationStatus === "closed" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950/40 border border-rose-400/50 text-rose-300">
                Registrations Closed
              </span>
            ) : event.registrationStatus === "extended" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-950/40 border border-amber-400/50 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Extended Deadline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/40 border border-emerald-400/50 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Registrations Open
              </span>
            )}

            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white/75">
              Team Size: {reg.minMembers} to {reg.maxMembers} Members
            </span>
          </div>

          {/* Event Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.18)]">
            {event.title}
          </h1>

          {/* Meta Grid (Schedule, Venue, Limits) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                <Calendar size={13} className="text-rose-300/90 shrink-0" />
                <span>Schedule & Time</span>
              </span>
              <span className="text-sm font-semibold text-white">
                {event.date || "TBD"}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                <MapPin size={13} className="text-rose-300/90 shrink-0" />
                <span>Venue Location</span>
              </span>
              <span className="text-sm font-semibold text-white">
                {event.venue || "Heritage Campus (cc)"}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/60">
                <Users size={13} className="text-rose-300/90 shrink-0" />
                <span>Team Size Limits</span>
              </span>
              <span className="text-sm font-bold text-white">
                {reg.minMembers} to {reg.maxMembers} Students / Team
              </span>
            </div>
          </div>

          {/* About Event Description */}
          {event.description && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">
                About This Event
              </span>
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* External Link */}
          {event.link && event.link.startsWith("http") && (
            <div>
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white hover:underline transition-opacity"
              >
                <ExternalLink size={13} />
                <span>External RSVP & Event Page</span>
              </a>
            </div>
          )}
        </div>
      </article>

      {/* ── Team Registration & Pass Studio Container ─────────────── */}
      <section className="relative rounded-3xl bg-[#0c0a12]/85 backdrop-blur-2xl border border-white/15 p-6 md:p-9 shadow-2xl overflow-hidden" aria-label="Registration Studio">
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent z-[1]" aria-hidden="true" />

        <div className="relative z-[2] flex flex-col gap-5">
          {registeredTeam ? (
            <div className="space-y-6">
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

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 text-xs font-semibold text-white transition-all cursor-pointer shadow-lg"
                >
                  ← Back to All Events
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!reg.isTeamCriteriaMet) {
                        alert(
                          `Team Roster Incomplete (${reg.totalJoined}/${reg.minMembers} Members)\n\nOfficial Hult Prize rules require at least ${reg.minMembers} members per team to validate your pass. Please share your Team Code (${registeredTeam.teamCode}) with teammates so they can join!`
                        );
                        return;
                      }
                      const text = `HULT PRIZE REGISTRATION PASS\nEvent: ${event.title}\nTeam: ${registeredTeam.teamName}\nTeam Code: ${registeredTeam.teamCode || "N/A"}\nLeader: ${registeredTeam.leadName} (${registeredTeam.leadEmail})\nMembers Count: ${reg.totalJoined} / ${reg.targetCount}\nStatus: Confirmed\nVenue: ${event.venue}\nDate: ${event.date}`;
                      navigator.clipboard.writeText(text);
                      alert("Registration Pass details copied to clipboard!");
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      reg.isTeamCriteriaMet
                        ? "bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-lg"
                        : "bg-black/20 border-black/30 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    <span>Copy Pass Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!reg.isTeamCriteriaMet) {
                        alert(
                          `Team Criteria Not Met\n\nYou have ${reg.totalJoined} member(s). Official passes can only be printed once at least ${reg.minMembers} members have joined your team roster.`
                        );
                        return;
                      }
                      window.print();
                    }}
                    className={`rounded-full border px-5 py-2 text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                      reg.isTeamCriteriaMet
                        ? "bg-black text-white hover:bg-neutral-800 shadow-xl border-transparent"
                        : "bg-black/40 border-black/50 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    <span>
                      {reg.isTeamCriteriaMet
                        ? "Print Pass"
                        : `Pass Locked (Needs ${reg.minMembers - reg.totalJoined} More)`}
                    </span>
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
      </section>
    </div>
  );
}

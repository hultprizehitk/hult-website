"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, ExternalLink, RefreshCw } from "lucide-react";
import type { PublicEvent } from "../page";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import EventAuditoriumPass from "@/components/events/EventAuditoriumPass";
import TeamRosterCard from "@/components/events/TeamRosterCard";
import TeamRegistrationWizard from "@/components/events/TeamRegistrationWizard";
import "./EventInsideView.css";

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
    <div className="event-inside-root">
      {/* ── Top Back Navigation Breadcrumb ───────────────────────── */}
      <nav className="event-inside__nav" aria-label="Event navigation">
        <button
          type="button"
          onClick={onBack}
          className="event-inside__back-btn"
        >
          <ArrowLeft size={13} className="text-[#e60067]" />
          <span>Back to All Events</span>
        </button>

        <div className="event-inside__breadcrumb">
          <Link href="/events" onClick={onBack}>
            Events
          </Link>
          <span>/</span>
          <span className="event-inside__breadcrumb-current">
            {event.title}
          </span>
        </div>
      </nav>

      {/* ── Hero Event Card (Frosted Glassmorphic) ───────────────── */}
      <article className="event-inside__card">
        <div className="event-inside__card-sheen" aria-hidden="true" />

        <div className="event-inside__card-content">
          {/* Status Badges */}
          <div className="event-inside__badges">
            <span className="event-inside__badge-tag">
              {event.tag || "FLAGSHIP"}
            </span>

            {event.registrationStatus === "closed" ? (
              <span className="event-inside__badge-status event-inside__badge-status--closed">
                Registrations Closed
              </span>
            ) : event.registrationStatus === "extended" ? (
              <span className="event-inside__badge-status event-inside__badge-status--extended">
                <span className="event-inside__status-dot" />
                Extended Deadline
              </span>
            ) : (
              <span className="event-inside__badge-status event-inside__badge-status--open">
                <span className="event-inside__status-dot" />
                Registrations Open
              </span>
            )}

            <span className="event-inside__badge-limit">
              Team Size: {reg.minMembers} to {reg.maxMembers} Members
            </span>
          </div>

          {/* Event Title */}
          <h1 className="event-inside__title">
            {event.title}
          </h1>

          {/* Meta Grid (Schedule, Venue, Limits) */}
          <div className="event-inside__meta-grid">
            <div className="event-inside__meta-tile">
              <span className="event-inside__meta-label">
                <Calendar size={13} className="event-inside__meta-icon" />
                <span>Schedule & Time</span>
              </span>
              <span className="event-inside__meta-value">
                {event.date || "TBD"}
              </span>
            </div>

            <div className="event-inside__meta-tile">
              <span className="event-inside__meta-label">
                <MapPin size={13} className="event-inside__meta-icon" />
                <span>Venue Location</span>
              </span>
              <span className="event-inside__meta-value">
                {event.venue || "Heritage Campus (cc)"}
              </span>
            </div>

            <div className="event-inside__meta-tile">
              <span className="event-inside__meta-label">
                <Users size={13} className="event-inside__meta-icon" />
                <span>Team Size Limits</span>
              </span>
              <span className="event-inside__meta-value event-inside__meta-value--highlight">
                {reg.minMembers} to {reg.maxMembers} Students / Team
              </span>
            </div>
          </div>

          {/* About Event Description */}
          {event.description && (
            <div className="event-inside__about">
              <span className="event-inside__about-label">
                About This Event
              </span>
              <p className="event-inside__about-text">
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
                className="event-inside__external-link"
              >
                <ExternalLink size={13} />
                <span>External RSVP & Event Page</span>
              </a>
            </div>
          )}
        </div>
      </article>

      {/* ── Team Registration & Pass Studio Container ─────────────── */}
      <section className="event-inside__card event-inside-studio" aria-label="Registration Studio">
        <div className="event-inside__card-sheen" aria-hidden="true" />

        <div className="event-inside__card-content">
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
                  className="rounded-full bg-white/70 hover:bg-white border border-white/90 px-5 py-2 text-xs font-semibold text-[#3b1b28] hover:text-[#e60067] shadow-sm transition-all cursor-pointer"
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
                        ? "bg-white/80 hover:bg-white border-white/90 text-[#3b1b28]"
                        : "bg-white/40 border-white/50 text-[#7a4658]/60 cursor-not-allowed"
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
                    className={`rounded-full border px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      reg.isTeamCriteriaMet
                        ? "bg-gradient-to-r from-[#e60067] to-[#ff007f] text-white shadow-md shadow-[#e60067]/30 border-transparent"
                        : "bg-white/30 border-white/40 text-[#7a4658]/40 cursor-not-allowed"
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

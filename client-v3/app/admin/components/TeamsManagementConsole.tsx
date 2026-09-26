"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react";

import { parseHeritageEmail } from "@/lib/heritage-parser";

interface TeamMember {
  name: string;
  email: string;
  department?: string;
  roll?: string;
  phone?: string;
  joinedAt?: string;
}

interface EventRecord {
  _id: string;
  title: string;
  tag?: string;
  date?: string;
  maxTeams?: number;
}

interface TeamRecord {
  _id: string;
  teamCode: string;
  teamName: string;
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: string;
  createdAt?: string;
  lead: {
    name: string;
    email: string;
    department?: string;
    phone?: string;
    roll?: string;
    year?: string;
    checkedInAt?: string | Date | null;
  };
  membersCount: number;
  members: TeamMember[];
  status: "confirmed" | "disqualified";
  checkedIn: boolean;
  checkedInAt?: string | Date | null;
  pitchDeckUrl?: string;
  eventId?: {
    _id: string;
    title: string;
    date: string;
    tag: string;
  };
  registeredAt: string;
}

const formatTeamDateTime = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const dateStr = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();
  return { dateStr, timeStr };
};

export default function TeamsManagementConsole() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"submitted" | "forming" | "all">("submitted");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);

  const fetchTeamsAndEvents = async () => {
    try {
      setLoading(true);
      const [teamsRes, eventsRes] = await Promise.all([
        fetch("/api/admin/teams"),
        fetch("/api/admin/events"),
      ]);
      const teamsData = await teamsRes.json();
      if (teamsData.success) {
        setTeams(teamsData.teams || []);
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.events) {
          setEvents(eventsData.events);
        }
      }
    } catch (err) {
      console.error("Failed to load teams or events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndEvents();
  }, []);

  // Helper to determine if team is fully registered and submitted
  const isTeamSubmitted = (t: TeamRecord) => {
    return t.submissionStatus === "submitted" || Boolean(t.submittedAt);
  };

  // Merge events from API and any unique event populated on teams
  const allEventsMap = new Map<string, { _id: string; title: string; maxTeams?: number }>();
  for (const ev of events) {
    allEventsMap.set(ev._id, { _id: ev._id, title: ev.title, maxTeams: ev.maxTeams });
  }
  for (const t of teams) {
    if (t.eventId?._id && !allEventsMap.has(t.eventId._id)) {
      allEventsMap.set(t.eventId._id, {
        _id: t.eventId._id,
        title: t.eventId.title || "Untitled Event",
      });
    }
  }
  const availableEvents = Array.from(allEventsMap.values());

  const teamsInSelectedEvent = teams.filter((t) =>
    selectedEventId === "all"
      ? true
      : t.eventId?._id === selectedEventId || (!t.eventId && selectedEventId === "unassigned")
  );

  const submittedCount = teamsInSelectedEvent.filter((t) => isTeamSubmitted(t)).length;
  const formingCount = teamsInSelectedEvent.filter((t) => !isTeamSubmitted(t)).length;
  const totalInSelectedEvent = teamsInSelectedEvent.length;

  const filteredTeams = teams.filter((t) => {
    const matchesEvent =
      selectedEventId === "all" ||
      t.eventId?._id === selectedEventId ||
      (!t.eventId && selectedEventId === "unassigned");
    if (!matchesEvent) return false;

    const isSubmitted = isTeamSubmitted(t);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "submitted" && isSubmitted) ||
      (statusFilter === "forming" && !isSubmitted);
    if (!matchesStatus) return false;

    if (!search.trim()) return true;

    const q = search.toLowerCase().trim();
    const parsed = parseHeritageEmail(t.lead.email, t.lead.name);
    return (
      t.teamName.toLowerCase().includes(q) ||
      t.lead.name.toLowerCase().includes(q) ||
      t.lead.email.toLowerCase().includes(q) ||
      t.teamCode.toLowerCase().includes(q) ||
      (t.lead.roll ? t.lead.roll.toLowerCase().includes(q) : false) ||
      (t.lead.phone ? t.lead.phone.toLowerCase().includes(q) : false) ||
      (t.lead.department ? t.lead.department.toLowerCase().includes(q) : false) ||
      parsed.branchName.toLowerCase().includes(q) ||
      (t.eventId?.title ? t.eventId.title.toLowerCase().includes(q) : false)
    );
  });

  const selectedEvent = availableEvents.find((e) => e._id === selectedEventId);
  const totalStudentsInFiltered = filteredTeams.reduce(
    (sum, t) => sum + 1 + (t.members?.length || 0),
    0
  );

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Teams & Rosters
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Review team rosters and manage registered teams.
          </p>
        </div>
        <button
          onClick={fetchTeamsAndEvents}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Event Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search team name, code, leader, roll no, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#16161d] border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="relative sm:w-80">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#16161d] border border-white/15 rounded-xl text-white outline-none focus:border-rose-500/50 cursor-pointer appearance-none"
          >
            <option value="all">
              All Events ({teams.length} total registrations)
            </option>
            {availableEvents.map((ev) => {
              const count = teams.filter((t) => t.eventId?._id === ev._id).length;
              return (
                <option key={ev._id} value={ev._id}>
                  {ev.title} ({count} {count === 1 ? "team" : "teams"})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* View Tabs & Live Counts Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        {/* Sleek Segmented Control */}
        <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter("submitted")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 ${
              statusFilter === "submitted"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>Fully Registered</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                statusFilter === "submitted"
                  ? "bg-black/10 text-black font-bold"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {submittedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("forming")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 ${
              statusFilter === "forming"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>Forming</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                statusFilter === "forming"
                  ? "bg-black/10 text-black font-bold"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {formingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 ${
              statusFilter === "all"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>All Teams</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                statusFilter === "all"
                  ? "bg-black/10 text-black font-bold"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {totalInSelectedEvent}
            </span>
          </button>
        </div>

        {/* Minimalist Stats Summary */}
        <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
          <span>
            {selectedEventId === "all" ? "All Events" : selectedEvent?.title || "Selected Event"}:
          </span>
          <span className="text-white font-sans font-semibold">
            {filteredTeams.length} {filteredTeams.length === 1 ? "team" : "teams"}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-emerald-400 font-sans font-semibold">
            {totalStudentsInFiltered} student participants
          </span>
        </div>
      </div>

      {/* Teams Table */}
      <div className="rounded-2xl border border-white/15 bg-[#0e0e12] shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500 font-mono">
            Loading team rosters...
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-medium">Team & Code</th>
                  <th className="py-3.5 px-4 font-medium">Status & Timeline</th>
                  <th className="py-3.5 px-4 font-medium">Team Leader</th>
                  <th className="py-3.5 px-4 font-medium">Roll No</th>
                  <th className="py-3.5 px-4 font-medium">Contact</th>
                  <th className="py-3.5 px-4 font-medium">Department</th>
                  <th className="py-3.5 px-4 font-medium">Academic Year</th>
                  <th className="py-3.5 px-4 font-medium text-right">Roster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTeams.map((team) => {
                  const parsed = parseHeritageEmail(team.lead?.email || "", team.lead?.name);
                  const isSubmitted = isTeamSubmitted(team);
                  const formedInfo = formatTeamDateTime(team.registeredAt || team.createdAt);
                  const submittedInfo = formatTeamDateTime(team.submittedAt);
                  return (
                    <tr key={team._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-sm tracking-tight">{team.teamName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="font-mono text-[11px] text-rose-400 font-bold">
                            {team.teamCode}
                          </span>
                          {team.eventId && (
                            <span className="text-[11px] text-white/40 truncate">
                              • {team.eventId.title}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[140px]">
                          {isSubmitted ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                              <span>Submitted</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs text-amber-300/90 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>Forming</span>
                            </div>
                          )}

                          <div className="space-y-0.5 font-mono text-[10px] leading-tight">
                            {formedInfo && (
                              <div className="text-white/50 flex items-center gap-1 whitespace-nowrap">
                                <span className="text-white/35 font-semibold">Formed:</span>
                                <span className="text-white/80">
                                  {formedInfo.dateStr}, {formedInfo.timeStr}
                                </span>
                              </div>
                            )}
                            {isSubmitted ? (
                              submittedInfo ? (
                                <div className="text-emerald-400/90 flex items-center gap-1 whitespace-nowrap">
                                  <span className="text-emerald-500/60 font-semibold">Reg:</span>
                                  <span>
                                    {submittedInfo.dateStr}, {submittedInfo.timeStr}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-emerald-400/70 text-[9px]">
                                  <span>Reg: Verified</span>
                                </div>
                              )
                            ) : (
                              <div className="text-amber-400/70 flex items-center gap-1 whitespace-nowrap">
                                <span className="text-amber-500/50 font-semibold">Reg:</span>
                                <span className="italic">Pending</span>
                              </div>
                            )}
                            {team.checkedIn && (
                              (() => {
                                const checkInInfo = formatTeamDateTime(team.checkedInAt || team.lead?.checkedInAt);
                                if (!checkInInfo) return null;
                                return (
                                  <div className="text-emerald-400 flex items-center gap-1 whitespace-nowrap">
                                    <span className="text-emerald-500/60 font-semibold">Check-In:</span>
                                    <span>
                                      {checkInInfo.dateStr}, {checkInInfo.timeStr}
                                    </span>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{team.lead.name}</div>
                        <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[160px] mt-0.5">
                          {team.lead.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {team.lead?.roll ? (
                          <span className="text-white/90 font-semibold">{team.lead.roll}</span>
                        ) : (
                          <span className="text-white/30 font-normal">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {team.lead?.phone ? (
                          <span className="text-emerald-400 font-medium">+91 {team.lead.phone}</span>
                        ) : (
                          <span className="text-white/30 font-normal">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block text-xs font-semibold text-white">
                          {team.lead?.department || parsed.branchName}
                        </span>
                        <span className="inline-block mt-0.5 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70 uppercase font-mono">
                          {parsed.branchCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block text-xs font-bold text-white">
                          {team.lead?.year || parsed.academicYear}
                        </span>
                        <span className="text-[10px] text-purple-300 font-mono font-medium">
                          Class of {parsed.passingYear}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-300 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTeam(team)}
                          className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{1 + (team.members?.length || 0)}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-neutral-400 font-mono space-y-3">
            <p>
              {statusFilter === "submitted"
                ? "No fully registered teams submitted yet for current filters."
                : statusFilter === "forming"
                ? "No forming teams found."
                : "No teams found matching current filters."}
            </p>
            {statusFilter === "submitted" && formingCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("forming")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-sans text-xs transition-colors cursor-pointer"
              >
                <span>View Forming Teams ({formingCount})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#0e0e12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">{selectedTeam.teamName}</h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="font-mono text-xs text-rose-400">{selectedTeam.teamCode}</span>
                  {selectedTeam.submissionStatus === "submitted" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        Application Submitted
                        {selectedTeam.submittedAt &&
                          ` (${new Date(selectedTeam.submittedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })} • ${new Date(selectedTeam.submittedAt)
                            .toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .toUpperCase()})`}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Forming ({1 + (selectedTeam.members?.length || 0)} members)</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Team Timeline Card */}
              <div className="p-3.5 rounded-xl bg-[#16161d] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Registration & Formation Timeline</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase block font-semibold">Forming Started</span>
                    {selectedTeam.registeredAt || selectedTeam.createdAt ? (
                      <span className="text-white font-medium block">
                        {formatTeamDateTime(selectedTeam.registeredAt || selectedTeam.createdAt)?.dateStr} •{" "}
                        {formatTeamDateTime(selectedTeam.registeredAt || selectedTeam.createdAt)?.timeStr}
                      </span>
                    ) : (
                      <span className="text-white/30 block">N/A</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase block font-semibold">Application Submitted</span>
                    {selectedTeam.submittedAt ? (
                      <span className="text-emerald-400 font-medium block">
                        {formatTeamDateTime(selectedTeam.submittedAt)?.dateStr} •{" "}
                        {formatTeamDateTime(selectedTeam.submittedAt)?.timeStr}
                      </span>
                    ) : (
                      <span className="text-amber-400/80 italic block">Pending (Still Forming)</span>
                    )}
                  </div>

                  {selectedTeam.checkedIn && (
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1 sm:col-span-2">
                      <span className="text-[10px] text-white/40 uppercase block font-semibold">Event Check-In</span>
                      {selectedTeam.checkedInAt || selectedTeam.lead?.checkedInAt ? (
                        <span className="text-emerald-400 font-medium block">
                          {formatTeamDateTime(selectedTeam.checkedInAt || selectedTeam.lead?.checkedInAt)?.dateStr} •{" "}
                          {formatTeamDateTime(selectedTeam.checkedInAt || selectedTeam.lead?.checkedInAt)?.timeStr}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium block">Verified Present</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-semibold text-white mb-2">Team Leader:</div>
                <div className="p-3 rounded-xl bg-[#16161d] border border-white/10 space-y-1.5">
                  <div className="text-white font-medium">{selectedTeam.lead.name}</div>
                  <div className="text-neutral-400 font-mono text-[11px]">{selectedTeam.lead.email}</div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-[10px]">
                    {selectedTeam.lead.roll && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
                        Roll: {selectedTeam.lead.roll}
                      </span>
                    )}
                    {selectedTeam.lead.phone && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                        Phone: +91 {selectedTeam.lead.phone}
                      </span>
                    )}
                    {selectedTeam.lead.department && (
                      <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-neutral-300">
                        {selectedTeam.lead.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-white mb-2">Team Members:</div>
                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTeam.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#16161d] border border-white/10 space-y-1"
                      >
                        <div className="text-white font-medium">{m.name}</div>
                        <div className="text-neutral-400 font-mono text-[11px]">{m.email}</div>
                        {m.joinedAt && (
                          <div className="text-neutral-500 font-mono text-[10px]">
                            Joined:{" "}
                            {new Date(m.joinedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            •{" "}
                            {new Date(m.joinedAt)
                              .toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-[10px]">
                          {m.roll && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
                              Roll: {m.roll}
                            </span>
                          )}
                          {m.phone && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                              Phone: +91 {m.phone}
                            </span>
                          )}
                          {m.department && (
                            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-neutral-300">
                              {m.department}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-neutral-500 font-mono text-xs">No additional members added yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

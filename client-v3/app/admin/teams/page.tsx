"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Calendar,
} from "lucide-react";

import { parseHeritageEmail } from "@/lib/heritage-parser";

interface TeamMember {
  name: string;
  email: string;
  department?: string;
  roll?: string;
  phone?: string;
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
  ventureName: string;
  ventureDescription?: string;
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: string;
  lead: {
    name: string;
    email: string;
    department?: string;
    phone?: string;
    roll?: string;
    year?: string;
  };
  membersCount: number;
  members: TeamMember[];
  status: "confirmed" | "pending" | "waitlist" | "disqualified";
  checkedIn: boolean;
  pitchDeckUrl?: string;
  eventId?: {
    _id: string;
    title: string;
    date: string;
    tag: string;
  };
  registeredAt: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
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

  const filteredTeams = teams.filter((t) => {
    const matchesEvent =
      selectedEventId === "all" ||
      t.eventId?._id === selectedEventId ||
      (!t.eventId && selectedEventId === "unassigned");

    const q = search.toLowerCase();
    const parsed = parseHeritageEmail(t.lead.email, t.lead.name);
    const matchesSearch =
      t.teamName.toLowerCase().includes(q) ||
      t.lead.name.toLowerCase().includes(q) ||
      t.lead.email.toLowerCase().includes(q) ||
      t.teamCode.toLowerCase().includes(q) ||
      (t.lead.roll ? t.lead.roll.toLowerCase().includes(q) : false) ||
      (t.lead.phone ? t.lead.phone.toLowerCase().includes(q) : false) ||
      (t.lead.department ? t.lead.department.toLowerCase().includes(q) : false) ||
      parsed.branchName.toLowerCase().includes(q) ||
      (t.eventId?.title ? t.eventId.title.toLowerCase().includes(q) : false);

    return matchesEvent && matchesSearch;
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

      {/* Registration Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#16161d] border border-white/10 text-xs">
        <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
          <span className="text-neutral-400">Event:</span>
          <span className="font-semibold text-white px-2 py-0.5 rounded bg-white/10 border border-white/10 font-sans">
            {selectedEventId === "all" ? "All Events" : selectedEvent?.title || "Selected Event"}
          </span>
          <span className="text-rose-400 font-bold">
            {filteredTeams.length} {filteredTeams.length === 1 ? "team registered" : "teams registered"}
          </span>
          {selectedEvent?.maxTeams && (
            <span className="text-neutral-400">
              • Capacity: {filteredTeams.length}/{selectedEvent.maxTeams} slots
            </span>
          )}
        </div>
        <div className="text-neutral-400 font-mono text-[11px]">
          <span className="text-emerald-400 font-bold">{totalStudentsInFiltered}</span> student participants
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
                <tr className="border-b border-white/10 text-neutral-300 bg-[#16161d]">
                  <th className="py-3.5 px-4 font-semibold">Team & Code</th>
                  <th className="py-3.5 px-4 font-semibold">Team Leader</th>
                  <th className="py-3.5 px-4 font-semibold">Roll No</th>
                  <th className="py-3.5 px-4 font-semibold">Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Academic Year</th>
                  <th className="py-3.5 px-4 font-semibold">Roster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTeams.map((team) => {
                  const parsed = parseHeritageEmail(team.lead?.email || "", team.lead?.name);
                  return (
                    <tr key={team._id} className="hover:bg-[#16161d]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{team.teamName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="font-mono text-[10px] text-rose-400 font-bold">
                            {team.teamCode}
                          </span>
                          {team.eventId && (
                            <span className="text-[10px] text-neutral-400 truncate">
                              • {team.eventId.title}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{team.lead.name}</div>
                        <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[160px]">
                          {team.lead.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {team.lead?.roll ? (
                          <span className="text-rose-400 font-semibold">{team.lead.roll}</span>
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
                        <span className="inline-block mt-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 uppercase">
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

                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white hover:underline cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{1 + (team.members?.length || 0)} members</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-neutral-500 font-mono">
            No teams found matching current filters.
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-rose-400">{selectedTeam.teamCode}</span>
                  {selectedTeam.submissionStatus === "submitted" ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Application Submitted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Forming ({1 + (selectedTeam.members?.length || 0)} members)
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
              <div className="p-3 rounded-xl bg-[#16161d] border border-white/10 space-y-1">
                <div className="font-semibold text-white">Venture Track / Idea:</div>
                <div className="text-neutral-300">{selectedTeam.ventureName || "None provided"}</div>
                {selectedTeam.ventureDescription && (
                  <p className="text-neutral-400 text-[11px] pt-1 leading-relaxed whitespace-pre-line border-t border-white/5 mt-1">
                    {selectedTeam.ventureDescription}
                  </p>
                )}
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

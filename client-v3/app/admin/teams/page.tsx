"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface TeamMember {
  name: string;
  email: string;
  department?: string;
  roll?: string;
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/teams?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [statusFilter]);

  const updateTeamStatus = async (teamId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, status: newStatus }),
      });
      if (res.ok) {
        setTeams((prev) =>
          prev.map((t) =>
            t._id === teamId
              ? { ...t, status: newStatus as TeamRecord["status"] }
              : t
          )
        );
      }
    } catch (err) {
      console.error("Failed to update team status:", err);
    }
  };

  const toggleCheckIn = async (teamId: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, checkedIn: !current }),
      });
      if (res.ok) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId ? { ...t, checkedIn: !current } : t))
        );
      }
    } catch (err) {
      console.error("Failed to toggle check-in:", err);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      t.ventureName?.toLowerCase().includes(search.toLowerCase()) ||
      t.lead.name.toLowerCase().includes(search.toLowerCase()) ||
      t.lead.email.toLowerCase().includes(search.toLowerCase()) ||
      t.teamCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Teams & Venture Submissions
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Review venture proposals, track statuses, and verify on-stage attendance.
          </p>
        </div>

        <button
          onClick={fetchTeams}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search team name, venture idea, code, or leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#16161d] border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="flex gap-2">
          {["all", "confirmed", "pending", "waitlist", "disqualified"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 text-xs font-medium rounded-xl capitalize transition-colors cursor-pointer border ${
                statusFilter === st
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-[#16161d] text-neutral-300 border-white/15 hover:bg-[#202028] hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
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
                  <th className="py-3.5 px-4 font-semibold">Venture Idea</th>
                  <th className="py-3.5 px-4 font-semibold">Team Leader</th>
                  <th className="py-3.5 px-4 font-semibold">Roster</th>
                  <th className="py-3.5 px-4 font-semibold">Pitch Deck</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Check-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTeams.map((team) => (
                  <tr key={team._id} className="hover:bg-[#16161d]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{team.teamName}</div>
                      <div className="font-mono text-[10px] text-rose-400 font-bold">
                        {team.teamCode}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-neutral-200 truncate font-medium">
                        {team.ventureName || "General Impact Venture"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {team.submissionStatus === "submitted" ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Forming
                          </span>
                        )}
                        {team.eventId && (
                          <span className="text-[10px] text-neutral-400 truncate">
                            {team.eventId.title}
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

                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      <button
                        onClick={() => setSelectedTeam(team)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white hover:underline cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{1 + (team.members?.length || 0)} members</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      {team.pitchDeckUrl ? (
                        <a
                          href={team.pitchDeckUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
                        >
                          <span>Deck</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-neutral-500 font-mono text-[11px]">Pending</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={team.status}
                        onChange={(e) => updateTeamStatus(team._id, e.target.value)}
                        className={`text-[11px] font-mono font-semibold rounded-lg px-2.5 py-1 border bg-[#16161d] focus:outline-none cursor-pointer ${
                          team.status === "confirmed"
                            ? "text-emerald-400 border-emerald-500/30"
                            : team.status === "pending"
                            ? "text-amber-400 border-amber-500/30"
                            : team.status === "waitlist"
                            ? "text-blue-400 border-blue-500/30"
                            : "text-red-400 border-red-500/30"
                        }`}
                      >
                        <option value="confirmed" className="bg-[#16161d] text-white">Confirmed</option>
                        <option value="pending" className="bg-[#16161d] text-white">Pending</option>
                        <option value="waitlist" className="bg-[#16161d] text-white">Waitlist</option>
                        <option value="disqualified" className="bg-[#16161d] text-white">Disqualified</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleCheckIn(team._id, team.checkedIn)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold cursor-pointer transition-colors ${
                          team.checkedIn
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-[#16161d] text-neutral-300 border border-white/10 hover:bg-[#202028] hover:text-white"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{team.checkedIn ? "Checked In" : "Unchecked"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
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
                <div className="p-3 rounded-xl bg-[#16161d] border border-white/10 space-y-1">
                  <div className="text-white font-medium">{selectedTeam.lead.name}</div>
                  <div className="text-neutral-400 font-mono">{selectedTeam.lead.email}</div>
                  <div className="text-neutral-400">{selectedTeam.lead.department}</div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-white mb-2">Team Members:</div>
                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTeam.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#16161d] border border-white/10 space-y-0.5"
                      >
                        <div className="text-white font-medium">{m.name}</div>
                        <div className="text-neutral-400 font-mono">{m.email}</div>
                        {m.department && <div className="text-neutral-400">{m.department}</div>}
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

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Calendar,
  MapPin,
  Users,
  Download,
  Search,
  Clipboard,
  Mail,
  Phone,
  Check,
  Camera,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveCameraScannerModal from "./LiveCameraScannerModal";

interface TeamMember {
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  roll?: string;
  joinedAt?: string | Date;
}

interface TeamLead {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
}

interface RegisteredTeam {
  id: string;
  teamCode: string;
  teamName: string;
  ventureName?: string;
  lead: TeamLead;
  leadEmail?: string;
  membersCount: number;
  department: string;
  members: TeamMember[];
  status: "confirmed" | "disqualified";
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: string | Date | null;
  checkedIn: boolean;
  checkedInAt?: string | Date | null;
  registeredAt: string | Date;
}

interface EventItem {
  _id: string;
  title: string;
  tag: string;
  date: string;
  venue: string;
  description: string;
  registrationStatus: "open" | "closed" | "extended" | "upcoming";
  isPublished: boolean;
  maxTeams: number;
  registeredTeamsCount: number;
  registeredTeams?: RegisteredTeam[];
}

export default function LiveEventManager() {
  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [eventMeta, setEventMeta] = useState<EventItem | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"submitted" | "forming" | "all">("submitted");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "checked_in" | "not_checked_in"
  >("all");
  const [eventSearch, setEventSearch] = useState("");

  // Modals & Inspection
  const [inspectingTeam, setInspectingTeam] = useState<RegisteredTeam | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New Team Form State
  const [newTeam, setNewTeam] = useState({
    teamName: "",
    leadName: "",
    leadEmail: "",
    leadPhone: "",
    department: "Computer Science & Engineering (CSE)",
    roll: "",
    membersCount: 4,
    status: "confirmed" as RegisteredTeam["status"],
    members: [
      { name: "", email: "", phone: "", department: "", roll: "" },
      { name: "", email: "", phone: "", department: "", roll: "" },
      { name: "", email: "", phone: "", department: "", roll: "" },
    ],
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Listen to URL ?eventId= parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const evParam = params.get("eventId");
      if (evParam) {
        setSelectedEventId(evParam);
      }
    }
  }, []);

  const handleSelectEvent = useCallback((id: string | null) => {
    setSelectedEventId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set("eventId", id);
      } else {
        url.searchParams.delete("eventId");
      }
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // -------------------------------------------------------------
  // 1. Fetch Events List
  // -------------------------------------------------------------
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } else {
        showToast("Failed to fetch events list.", "error");
      }
    } catch (err) {
      console.error("Fetch events error:", err);
      showToast("Network error fetching events.", "error");
    } finally {
      setLoadingEvents(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // -------------------------------------------------------------
  // 2. Fetch Teams for Selected Event
  // -------------------------------------------------------------
  const fetchTeamsForEvent = useCallback(
    async (eventId: string) => {
      setLoadingTeams(true);
      try {
        const res = await fetch(`/api/admin/teams?eventId=${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setTeams(Array.isArray(data.teams) ? data.teams : []);
          setEventMeta(data.event || null);
        } else {
          showToast("Failed to fetch registered teams.", "error");
        }
      } catch (err) {
        console.error("Fetch teams error:", err);
        showToast("Network error fetching teams.", "error");
      } finally {
        setLoadingTeams(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (selectedEventId) {
      fetchTeamsForEvent(selectedEventId);
    }
  }, [selectedEventId, fetchTeamsForEvent]);

  // -------------------------------------------------------------
  // 3. Team Actions
  // -------------------------------------------------------------
  const handleToggleCheckIn = async (team: RegisteredTeam) => {
    if (!selectedEventId) return;
    setActionLoadingId(team.id);
    const nextCheckIn = !team.checkedIn;

    // Optimistic UI update
    setTeams((prev) =>
      prev.map((t) =>
        t.id === team.id
          ? {
              ...t,
              checkedIn: nextCheckIn,
              checkedInAt: nextCheckIn ? new Date().toISOString() : null,
            }
          : t
      )
    );
    if (inspectingTeam && inspectingTeam.id === team.id) {
      setInspectingTeam({
        ...inspectingTeam,
        checkedIn: nextCheckIn,
        checkedInAt: nextCheckIn ? new Date().toISOString() : null,
      });
    }

    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_check_in",
          teamId: team.id,
          eventId: selectedEventId,
          teamCode: team.teamCode,
          checkedIn: nextCheckIn,
        }),
      });

      if (res.ok) {
        showToast(
          nextCheckIn
            ? `✓ Team "${team.teamName}" marked as Checked In!`
            : `Check-in reverted for "${team.teamName}".`
        );
      } else {
        fetchTeamsForEvent(selectedEventId);
        showToast("Failed to update check-in status.", "error");
      }
    } catch (err) {
      console.error(err);
      fetchTeamsForEvent(selectedEventId);
      showToast("Network error updating check-in.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };



  const handleCreateWalkInTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    if (!newTeam.teamName.trim() || !newTeam.leadName.trim() || !newTeam.leadEmail.trim()) {
      showToast("Team Name, Leader Name, and Leader Email are required.", "error");
      return;
    }

    const validMembers = newTeam.members.filter((m) => m.name.trim() && m.email.trim());

    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          teamName: newTeam.teamName,
          leadName: newTeam.leadName,
          leadEmail: newTeam.leadEmail,
          leadPhone: newTeam.leadPhone,
          department: newTeam.department,
          roll: newTeam.roll,
          membersCount: validMembers.length + 1,
          members: validMembers,
          status: newTeam.status,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Team registered successfully!");
        setShowAddTeamModal(false);
        setNewTeam({
          teamName: "",
          leadName: "",
          leadEmail: "",
          leadPhone: "",
          department: "Computer Science & Engineering (CSE)",
          roll: "",
          membersCount: 4,
          status: "confirmed",
          members: [
            { name: "", email: "", phone: "", department: "", roll: "" },
            { name: "", email: "", phone: "", department: "", roll: "" },
            { name: "", email: "", phone: "", department: "", roll: "" },
          ],
        });
        fetchTeamsForEvent(selectedEventId);
      } else {
        showToast(data.error || "Failed to register team.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error creating team.", "error");
    }
  };

  // -------------------------------------------------------------
  // 4. Export CSV
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (!teams.length) {
      showToast("No teams to export.", "error");
      return;
    }

    const headers = [
      "Team Code",
      "Team Name",
      "Status",
      "Checked In",
      "Checked In Time",
      "Leader Name",
      "Leader Email",
      "Leader Phone",
      "Leader Department",
      "Leader Roll",
      "Total Members",
      "Team Members Roster",
      "Registered At",
    ];

    const rows = teams.map((t) => {
      const coFoundersStr = t.members
        .map((m) => `${m.name} (${m.email}${m.phone ? `, ${m.phone}` : ""})`)
        .join(" | ");

      const checkInFormatted = t.checkedInAt
        ? new Date(t.checkedInAt).toLocaleString()
        : t.checkedIn
        ? "Yes"
        : "No";

      return [
        `"${t.teamCode}"`,
        `"${t.teamName.replace(/"/g, '""')}"`,
        `"${t.status.toUpperCase()}"`,
        `"${t.checkedIn ? "CHECKED_IN" : "ABSENT"}"`,
        `"${checkInFormatted}"`,
        `"${t.lead.name.replace(/"/g, '""')}"`,
        `"${t.lead.email}"`,
        `"${t.lead.phone || ""}"`,
        `"${t.lead.department || t.department || ""}"`,
        `"${t.lead.roll || ""}"`,
        t.members.length + 1,
        `"${coFoundersStr.replace(/"/g, '""')}"`,
        `"${new Date(t.registeredAt).toLocaleString()}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `${(eventMeta?.title || "event").toLowerCase().replace(/\s+/g, "_")}_registered_teams.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${teams.length} teams to ${filename}`);
  };

  // Helper to determine if team is fully registered and submitted
  const isTeamSubmitted = (t: RegisteredTeam) => {
    return t.submissionStatus === "submitted" || Boolean(t.submittedAt);
  };

  const submittedCount = useMemo(
    () => teams.filter((t) => isTeamSubmitted(t)).length,
    [teams]
  );
  const formingCount = useMemo(
    () => teams.filter((t) => !isTeamSubmitted(t)).length,
    [teams]
  );

  // -------------------------------------------------------------
  // Filtered Teams Computation
  // -------------------------------------------------------------
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // 1. Registration Status Filter
      const isSubmitted = isTeamSubmitted(t);
      if (statusFilter === "submitted" && !isSubmitted) return false;
      if (statusFilter === "forming" && isSubmitted) return false;

      // 2. Attendance Check-In Filter
      if (activeFilter === "checked_in" && !t.checkedIn) return false;
      if (activeFilter === "not_checked_in" && t.checkedIn) return false;

      // 3. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.teamName.toLowerCase().includes(q);
      const matchCode = t.teamCode.toLowerCase().includes(q);
      const matchLead = t.lead.name.toLowerCase().includes(q) || t.lead.email.toLowerCase().includes(q);
      const matchDept = (t.department || "").toLowerCase().includes(q);
      const matchMembers = t.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").includes(q)
      );

      return matchName || matchCode || matchLead || matchDept || matchMembers;
    });
  }, [teams, statusFilter, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = teams.length;
    const checkedIn = teams.filter((t) => t.checkedIn).length;
    const remaining = total - checkedIn;
    const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    return { total, checkedIn, remaining, checkInRate };
  }, [teams]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const filteredEventsList = useMemo(() => {
    if (!eventSearch.trim()) return events;
    const q = eventSearch.toLowerCase().trim();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.tag || "").toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  return (
    <div className="space-y-8 animate-fadeIn text-white font-sans selection:bg-white/25 selection:text-white pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-[#0a1f18] text-emerald-200 shadow-emerald-900/30"
              : "border-rose-500/50 bg-[#240c10] text-rose-200 shadow-rose-900/30"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: ALL EVENTS HUB (When no event is selected)                        */}
      {/* ========================================================================= */}
      {!selectedEventId ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-google-sans)] text-white tracking-tight">
                  Live Event Operations
                </h1>
                <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs font-mono font-medium text-neutral-300">
                  {events.length} {events.length === 1 ? "Event" : "Events"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Select an active event to coordinate stage queue, inspect rosters, and monitor live check-ins.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Filter events by title, tag, or venue..."
                  className="w-full pl-8.5 pr-7 py-2 text-xs bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                />
                {eventSearch && (
                  <button
                    type="button"
                    onClick={() => setEventSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5 cursor-pointer"
                onClick={fetchEvents}
                title="Refresh events from database"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="py-20 text-center text-white/50 text-xs tracking-wider uppercase font-mono">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-neutral-500" />
              Loading events from database...
            </div>
          ) : filteredEventsList.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c12]/90 p-12 text-center shadow-xl">
              <Calendar className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)] mb-2">
                No Events Found
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mb-6">
                {eventSearch
                  ? `No events match "${eventSearch}". Try a different search term.`
                  : "You haven't created any events yet. Create your first event in the Events Manager to begin receiving team registrations."}
              </p>
              <Button asChild variant="default" size="default" className="font-[family-name:var(--font-google-sans)] font-semibold shadow-md">
                <Link href="/admin">
                  Go to Events Manager →
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEventsList.map((ev) => {
                const isRegOpen = ev.registrationStatus === "open";
                const isExtended = ev.registrationStatus === "extended";

                return (
                  <div
                    key={ev._id}
                    onClick={() => handleSelectEvent(ev._id)}
                    className="group relative rounded-2xl border border-white/10 bg-[#0c0c12]/90 hover:border-white/20 hover:bg-[#121219] p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer hover:shadow-2xl overflow-hidden"
                  >
                    {/* Ambient top highlight edge */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-rose-500/40 transition-all duration-500" />

                    <div>
                      {/* Status Ribbon */}
                      <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
                        {isRegOpen ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Registrations Open
                          </span>
                        ) : isExtended ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Extended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                            Closed
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-rose-300 transition-colors leading-snug line-clamp-1 mb-2.5 font-[family-name:var(--font-google-sans)]">
                        {ev.title}
                      </h3>

                      {/* Date & Venue */}
                      <div className="space-y-1.5 mb-3.5 text-xs text-neutral-300">
                        <div className="flex items-center gap-2" title={ev.date}>
                          <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium text-neutral-200 truncate">
                            {ev.date || "Date to be announced"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400" title={ev.venue}>
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">
                            {ev.venue || "Venue to be announced"}
                          </span>
                        </div>
                      </div>

                      {/* Description with fixed height for equal grid alignment */}
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-5 min-h-[2.5rem]">
                        {ev.description || (
                          <span className="italic text-neutral-600">No event description provided.</span>
                        )}
                      </p>
                    </div>

                    {/* Bottom Card Action */}
                    <div className="pt-3.5 border-t border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEvent(ev._id);
                        }}
                        className="h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white text-neutral-950 px-3.5 text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                      >
                        <span>Enter Event & Manage Teams</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: INSIDE THE EVENT (LIVE EVENT & TEAMS MANAGEMENT)                 */
        /* ========================================================================= */
        <div className="space-y-8 animate-fadeIn">
          {/* Top Breadcrumb & Switcher Bar */}
          <div className="rounded-2xl border border-white/15 bg-[#0e0e12] p-4 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  handleSelectEvent(null);
                  setTeams([]);
                  setSearchQuery("");
                }}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-bold text-white hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-[family-name:var(--font-google-sans)]"
                title="Return to Events list"
              >
                <span>←</span>
                <span>All Live Events</span>
              </button>

              <div className="h-5 w-[1px] bg-white/20 hidden sm:block" />

              {/* Event Switcher Dropdown */}
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="rounded-xl border border-white/20 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-white focus:border-white/50 focus:outline-none cursor-pointer appearance-none pr-8 font-[family-name:var(--font-google-sans)] shadow-inner"
                >
                  {events.map((e) => (
                    <option key={e._id} value={e._id} className="bg-neutral-900 text-white">
                      {e.title} ({e.tag})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-2 text-xs text-white/50">
                  ▾
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => selectedEventId && fetchTeamsForEvent(selectedEventId)}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sync team registrations from database"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Data</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export registered teams and attendance to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer font-[family-name:var(--font-google-sans)]"
                title="Open camera to scan participant attendance passes"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Scan Participant QR</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddTeamModal(true)}
                className="rounded-xl bg-white/[0.1] hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-bold text-white transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer font-[family-name:var(--font-google-sans)]"
              >
                <span>+</span>
                <span>Register Team</span>
              </button>
            </div>
          </div>

          {/* Event Header Card Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {eventMeta?.tag || selectedEvent?.tag || "Live Event"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      (eventMeta?.registrationStatus || selectedEvent?.registrationStatus) === "open"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "bg-white/10 border-white/20 text-white/60"
                    }`}
                  >
                    Registration: {eventMeta?.registrationStatus || selectedEvent?.registrationStatus || "open"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                  {eventMeta?.title || selectedEvent?.title || "Active Pitch Session"}
                </h2>
                <p className="text-xs text-white/60 font-sans mt-1">
                  Venue: <strong className="text-white">{eventMeta?.venue || selectedEvent?.venue || "Heritage Auditorium"}</strong> • Scheduled: {eventMeta?.date || selectedEvent?.date || "TBD"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2 text-xs font-mono text-white shadow-sm">
                  Total Teams: <strong className="text-emerald-300">{stats.total}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 4 Rich Stat Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Registered */}
            <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl hover:border-white/25 transition-all">
              <div className="flex items-center justify-between text-xs text-white/60 uppercase tracking-wider mb-2 font-mono">
                <span>Registered Teams</span>
                <Users className="h-4 w-4 text-neutral-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                {stats.total}
              </div>
              <p className="text-[11px] text-white/50">
                Total teams registered
              </p>
            </div>

            {/* Stat 2: Venue Checked-In */}
            <div className="rounded-3xl border border-emerald-500/30 bg-[#0a1f18] p-5 shadow-2xl shadow-emerald-950/20 hover:border-emerald-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-emerald-400 uppercase tracking-wider mb-2 font-mono">
                <span>Venue Checked-In</span>
                <span className="font-mono text-[10px] font-bold">PASS</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.checkedIn}
              </div>
              <p className="text-[11px] text-emerald-300/70">
                Arrived and verified on-site
              </p>
            </div>

            {/* Stat 3: Awaiting Arrival */}
            <div className="rounded-3xl border border-amber-500/30 bg-[#241a08] p-5 shadow-2xl shadow-amber-950/20 hover:border-amber-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-amber-400 uppercase tracking-wider mb-2 font-mono">
                <span>Awaiting Arrival</span>
                <span className="font-mono text-[10px] font-bold">PENDING</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.remaining}
              </div>
              <p className="text-[11px] text-amber-300/70">
                Teams yet to check in
              </p>
            </div>

            {/* Stat 4: Check-in Attendance Rate */}
            <div className="rounded-3xl border border-sky-500/30 bg-[#081a2e] p-5 shadow-2xl shadow-sky-950/20 hover:border-sky-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-sky-400 uppercase tracking-wider mb-2 font-mono">
                <span>Attendance Rate</span>
                <span className="font-mono text-[10px] font-bold">% RATE</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-sky-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.checkInRate}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.checkInRate}%` }}
                />
              </div>
              <p className="text-[11px] text-sky-300/70 mt-1">
                {stats.checkedIn} of {stats.total} present
              </p>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Team, Code, Leader, Member email..."
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-xs text-white/50 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="text-xs text-white/60 font-mono self-end sm:self-auto">
                Showing <strong className="text-white">{filteredTeams.length}</strong> of{" "}
                <strong className="text-white">{teams.length}</strong> teams
              </div>
            </div>

            {/* View Tabs & Live Counts Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              {/* Sleek Segmented Control for Registration Status (Matching Teams & Rosters) */}
              <div className="inline-flex items-center p-1 rounded-full bg-black/70 border border-white/10 w-fit backdrop-blur-md shadow-inner">
                <button
                  type="button"
                  onClick={() => setStatusFilter("submitted")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 ${
                    statusFilter === "submitted"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>Fully Registered</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                      statusFilter === "submitted"
                        ? "bg-neutral-200 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {submittedCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("forming")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 ${
                    statusFilter === "forming"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>Forming</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                      statusFilter === "forming"
                        ? "bg-neutral-200 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {formingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 ${
                    statusFilter === "all"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>All Teams</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                      statusFilter === "all"
                        ? "bg-neutral-200 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {teams.length}
                  </span>
                </button>
              </div>

              {/* Attendance Check-In Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                    activeFilter === "all"
                      ? "bg-white text-black font-bold shadow-md shadow-white/10 scale-105"
                      : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  All Teams ({stats.total})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("checked_in")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                    activeFilter === "checked_in"
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-105"
                      : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  Checked In ({stats.checkedIn})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("not_checked_in")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                    activeFilter === "not_checked_in"
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105"
                      : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  Not Checked In ({stats.remaining})
                </button>
              </div>
            </div>
          </div>

          {/* Registered Teams Grid */}
          {loadingTeams ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mb-4" />
              <p className="text-sm text-white/50 font-mono">Loading registered teams for this event...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-12 text-center shadow-2xl">
              <Users className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)] mb-2">
                {statusFilter === "submitted" && submittedCount === 0
                  ? "No Fully Registered Teams"
                  : "No Teams in this View"}
              </h3>
              <p className="text-xs text-white/60 max-w-md mx-auto mb-6">
                {searchQuery
                  ? `No teams match "${searchQuery}".`
                  : teams.length === 0
                  ? "No teams have registered for this event yet. You can add walk-in teams using the 'Register Team' button."
                  : statusFilter === "submitted" && formingCount > 0
                  ? `There are currently ${formingCount} team(s) forming rosters. Switch to 'Forming' or 'All Teams' to view them.`
                  : "No teams match the selected filter tab."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {statusFilter === "submitted" && formingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("forming")}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer border border-white/15 font-[family-name:var(--font-google-sans)]"
                  >
                    View Forming Teams ({formingCount})
                  </button>
                )}
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  className="font-[family-name:var(--font-google-sans)]"
                  onClick={() => setShowAddTeamModal(true)}
                >
                  + Register First Walk-In Team
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] hover:bg-[#15151c] p-6 hover:border-white/40 hover:shadow-[0_20px_45px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col justify-between shadow-2xl"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] ${
                      team.checkedIn
                        ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                        : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    }`}
                  />

                  <div>
                    {/* Header: Team Code, Status Dropdown, Check-In Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      {/* Code Badge & Submission Status */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-wider rounded-xl bg-white/10 border border-white/20 text-white px-3 py-1 shadow-sm">
                          {team.teamCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(team.teamCode);
                            showToast(`Copied code "${team.teamCode}" to clipboard!`);
                          }}
                          className="h-7 w-7 rounded-lg bg-white/[0.08] hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors text-xs cursor-pointer"
                          title="Copy Team Code"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                        {isTeamSubmitted(team) ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                            • Submitted
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                            • Forming
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team Name */}
                    <div className="mb-4">
                      <h3 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)] mb-2">
                        {team.teamName}
                      </h3>

                      <span className="inline-block rounded-lg bg-white/[0.05] border border-white/10 px-2.5 py-0.5 text-[10px] text-white/80 font-mono">
                        {team.department || team.lead.department || "Heritage Institute of Technology"}
                      </span>
                    </div>

                    {/* Leader Details Card */}
                    <div className="rounded-2xl border border-white/10 bg-[#16161d] p-4 mb-4 shadow-inner">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider font-mono">
                          Team Leader
                        </span>
                        {team.lead.roll && (
                          <span className="text-[10px] font-mono text-white/50">
                            Roll: {team.lead.roll}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
                        {team.lead.name}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70 font-mono">
                        <a
                          href={`mailto:${team.lead.email}`}
                          className="hover:text-white transition-colors flex items-center gap-1"
                        >
                          <Mail className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="truncate max-w-[180px]">{team.lead.email}</span>
                        </a>
                        {team.lead.phone && (
                          <a
                            href={`tel:${team.lead.phone}`}
                            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{team.lead.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Team Members Roster */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-2">
                        <span>Team Members:</span>
                        <span>Total Roster: {team.members.length + 1}</span>
                      </div>

                      {team.members.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {team.members.map((member, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-white/10 bg-[#16161d] p-2.5 text-xs flex flex-col justify-between shadow-inner"
                            >
                              <div className="font-semibold text-white truncate font-[family-name:var(--font-google-sans)]">
                                {member.name || "Team Member"}
                              </div>
                              <div className="text-[11px] text-white/60 truncate font-mono">
                                {member.email || "No email"}
                              </div>
                              {member.department && (
                                <div className="text-[10px] text-white/45 truncate">
                                  {member.department}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-[#16161d] p-3 text-xs text-white/50 italic">
                          No additional team members joined yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-white/50 font-mono">
                      {team.checkedInAt
                        ? `Checked in at ${new Date(team.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : `Registered ${new Date(team.registeredAt).toLocaleDateString()}`}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingTeam(team)}
                        className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                        title="View complete dossier"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL 1: TEAM FULL DOSSIER INSPECTOR */}
          {inspectingTeam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setInspectingTeam(null)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="border-b border-white/10 pb-6 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold rounded-xl bg-white/10 border border-white/20 text-white px-3 py-1">
                      {inspectingTeam.teamCode}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                        inspectingTeam.checkedIn
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/10 border-white/20 text-white/60"
                      }`}
                    >
                      {inspectingTeam.checkedIn ? "✓ Verified Check-In" : "Pending Check-In"}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    {inspectingTeam.teamName}
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    Event: {eventMeta?.title || "OnCampus"} • Department: {inspectingTeam.department}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 mb-6 shadow-inner">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/60 mb-3">
                    Team Leader Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-white/40 block">Full Name:</span>
                      <strong className="text-white text-sm font-sans">{inspectingTeam.lead.name}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block">Email Address:</span>
                      <a
                        href={`mailto:${inspectingTeam.lead.email}`}
                        className="text-white hover:underline"
                      >
                        {inspectingTeam.lead.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-white/40 block">Phone Number:</span>
                      <a
                        href={`tel:${inspectingTeam.lead.phone}`}
                        className="text-emerald-400 hover:underline"
                      >
                        {inspectingTeam.lead.phone || "Not provided"}
                      </a>
                    </div>
                    <div>
                      <span className="text-white/40 block">Roll / Student ID:</span>
                      <span className="text-white">{inspectingTeam.lead.roll || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/60 mb-3">
                    Team Members ({inspectingTeam.members.length})
                  </h4>

                  {inspectingTeam.members.length > 0 ? (
                    <div className="space-y-3">
                      {inspectingTeam.members.map((member, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-white/10 bg-[#16161d] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-inner"
                        >
                          <div>
                            <div className="text-sm font-bold text-white font-sans">
                              {member.name || `Member #${i + 1}`}
                            </div>
                            <div className="text-white/60">{member.email || "No email"}</div>
                            {member.department && (
                              <div className="text-[11px] text-white/40">{member.department}</div>
                            )}
                          </div>
                          <div className="text-right sm:text-right text-white/50 text-[11px]">
                            {member.phone && (
                              <div className="flex items-center gap-1 justify-end">
                                <Phone className="h-3 w-3 text-emerald-400" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.roll && <div>Roll: {member.roll}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">
                      No additional team members registered under this team code.
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={actionLoadingId === inspectingTeam.id}
                    onClick={() => handleToggleCheckIn(inspectingTeam)}
                    className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      actionLoadingId === inspectingTeam.id
                        ? "opacity-50 cursor-not-allowed bg-white/10 text-white/50"
                        : inspectingTeam.checkedIn
                        ? "bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300"
                        : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                    }`}
                  >
                    {actionLoadingId === inspectingTeam.id
                      ? "Updating..."
                      : inspectingTeam.checkedIn
                      ? "Undo Check-In"
                      : "✓ Mark Verified Check-In"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingTeam(null)}
                      className="rounded-xl bg-white/[0.08] hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: REGISTER WALK-IN TEAM */}
          {showAddTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5">
                    Walk-In / Stage Registration
                  </span>
                  <h2 className="text-2xl font-black text-white font-[family-name:var(--font-google-sans)] mt-2">
                    Register Team for {eventMeta?.title || "Event"}
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    An official team code (e.g. HULT-XXXX) will be generated automatically upon submission.
                  </p>
                </div>

                <form onSubmit={handleCreateWalkInTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Team Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeam.teamName}
                      onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                      placeholder="e.g. SolarBloom"
                      className="w-full rounded-xl border border-white/15 bg-[#16161d] px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none shadow-inner"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-[#16161d] p-4 space-y-3 shadow-inner">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Team Leader Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Leader Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeam.leadName}
                          onChange={(e) => setNewTeam({ ...newTeam, leadName: e.target.value })}
                          placeholder="Leader full name"
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Leader Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newTeam.leadEmail}
                          onChange={(e) => setNewTeam({ ...newTeam, leadEmail: e.target.value })}
                          placeholder="leader@heritageit.edu.in"
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          value={newTeam.leadPhone}
                          onChange={(e) => setNewTeam({ ...newTeam, leadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          placeholder="10-digit phone"
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Department / Branch
                        </label>
                        <input
                          type="text"
                          value={newTeam.department}
                          onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
                          placeholder="CSE, ECE, Biotechnology..."
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-[#16161d] p-4 space-y-3 shadow-inner">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Team Members (Optional)
                    </span>

                    {newTeam.members.map((member, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={`Member #${idx + 1} Name`}
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...newTeam.members];
                            updated[idx].name = e.target.value;
                            setNewTeam({ ...newTeam, members: updated });
                          }}
                          className="rounded-xl border border-white/15 bg-[#121217] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none shadow-inner"
                        />
                        <input
                          type="email"
                          placeholder={`Member #${idx + 1} Email`}
                          value={member.email}
                          onChange={(e) => {
                            const updated = [...newTeam.members];
                            updated[idx].email = e.target.value;
                            setNewTeam({ ...newTeam, members: updated });
                          }}
                          className="rounded-xl border border-white/15 bg-[#121217] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setShowAddTeamModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="default"
                      className="font-[family-name:var(--font-google-sans)]"
                    >
                      Confirm Registration
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* ========================================================================= */}
          {/* MODAL 2: LIVE CAMERA PARTICIPANT QR SCANNER MODAL                         */}
          {/* ========================================================================= */}
          {selectedEventId && (
            <LiveCameraScannerModal
              isOpen={showCameraScanner}
              eventId={selectedEventId}
              eventTitle={eventMeta?.title || selectedEvent?.title}
              onClose={() => setShowCameraScanner(false)}
              onCheckInTeam={async (scannedCode) => {
                const matchedTeam = teams.find(
                  (t) => t.teamCode.toUpperCase() === scannedCode.toUpperCase()
                );

                try {
                  const res = await fetch("/api/admin/teams", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "toggle_check_in",
                      teamId: matchedTeam?.id,
                      eventId: selectedEventId,
                      teamCode: scannedCode,
                      checkedIn: true,
                    }),
                  });

                  const data = await res.json();
                  if (res.ok) {
                    // Update local teams list
                    if (matchedTeam) {
                      setTeams((prev) =>
                        prev.map((t) =>
                          t.id === matchedTeam.id
                            ? { ...t, checkedIn: true, checkedInAt: new Date().toISOString() }
                            : t
                        )
                      );
                    } else {
                      fetchTeamsForEvent(selectedEventId);
                    }

                    return {
                      success: true,
                      message: `Team "${matchedTeam?.teamName || scannedCode}" marked present!`,
                      teamName: matchedTeam?.teamName || data.team?.teamName,
                    };
                  } else {
                    return {
                      success: false,
                      message: data.error || `Failed to check in team (${scannedCode}).`,
                    };
                  }
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "Network error processing check-in.";
                  return {
                    success: false,
                    message,
                  };
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

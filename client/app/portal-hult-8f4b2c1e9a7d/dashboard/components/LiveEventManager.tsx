"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  RefreshCw,
  X,
  Calendar,
  MapPin,
  Users,
  Download,
  Printer,
  Search,
  Clipboard,
  Mail,
  Phone,
  Shield,
  Trash2,
  Check,
  Camera,
  ScanLine,
  Lightbulb,
} from "lucide-react";
import LiveCameraScannerModal from "@/components/admin/LiveCameraScannerModal";

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
  status: "confirmed" | "pending" | "waitlist" | "disqualified";
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
  registeredTeams?: any[];
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
  const [eventMeta, setEventMeta] = useState<any>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "confirmed" | "checked_in" | "not_checked_in" | "pending" | "waitlist"
  >("all");
  const [eventSearch, setEventSearch] = useState("");

  // Modals & Inspection
  const [inspectingTeam, setInspectingTeam] = useState<RegisteredTeam | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [graceTeam, setGraceTeam] = useState<RegisteredTeam | null>(null);
  const [graceNote, setGraceNote] = useState("");
  const [graceLoading, setGraceLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New Team Form State
  const [newTeam, setNewTeam] = useState({
    teamName: "",
    ventureName: "",
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

  const handleUpdateStatus = async (team: RegisteredTeam, newStatus: RegisteredTeam["status"]) => {
    if (!selectedEventId || team.status === newStatus) return;
    setActionLoadingId(team.id);

    setTeams((prev) =>
      prev.map((t) => (t.id === team.id ? { ...t, status: newStatus } : t))
    );
    if (inspectingTeam && inspectingTeam.id === team.id) {
      setInspectingTeam({ ...inspectingTeam, status: newStatus });
    }

    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          teamId: team.id,
          eventId: selectedEventId,
          teamCode: team.teamCode,
          status: newStatus,
        }),
      });

      if (res.ok) {
        showToast(`Team "${team.teamName}" status set to ${newStatus.toUpperCase()}`);
      } else {
        fetchTeamsForEvent(selectedEventId);
        showToast("Failed to update team status.", "error");
      }
    } catch (err) {
      console.error(err);
      fetchTeamsForEvent(selectedEventId);
      showToast("Error updating status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTeam = async (team: RegisteredTeam) => {
    if (!selectedEventId) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to remove team "${team.teamName}" (${team.teamCode}) from this event?`
    );
    if (!confirmDelete) return;

    setActionLoadingId(team.id);
    try {
      const res = await fetch(
        `/api/admin/teams?teamId=${team.id}&eventId=${selectedEventId}&teamCode=${team.teamCode}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setTeams((prev) => prev.filter((t) => t.id !== team.id));
        if (inspectingTeam?.id === team.id) setInspectingTeam(null);
        showToast(`Team "${team.teamName}" was removed.`);
      } else {
        showToast("Failed to delete team.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting team.", "error");
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
          ventureName: newTeam.ventureName,
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
          ventureName: "",
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
      "Venture / Idea Name",
      "Status",
      "Checked In",
      "Checked In Time",
      "Leader Name",
      "Leader Email",
      "Leader Phone",
      "Leader Department",
      "Leader Roll",
      "Total Members",
      "Co-Founders Roster",
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
        `"${(t.ventureName || "").replace(/"/g, '""')}"`,
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

  // -------------------------------------------------------------
  // Admin Grace Clearance Handler (/lgic)
  // -------------------------------------------------------------
  const handleGraceClearance = async (action: "approve" | "revoke") => {
    if (!selectedEventId || !graceTeam) return;
    setGraceLoading(true);

    try {
      const res = await fetch("/api/lgic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          teamCode: graceTeam.teamCode,
          action,
          note: graceNote.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Grace clearance ${action}d successfully!`);
        setShowGraceModal(false);
        setGraceNote("");
        setGraceTeam(null);
        fetchTeamsForEvent(selectedEventId);
      } else {
        showToast(data.error || `Failed to ${action} grace clearance.`, "error");
      }
    } catch (err) {
      console.error("Grace clearance error:", err);
      showToast("Network error executing grace clearance.", "error");
    } finally {
      setGraceLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Filtered Teams Computation
  // -------------------------------------------------------------
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (activeFilter === "confirmed" && t.status !== "confirmed") return false;
      if (activeFilter === "checked_in" && !t.checkedIn) return false;
      if (activeFilter === "not_checked_in" && t.checkedIn) return false;
      if (activeFilter === "pending" && t.status !== "pending") return false;
      if (activeFilter === "waitlist" && t.status !== "waitlist") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.teamName.toLowerCase().includes(q);
      const matchVenture = (t.ventureName || "").toLowerCase().includes(q);
      const matchCode = t.teamCode.toLowerCase().includes(q);
      const matchLead = t.lead.name.toLowerCase().includes(q) || t.lead.email.toLowerCase().includes(q);
      const matchDept = (t.department || "").toLowerCase().includes(q);
      const matchMembers = t.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").includes(q)
      );

      return matchName || matchVenture || matchCode || matchLead || matchDept || matchMembers;
    });
  }, [teams, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = teams.length;
    const confirmed = teams.filter((t) => t.status === "confirmed").length;
    const checkedIn = teams.filter((t) => t.checkedIn).length;
    const pending = teams.filter((t) => t.status === "pending").length;
    const waitlist = teams.filter((t) => t.status === "waitlist").length;
    const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    return { total, confirmed, checkedIn, pending, waitlist, checkInRate };
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
    <div className="space-y-8 animate-fadeIn text-white font-sans selection:bg-[#f20089] selection:text-white pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-emerald-950/90 text-emerald-200 shadow-emerald-900/30"
              : "border-rose-500/50 bg-rose-950/90 text-rose-200 shadow-rose-900/30"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: ALL EVENTS HUB (When no event is selected)                        */}
      {/* ========================================================================= */}
      {!selectedEventId ? (
        <div className="space-y-8">
          {/* Header Banner with Rich Translucent Glassmorphism */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-[#f20089]/[0.08] p-8 sm:p-12 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089] to-purple-500" />
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#f20089]/20 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-600/20 blur-[100px]" />

            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 mb-4 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Event Operations Console
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-[family-name:var(--font-google-sans)] tracking-tight mb-3">
                Live Event Management
              </h1>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans mb-6">
                Step inside any active event to review registered teams, inspect co-founder rosters, manage team statuses, and orchestrate real-time attendee check-ins.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/portal-hult-8f4b2c1e9a7d/dashboard"
                  className="rounded-2xl bg-gradient-to-r from-[#f20089] to-purple-600 hover:from-[#ff1a9b] hover:to-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 flex items-center gap-2 font-[family-name:var(--font-google-sans)]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Event in Events Manager</span>
                </Link>
                <button
                  type="button"
                  onClick={fetchEvents}
                  className="rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Events</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search bar & Section Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)]">
                Select an Event to Manage ({events.length})
              </h2>
              <p className="text-xs text-white/60">
                Click "Enter Event & Manage Teams" on any event card below to open its live management control room.
              </p>
            </div>

            <div className="w-full sm:w-80 relative">
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events by title, tag, or venue..."
                className="w-full rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-[#f20089] focus:outline-none focus:ring-1 focus:ring-[#f20089] backdrop-blur-xl shadow-inner transition-all"
              />
              {eventSearch && (
                <button
                  type="button"
                  onClick={() => setEventSearch("")}
                  className="absolute right-3 top-2.5 text-xs text-white/50 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#f20089] border-t-transparent mb-4" />
              <p className="text-sm text-white/50 font-mono">Loading events from database...</p>
            </div>
          ) : filteredEventsList.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-12 text-center backdrop-blur-2xl shadow-xl">
              <Calendar className="h-10 w-10 text-[#f20089] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)] mb-2">
                No Events Found
              </h3>
              <p className="text-xs text-white/60 max-w-md mx-auto mb-6">
                {eventSearch
                  ? `No events match "${eventSearch}". Try a different search term.`
                  : "You haven't created any events yet. Create your first event in the Events Manager to begin receiving team registrations."}
              </p>
              <Link
                href="/portal-hult-8f4b2c1e9a7d/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#f20089] to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 font-[family-name:var(--font-google-sans)]"
              >
                Go to Events Manager →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEventsList.map((ev) => (
                <div
                  key={ev._id}
                  className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/30 p-6 backdrop-blur-2xl hover:border-[#f20089]/60 hover:shadow-[0_20px_45px_rgba(242,0,137,0.18)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f20089] to-transparent" />

                  <div>
                    {/* Tags & Status */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pink-300">
                        {ev.tag || "Event"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          ev.registrationStatus === "open"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : ev.registrationStatus === "extended"
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                            : "bg-white/10 border-white/20 text-white/60"
                        }`}
                      >
                        {ev.registrationStatus}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors mb-2 line-clamp-2">
                      {ev.title}
                    </h3>

                    {/* Venue & Date */}
                    <div className="space-y-1.5 text-xs text-white/70 mb-4 font-mono">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-pink-400" />
                        <span className="truncate">{ev.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-pink-400" />
                        <span>{ev.date}</span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-6 font-sans">
                      {ev.description}
                    </p>
                  </div>

                  {/* Footer Metrics & Button */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono mb-4">
                      <span className="text-white/60">Registered Teams:</span>
                      <span className="font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                        {ev.registeredTeamsCount || 0} / {ev.maxTeams || 40}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectEvent(ev._id)}
                      className="w-full rounded-2xl bg-gradient-to-r from-[#f20089] to-purple-600 hover:from-[#ff1a9b] hover:to-purple-500 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/25 hover:shadow-[#f20089]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer font-[family-name:var(--font-google-sans)]"
                    >
                      <span>Enter Event & Manage Teams</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: INSIDE THE EVENT (LIVE EVENT & TEAMS MANAGEMENT)                 */
        /* ========================================================================= */
        <div className="space-y-8 animate-fadeIn">
          {/* Top Breadcrumb & Switcher Bar */}
          <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.08] backdrop-blur-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  handleSelectEvent(null);
                  setTeams([]);
                  setSearchQuery("");
                }}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-bold text-white hover:text-[#f20089] transition-all flex items-center gap-1.5 cursor-pointer font-[family-name:var(--font-google-sans)]"
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
                  className="rounded-xl border border-white/20 bg-white/[0.08] hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-white focus:border-[#f20089] focus:outline-none cursor-pointer appearance-none pr-8 font-[family-name:var(--font-google-sans)] shadow-inner"
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
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-[#f20089]/[0.06] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089] to-transparent" />
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#f20089]/15 blur-3xl" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pink-300">
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

                <h1 className="text-2xl sm:text-4xl font-black text-white font-[family-name:var(--font-google-sans)] tracking-tight">
                  {eventMeta?.title || selectedEvent?.title || "Event Management"}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70 font-mono mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-pink-400" />
                    <span>{eventMeta?.venue || selectedEvent?.venue}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-pink-400" />
                    <span>{eventMeta?.date || selectedEvent?.date}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-mono text-white backdrop-blur-md shadow-sm">
                  Capacity: <strong className="text-emerald-300">{stats.total}</strong> / {eventMeta?.maxTeams || 40} Teams
                </span>
              </div>
            </div>
          </div>

          {/* 4 Rich Glassmorphism Stat Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Registered */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-white/[0.01] p-5 backdrop-blur-2xl shadow-xl hover:border-white/25 transition-all">
              <div className="flex items-center justify-between text-xs text-white/60 uppercase tracking-wider mb-2 font-mono">
                <span>Registered Teams</span>
                <Users className="h-4 w-4 text-pink-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                {stats.total}
              </div>
              <p className="text-[11px] text-white/50">
                {eventMeta?.maxTeams ? `${eventMeta.maxTeams - stats.total} slots remaining` : "Total teams signed up"}
              </p>
            </div>

            {/* Stat 2: Confirmed */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent p-5 backdrop-blur-2xl shadow-xl shadow-emerald-950/20 hover:border-emerald-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-emerald-400 uppercase tracking-wider mb-2 font-mono">
                <span>Confirmed Teams</span>
                <span>✓</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.confirmed}
              </div>
              <p className="text-[11px] text-emerald-300/70">
                {stats.total > 0 ? `${Math.round((stats.confirmed / stats.total) * 100)}% approved for pitch` : "Ready for stage"}
              </p>
            </div>

            {/* Stat 3: Venue Checked-In */}
            <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-500/[0.12] via-sky-500/[0.04] to-transparent p-5 backdrop-blur-2xl shadow-xl shadow-sky-950/20 hover:border-sky-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-sky-400 uppercase tracking-wider mb-2 font-mono">
                <span>Venue Checked-In</span>
                <span>🪪</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-sky-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.checkedIn} / {stats.total}
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.checkInRate}%` }}
                />
              </div>
              <p className="text-[11px] text-sky-300/70 mt-1">
                {stats.checkInRate}% arrived on-site
              </p>
            </div>

            {/* Stat 4: Pending / Waitlist */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.12] via-amber-500/[0.04] to-transparent p-5 backdrop-blur-2xl shadow-xl shadow-amber-950/20 hover:border-amber-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-amber-400 uppercase tracking-wider mb-2 font-mono">
                <span>Pending / Waitlist</span>
                <span>⏳</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.pending + stats.waitlist}
              </div>
              <p className="text-[11px] text-amber-300/70">
                {stats.pending} pending, {stats.waitlist} waitlisted
              </p>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <span className="absolute left-3.5 top-3 text-white/50 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Team, Venture, Code, Leader, Member email..."
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-[#f20089] focus:outline-none focus:ring-1 focus:ring-[#f20089] backdrop-blur-xl shadow-inner transition-all"
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

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                  activeFilter === "all"
                    ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30 scale-105"
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
                Not Checked In ({stats.total - stats.checkedIn})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("confirmed")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                  activeFilter === "confirmed"
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 scale-105"
                    : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                Confirmed ({stats.confirmed})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("pending")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                  activeFilter === "pending"
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105"
                    : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                Pending ({stats.pending})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("waitlist")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer font-[family-name:var(--font-google-sans)] ${
                  activeFilter === "waitlist"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105"
                    : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                Waitlist ({stats.waitlist})
              </button>
            </div>
          </div>

          {/* Registered Teams Grid */}
          {loadingTeams ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#f20089] border-t-transparent mb-4" />
              <p className="text-sm text-white/50 font-mono">Loading registered teams for this event...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-12 text-center backdrop-blur-2xl shadow-xl">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)] mb-2">
                No Teams in this View
              </h3>
              <p className="text-xs text-white/60 max-w-md mx-auto mb-6">
                {searchQuery
                  ? `No teams match "${searchQuery}".`
                  : teams.length === 0
                  ? "No teams have registered for this event yet. You can add walk-in teams using the 'Register Team' button."
                  : "No teams match the selected filter tab."}
              </p>
              <button
                type="button"
                onClick={() => setShowAddTeamModal(true)}
                className="rounded-2xl bg-gradient-to-r from-[#f20089] to-purple-600 hover:from-[#ff1a9b] hover:to-purple-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)]"
              >
                + Register First Walk-In Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/30 p-6 backdrop-blur-2xl hover:border-[#f20089]/60 hover:shadow-[0_20px_45px_rgba(242,0,137,0.15)] transition-all duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] ${
                      team.checkedIn
                        ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                        : "bg-gradient-to-r from-transparent via-[#f20089] to-transparent"
                    }`}
                  />

                  <div>
                    {/* Header: Team Code, Status Dropdown, Check-In Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      {/* Code Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold tracking-wider rounded-xl bg-[#f20089]/15 border border-[#f20089]/40 text-pink-300 px-3 py-1 shadow-sm">
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
                      </div>

                      {/* Status Selector & Check-In Status */}
                      <div className="flex items-center gap-2">
                        {/* Check-In Pill */}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                            team.checkedIn
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-white/[0.06] border-white/15 text-white/60"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              team.checkedIn ? "bg-emerald-400 animate-ping" : "bg-white/40"
                            }`}
                          />
                          {team.checkedIn ? "Checked In" : "Not Checked In"}
                        </span>

                        {/* Status Select */}
                        <select
                          value={team.status}
                          disabled={actionLoadingId === team.id}
                          onChange={(e) =>
                            handleUpdateStatus(team, e.target.value as RegisteredTeam["status"])
                          }
                          className={`rounded-full border text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-neutral-900 cursor-pointer focus:outline-none ${
                            team.status === "confirmed"
                              ? "border-emerald-500/40 text-emerald-300"
                              : team.status === "pending"
                              ? "border-amber-500/40 text-amber-300"
                              : team.status === "waitlist"
                              ? "border-blue-500/40 text-blue-300"
                              : "border-rose-500/40 text-rose-300"
                          }`}
                        >
                          <option value="confirmed" className="bg-neutral-900 text-emerald-300">
                            Confirmed
                          </option>
                          <option value="pending" className="bg-neutral-900 text-amber-300">
                            Pending
                          </option>
                          <option value="waitlist" className="bg-neutral-900 text-blue-300">
                            Waitlist
                          </option>
                          <option value="disqualified" className="bg-neutral-900 text-rose-300">
                            Disqualified
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Team Name & Venture Concept */}
                    <div className="mb-4">
                      <h3 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                        {team.teamName}
                      </h3>
                      {team.ventureName ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#f20089] font-medium mb-2">
                          <Lightbulb className="h-3.5 w-3.5 text-[#f20089]" />
                          <span className="truncate">{team.ventureName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-white/40 italic mb-2 block">
                          No venture title specified
                        </span>
                      )}

                      <span className="inline-block rounded-lg bg-white/[0.05] border border-white/10 px-2.5 py-0.5 text-[10px] text-white/80 font-mono">
                        {team.department || team.lead.department || "Heritage Institute of Technology"}
                      </span>
                    </div>

                    {/* Leader Details Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 mb-4 backdrop-blur-md">
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
                          className="hover:text-[#f20089] transition-colors flex items-center gap-1"
                        >
                          <Mail className="h-3.5 w-3.5 text-pink-400" />
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

                    {/* Co-Founders / Members Roster */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-2">
                        <span>Co-Founders / Members ({team.members.length}):</span>
                        <span>Total Roster: {team.members.length + 1}</span>
                      </div>

                      {team.members.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {team.members.map((member, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs flex flex-col justify-between backdrop-blur-sm"
                            >
                              <div className="font-semibold text-white truncate font-[family-name:var(--font-google-sans)]">
                                {member.name || "Co-Founder"}
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
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/50 italic">
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
                        onClick={() => {
                          setGraceTeam(team);
                          setShowGraceModal(true);
                        }}
                        className="rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="Issue or revoke admin grace clearance for Hult Ascend"
                      >
                        <Shield className="h-3.5 w-3.5 text-purple-400" />
                        <span>Grace</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === team.id}
                        onClick={() => handleToggleCheckIn(team)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          team.checkedIn
                            ? "bg-white/[0.08] hover:bg-rose-500/20 text-white/80 hover:text-rose-300 border border-white/20"
                            : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/30 hover:scale-105"
                        }`}
                      >
                        {team.checkedIn ? "Undo Check-In" : "✓ Mark Checked In"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectingTeam(team)}
                        className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                        title="View complete dossier"
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === team.id}
                        onClick={() => handleDeleteTeam(team)}
                        className="h-8 w-8 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/40 text-white/50 hover:text-rose-300 transition-all flex items-center justify-center text-xs cursor-pointer"
                        title="Remove team"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL 1: TEAM FULL DOSSIER INSPECTOR */}
          {inspectingTeam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-neutral-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-3xl">
                <button
                  type="button"
                  onClick={() => setInspectingTeam(null)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="border-b border-white/10 pb-6 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold rounded-xl bg-[#f20089]/20 border border-[#f20089]/40 text-pink-300 px-3 py-1">
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
                  {inspectingTeam.ventureName && (
                    <p className="text-sm text-[#f20089] font-medium mt-1 inline-flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-[#f20089]" />
                      <span>Project: {inspectingTeam.ventureName}</span>
                    </p>
                  )}
                  <p className="text-xs text-white/50 font-mono mt-1">
                    Event: {eventMeta?.title || "OnCampus"} • Department: {inspectingTeam.department}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 mb-6 backdrop-blur-md">
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
                        className="text-[#f20089] hover:underline"
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
                    Co-Founders & Team Members ({inspectingTeam.members.length})
                  </h4>

                  {inspectingTeam.members.length > 0 ? (
                    <div className="space-y-3">
                      {inspectingTeam.members.map((member, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
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
                            {member.phone && <div>📞 {member.phone}</div>}
                            {member.roll && <div>Roll: {member.roll}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">
                      No additional co-founders registered under this team code.
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleCheckIn(inspectingTeam)}
                    className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      inspectingTeam.checkedIn
                        ? "bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300"
                        : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                    }`}
                  >
                    {inspectingTeam.checkedIn ? "Undo Check-In" : "✓ Mark Verified Check-In"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteTeam(inspectingTeam);
                        setInspectingTeam(null);
                      }}
                      className="rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-300 cursor-pointer"
                    >
                      Delete Team
                    </button>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-neutral-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-3xl">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 text-pink-300 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-white/70 mb-1">
                        Team Name <span className="text-[#f20089]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newTeam.teamName}
                        onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                        placeholder="e.g. SolarBloom"
                        className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#f20089] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-white/70 mb-1">
                        Venture / Startup Idea Name
                      </label>
                      <input
                        type="text"
                        value={newTeam.ventureName}
                        onChange={(e) => setNewTeam({ ...newTeam, ventureName: e.target.value })}
                        placeholder="e.g. Decentralized Clean Water"
                        className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#f20089] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 space-y-3 backdrop-blur-md">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Team Leader Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Leader Name <span className="text-[#f20089]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeam.leadName}
                          onChange={(e) => setNewTeam({ ...newTeam, leadName: e.target.value })}
                          placeholder="Leader full name"
                          className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white focus:border-[#f20089] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Leader Email <span className="text-[#f20089]">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newTeam.leadEmail}
                          onChange={(e) => setNewTeam({ ...newTeam, leadEmail: e.target.value })}
                          placeholder="leader@heritageit.edu.in"
                          className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white focus:border-[#f20089] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newTeam.leadPhone}
                          onChange={(e) => setNewTeam({ ...newTeam, leadPhone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white focus:border-[#f20089] focus:outline-none"
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
                          className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white focus:border-[#f20089] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 space-y-3 backdrop-blur-md">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Co-Founders / Members (Optional)
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
                          className="rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#f20089] focus:outline-none"
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
                          className="rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#f20089] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddTeamModal(false)}
                      className="rounded-xl bg-white/[0.08] hover:bg-white/15 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-to-r from-[#f20089] to-purple-600 hover:from-[#ff1a9b] hover:to-purple-500 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-[#f20089]/40 hover:scale-105 transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
                    >
                      Confirm Registration
                    </button>
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
                } catch (err: any) {
                  return {
                    success: false,
                    message: err?.message || "Network error processing check-in.",
                  };
                }
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* MODAL 3: ADMIN GRACE CLEARANCE MODAL (/lgic)                              */}
          {/* ========================================================================= */}
          {showGraceModal && graceTeam && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
              <div className="relative overflow-hidden rounded-[2rem] border border-purple-500/40 bg-neutral-900 p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowGraceModal(false);
                    setGraceTeam(null);
                  }}
                  className="absolute top-5 right-5 text-white/50 hover:text-white text-lg cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-bold text-purple-300 uppercase font-mono">
                    <Shield className="h-3 w-3 text-purple-400" />
                    <span>Admin Grace Clearance (/lgic)</span>
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Team {graceTeam.teamName} ({graceTeam.teamCode})
                  </h3>
                  <p className="text-xs text-white/60 font-sans leading-relaxed">
                    Approve team attendance manually for real-world edge cases (illness, phone failure, last-minute swap).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono text-white/70">
                    Reason / Note (Optional):
                  </label>
                  <input
                    type="text"
                    value={graceNote}
                    onChange={(e) => setGraceNote(e.target.value)}
                    placeholder="e.g. Member absent due to illness, approved by lead admin"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#f20089] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    disabled={graceLoading}
                    onClick={() => handleGraceClearance("revoke")}
                    className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    Revoke Grace
                  </button>
                  <button
                    type="button"
                    disabled={graceLoading}
                    onClick={() => handleGraceClearance("approve")}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
                  >
                    {graceLoading ? "Processing..." : "Approve Grace Clearance →"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

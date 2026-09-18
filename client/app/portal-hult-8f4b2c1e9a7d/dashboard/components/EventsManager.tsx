"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, X } from "lucide-react";

import type { EventItem, RegisteredTeamItem } from "@/types";

// Helper to convert ISO/Date strings to "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
function toDatetimeLocalValue(val?: string): string {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
    return val.slice(0, 16);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

// Format human-readable event date range from calendar inputs
function formatEventDateRange(startIso?: string, endIso?: string, fallback = ""): string {
  if (!startIso) return fallback;
  try {
    const start = new Date(startIso);
    if (isNaN(start.getTime())) return fallback;

    const optionsDate: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const startDateStr = start.toLocaleDateString("en-US", optionsDate);
    const startTimeStr = start.toLocaleTimeString("en-US", optionsTime);

    if (!endIso) {
      return `${startDateStr} • ${startTimeStr}`;
    }

    const end = new Date(endIso);
    if (isNaN(end.getTime())) {
      return `${startDateStr} • ${startTimeStr}`;
    }

    const endDateStr = end.toLocaleDateString("en-US", optionsDate);
    const endTimeStr = end.toLocaleTimeString("en-US", optionsTime);

    if (start.toDateString() === end.toDateString()) {
      return `${startDateStr} • ${startTimeStr} – ${endTimeStr}`;
    } else {
      return `${startDateStr}, ${startTimeStr} – ${endDateStr}, ${endTimeStr}`;
    }
  } catch {
    return fallback;
  }
}

export default function EventsManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Drill-down State: "Go Inside The Card"
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [insideTab, setInsideTab] = useState<"details" | "registration" | "teams">("details");

  // Form State for editing the active event
  const [eventFormData, setEventFormData] = useState({
    title: "",
    tag: "Flagship",
    date: "",
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
    link: "",
    isPublished: true,
    order: 0,
    registrationStatus: "open" as "open" | "closed" | "extended" | "upcoming",
    registrationDeadline: "",
    maxTeams: 40,
    minTeamMembers: 3,
    maxTeamMembers: 5,
  });

  // Registered Teams Manager State
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    teamName: "",
    ventureName: "",
    leadName: "",
    leadEmail: "",
    membersCount: 4,
    department: "Computer Science & Engineering",
    status: "confirmed" as "confirmed" | "pending" | "waitlist",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("CMS failed to load events:", res.status, data);
        if (res.status === 404 || res.status === 401) {
          showToast("error", "Admin clearance required or session expired.");
        } else {
          showToast("error", data.error || "Failed to load events.");
        }
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      showToast("error", "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Sync URL query on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("event");
      const tab = params.get("tab") as "details" | "registration" | "teams" | null;
      if (eventId) {
        setSelectedEventId(eventId);
      }
      if (tab && ["details", "registration", "teams"].includes(tab)) {
        setInsideTab(tab);
      }
    }
  }, []);

  const handleSwitchTab = (tab: "details" | "registration" | "teams") => {
    setInsideTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // When selectedEvent changes or events reload, update form data
  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const found = events.find((e) => e._id === selectedEventId);
      if (found) {
        setEventFormData({
          title: found.title,
          tag: found.tag,
          date: found.date,
          startDate: found.startDate || "",
          endDate: found.endDate || "",
          venue: found.venue,
          description: found.description,
          link: found.link || "",
          isPublished: found.isPublished,
          order: found.order || 0,
          registrationStatus: found.registrationStatus || "open",
          registrationDeadline: found.registrationDeadline || "",
          maxTeams: found.maxTeams || 40,
          minTeamMembers: found.minTeamMembers || 3,
          maxTeamMembers: found.maxTeamMembers || 5,
        });
      }
    }
  }, [selectedEventId, events]);

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // Navigate "Inside the Card"
  const handleGoInsideEvent = (event: EventItem) => {
    setSelectedEventId(event._id);
    setIsCreatingNew(false);
    setInsideTab("details");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("event", event._id);
      url.searchParams.set("tab", "details");
      window.history.pushState(null, "", url.toString());
    }
  };

  // Exit back to Cards Grid
  const handleBackToEventsList = () => {
    setSelectedEventId(null);
    setIsCreatingNew(false);
    setShowAddTeamForm(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("event");
      url.searchParams.delete("tab");
      window.history.pushState(null, "", url.toString());
    }
  };

  // Save changes to active event
  const handleSaveEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreatingNew) {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventFormData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create event.");
        showToast("success", "Event created successfully!");
        await fetchEvents();
        if (data.event?._id) {
          handleGoInsideEvent(data.event);
        } else {
          handleBackToEventsList();
        }
      } else if (selectedEventId) {
        const res = await fetch("/api/admin/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedEventId, ...eventFormData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update event.");
        setEvents((prev) => prev.map((ev) => (ev._id === selectedEventId ? data.event : ev)));
        showToast("success", "Event details saved successfully!");
      }
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error saving event.");
    }
  };

  // Toggle Registration Open / Closed
  const handleToggleRegistration = async (eventId: string) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          action: "toggle_registration",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((e) => (e._id === eventId ? data.event : e)));
        setEventFormData((prev) => ({
          ...prev,
          registrationStatus: data.event.registrationStatus,
        }));
        showToast("success", data.message || "Registration status updated.");
      } else {
        throw new Error(data.error || "Failed to update registration status.");
      }
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error toggling registration.");
    }
  };

  // Extend Deadline (+1d, +3d, +1w)
  const handleIncreaseDeadline = async (eventId: string, hours: number) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          action: "extend_deadline",
          extensionHours: hours,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((e) => (e._id === eventId ? data.event : e)));
        setEventFormData((prev) => ({
          ...prev,
          registrationDeadline: data.event.registrationDeadline,
          registrationStatus: "extended",
        }));
        showToast("success", data.message || `Deadline extended by ${hours / 24} day(s)!`);
      } else {
        throw new Error(data.error || "Failed to extend deadline.");
      }
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error extending deadline.");
    }
  };

  // Toggle Publish / Draft
  const handleTogglePublish = async (event: EventItem) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event._id, isPublished: !event.isPublished }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e._id === event._id ? { ...e, isPublished: !e.isPublished } : e))
        );
        showToast(
          "success",
          `Event "${event.title}" is now ${!event.isPublished ? "Live on Site" : "Draft Hidden"}.`
        );
      }
    } catch {
      showToast("error", "Failed to update publish state.");
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        if (selectedEventId === id) {
          handleBackToEventsList();
        }
        showToast("success", "Event deleted successfully.");
      }
    } catch {
      showToast("error", "Failed to delete event.");
    }
  };

  // Team Registration: Add Team Manually
  const handleAddTeamToEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedEvent) return;

    const minMem = selectedEvent.minTeamMembers || 3;
    const maxMem = selectedEvent.maxTeamMembers || 5;
    if (newTeamData.membersCount < minMem || newTeamData.membersCount > maxMem) {
      showToast("error", `Team must have between ${minMem} and ${maxMem} members.`);
      return;
    }

    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEventId,
          action: "add_team",
          team: newTeamData,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((ev) => (ev._id === selectedEventId ? data.event : ev)));
        setShowAddTeamForm(false);
        setNewTeamData({
          teamName: "",
          ventureName: "",
          leadName: "",
          leadEmail: "",
          membersCount: minMem,
          department: "Computer Science & Engineering",
          status: "confirmed",
        });
        showToast("success", `Team "${newTeamData.teamName}" registered successfully!`);
      } else {
        throw new Error(data.error || "Failed to add team.");
      }
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error adding team.");
    }
  };

  // Team Registration: Remove Team
  const handleRemoveTeamFromEvent = async (teamId: string) => {
    if (!selectedEventId) return;
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEventId,
          action: "remove_team",
          teamId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((ev) => (ev._id === selectedEventId ? data.event : ev)));
        showToast("success", "Team removed from registration roster.");
      }
    } catch {
      showToast("error", "Failed to remove team.");
    }
  };

  // Team Registration: Update Team Status
  const handleUpdateTeamStatus = async (
    teamId: string,
    newStatus: "confirmed" | "pending" | "waitlist"
  ) => {
    if (!selectedEventId) return;
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEventId,
          action: "update_team_status",
          teamId,
          teamStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((ev) => (ev._id === selectedEventId ? data.event : ev)));
        showToast("success", `Team status updated to "${newStatus.toUpperCase()}".`);
      } else {
        throw new Error(data.error || "Failed to update team status.");
      }
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error updating status.");
    }
  };

  // Sync Teams to Live Event Stage Queue
  const handleSyncToLiveEvent = () => {
    if (!selectedEvent || !selectedEvent.registeredTeams) return;
    try {
      const mapped = selectedEvent.registeredTeams.map((t, idx) => ({
        id: t.id || "sync_" + idx,
        order: idx + 1,
        name: t.teamName,
        venture: t.ventureName || "Social Impact Venture",
        department: t.department || "General",
        lead: t.leadName,
        membersCount: t.membersCount || 4,
        status: idx === 0 ? "on_stage" : idx === 1 ? "on_deck" : "pending",
        juryScoreStatus: "Pending Pitch",
      }));
      localStorage.setItem("hult_live_teams", JSON.stringify(mapped));
      showToast(
        "success",
        `Synced ${mapped.length} team(s) to Live Event pitch queue. Check the "Live Event" tab!`
      );
    } catch {
      showToast("error", "Failed to sync teams to Live Event.");
    }
  };

  // Export Teams as CSV
  const handleExportTeamsCSV = () => {
    if (!selectedEvent || !selectedEvent.registeredTeams) return;
    const headers = [
      "Team Code",
      "Team Name",
      "Venture Title",
      "Team Lead",
      "Lead Email",
      "Lead Phone",
      "Members Joined",
      "Target Members",
      "Department",
      "Status",
      "Registration Date",
    ];
    const rows = selectedEvent.registeredTeams.map((t) => [
      `"${t.teamCode || "N/A"}"`,
      `"${t.teamName.replace(/"/g, '""')}"`,
      `"${(t.ventureName || "").replace(/"/g, '""')}"`,
      `"${t.leadName.replace(/"/g, '""')}"`,
      `"${t.leadEmail.replace(/"/g, '""')}"`,
      `"${(t.leadPhone || "").replace(/"/g, '""')}"`,
      1 + (t.members?.length || 0),
      t.membersCount,
      `"${t.department.replace(/"/g, '""')}"`,
      t.status,
      `"${new Date(t.registeredAt).toLocaleString()}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedEvent.title.replace(/\s+/g, "_")}_Teams.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return "Rolling";
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return deadlineStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeadlineCountdown = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const d = new Date(deadlineStr).getTime();
    if (isNaN(d)) return null;
    const diff = d - Date.now();
    if (diff <= 0) return { expired: true, text: "Ended" };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return { expired: false, text: `${days}d left` };
    if (hours > 0) return { expired: false, text: `${hours}h left` };
    return { expired: false, text: "<1h left" };
  };

  return (
    <section className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl px-5 py-3 text-xs sm:text-sm backdrop-blur-2xl border animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/80 border-red-500/40 text-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-white/60 hover:text-white text-xs cursor-pointer p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: INSIDE THE EVENT ("GO INSIDE THE CARD")                           */}
      {/* ========================================================================= */}
      {selectedEventId && selectedEvent ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb Back Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToEventsList}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/15 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
            >
              <span>← Back to All Events</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const url =
                    selectedEvent.link ||
                    `${typeof window !== "undefined" ? window.location.origin : ""}/register`;
                  navigator.clipboard.writeText(url);
                  showToast("success", "Event link copied to clipboard!");
                }}
                className="rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white transition-all cursor-pointer"
              >
                Copy Registration Link
              </button>
              <Link
                href="/events"
                target="_blank"
                className="rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white transition-all"
              >
                Preview on Site ↗
              </Link>
            </div>
          </div>

          {/* Event Header Banner inside the card */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f20089]">
                  {selectedEvent.tag}
                </span>

                {selectedEvent.registrationStatus !== "closed" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Registrations Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800 border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/50">
                    Registrations Closed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(selectedEvent)}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                    selectedEvent.isPublished
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                      : "bg-white/5 text-white/60 border-white/15 hover:bg-white/10"
                  }`}
                >
                  {selectedEvent.isPublished ? "● Live on Site" : "○ Draft Hidden"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent._id, selectedEvent.title)}
                  className="rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-300 transition-colors cursor-pointer"
                >
                  Delete Event
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                {selectedEvent.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-white/60 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-pink-400" /> {selectedEvent.date}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-pink-400" /> {selectedEvent.venue}</span>
                <span>•</span>
                <span className="text-white font-medium inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-pink-400" /> {selectedEvent.registeredTeamsCount || selectedEvent.registeredTeams?.length || 0} Teams Registered
                </span>
                <span>•</span>
                <span className="text-[#f20089] font-medium">
                  Team Size: {selectedEvent.minTeamMembers || 3} to {selectedEvent.maxTeamMembers || 5} Members
                </span>
              </div>
            </div>

            {/* Sub-Navigation Tabs matching website theme */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleSwitchTab("details")}
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
                  insideTab === "details"
                    ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Overview & Details
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab("registration")}
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer font-[family-name:var(--font-google-sans)] whitespace-nowrap flex items-center gap-1.5 ${
                  insideTab === "registration"
                    ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>Registration & Deadline</span>
                {selectedEvent.registrationStatus !== "closed" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab("teams")}
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer font-[family-name:var(--font-google-sans)] whitespace-nowrap ${
                  insideTab === "teams"
                    ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Registered Teams ({selectedEvent.registeredTeams?.length || 0})
              </button>
            </div>
          </div>

          {/* Tab 1: Overview & Details Form */}
          {insideTab === "details" && (
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeIn">
              {/* Subtle top iridescent accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089]/60 to-transparent" />
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#f20089]/10 blur-3xl" />

              <h3 className="text-lg font-bold text-white mb-4 font-[family-name:var(--font-google-sans)]">
                Event Information & Schedule
              </h3>

              <form onSubmit={handleSaveEventDetails} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">Tag / Category</label>
                    <select
                      value={eventFormData.tag}
                      onChange={(e) => setEventFormData({ ...eventFormData, tag: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all cursor-pointer"
                    >
                      <option value="Flagship" className="bg-neutral-900 text-white">Flagship</option>
                      <option value="Workshop" className="bg-neutral-900 text-white">Workshop</option>
                      <option value="Masterclass" className="bg-neutral-900 text-white">Masterclass</option>
                      <option value="Sprint" className="bg-neutral-900 text-white">Design Sprint</option>
                      <option value="Clinic" className="bg-neutral-900 text-white">Mentorship Clinic</option>
                      <option value="Info Session" className="bg-neutral-900 text-white">Info Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 font-semibold mb-1">Display Priority Order</label>
                    <input
                      type="number"
                      value={eventFormData.order}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, order: Number(e.target.value) })
                      }
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Team Size Limits (Min & Max Members) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">Min Members / Team</label>
                    <input
                      type="number"
                      min="1"
                      max={eventFormData.maxTeamMembers || 10}
                      value={eventFormData.minTeamMembers}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          minTeamMembers: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all font-mono"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">Default: 3 members</span>
                  </div>

                  <div>
                    <label className="block text-white/70 font-semibold mb-1">Max Members / Team</label>
                    <input
                      type="number"
                      min={eventFormData.minTeamMembers || 1}
                      max="10"
                      value={eventFormData.maxTeamMembers}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          maxTeamMembers: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all font-mono"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">Default: 5 members</span>
                  </div>
                </div>

                {/* Event Schedule (Start Date & End Date in Calendar format) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                        <span>📅</span>
                        <span>Start Date & Time * (Calendar)</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={toDatetimeLocalValue(eventFormData.startDate)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = formatEventDateRange(val, eventFormData.endDate, eventFormData.date);
                          setEventFormData({
                            ...eventFormData,
                            startDate: val,
                            date: formatted || eventFormData.date,
                          });
                        }}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">
                        Pick event start date and time from calendar
                      </span>
                    </div>

                    <div>
                      <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                        <span>📅</span>
                        <span>End Date & Time (Calendar)</span>
                      </label>
                      <input
                        type="datetime-local"
                        min={toDatetimeLocalValue(eventFormData.startDate)}
                        value={toDatetimeLocalValue(eventFormData.endDate)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = formatEventDateRange(eventFormData.startDate, val, eventFormData.date);
                          setEventFormData({
                            ...eventFormData,
                            endDate: val,
                            date: formatted || eventFormData.date,
                          });
                        }}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">
                        Optional event conclusion / pitch wrap-up
                      </span>
                    </div>
                  </div>

                  {eventFormData.date && (
                    <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs flex-wrap shadow-inner">
                      <div className="flex items-center gap-2 text-white/70">
                        <span className="text-[#f20089] font-bold inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Schedule Summary:</span>
                        <span className="font-semibold text-white">{eventFormData.date}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CME212 / Main Auditorium"
                    value={eventFormData.venue}
                    onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={eventFormData.description}
                    onChange={(e) =>
                      setEventFormData({ ...eventFormData, description: e.target.value })
                    }
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">
                    Custom Registration / Info Link
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to use default portal registration (/register)"
                    value={eventFormData.link}
                    onChange={(e) => setEventFormData({ ...eventFormData, link: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPublishedInside"
                    checked={eventFormData.isPublished}
                    onChange={(e) =>
                      setEventFormData({ ...eventFormData, isPublished: e.target.checked })
                    }
                    className="rounded border-white/20 text-[#f20089] accent-[#f20089]"
                  />
                  <label htmlFor="isPublishedInside" className="text-white/80 cursor-pointer select-none">
                    Publish this event live on the public website (/events)
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Registration & Deadline Rules */}
          {insideTab === "registration" && (
            <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Registration Controls & Team Constraints
              </h3>

              {/* Start / Stop Registration Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div>
                  <span className="text-sm font-bold text-white block">Registration Status</span>
                  <p className="text-xs text-white/60 mt-0.5">
                    {selectedEvent.registrationStatus !== "closed"
                      ? "Currently open: Students can register and submit team ventures."
                      : "Currently stopped: Submissions are paused on the public website."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleRegistration(selectedEvent._id)}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
                    selectedEvent.registrationStatus !== "closed"
                      ? "bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                  }`}
                >
                  {selectedEvent.registrationStatus !== "closed"
                    ? "Stop Registration"
                    : "Start Registration"}
                </button>
              </div>

              {/* Increase Time / Extend Deadline Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-bold text-white block">Cut-Off Deadline</span>
                    <p className="text-xs text-white/60 mt-0.5">
                      Current Cut-Off:{" "}
                      <strong className="text-white">
                        {formatDeadline(selectedEvent.registrationDeadline)}
                      </strong>
                    </p>
                  </div>

                  {getDeadlineCountdown(selectedEvent.registrationDeadline) && (
                    <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs font-mono text-purple-300">
                      {getDeadlineCountdown(selectedEvent.registrationDeadline)?.text}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-white/50 block mb-2 font-semibold">
                    Quick Increase Time:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleIncreaseDeadline(selectedEvent._id, 24)}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-[#f20089]/30 hover:border-[#f20089]/60 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      +24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncreaseDeadline(selectedEvent._id, 72)}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-[#f20089]/30 hover:border-[#f20089]/60 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncreaseDeadline(selectedEvent._id, 168)}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-[#f20089]/30 hover:border-[#f20089]/60 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      +1 Week
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Custom Cut-Off Date / Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. October 10, 2026 11:59 PM"
                      value={eventFormData.registrationDeadline}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          registrationDeadline: e.target.value,
                        })
                      }
                      className="flex-1 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-xs text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEventDetails}
                      className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Save Deadline
                    </button>
                  </div>
                </div>
              </div>

              {/* Team Size Limits (Min / Max Members) */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-lg">
                <div>
                  <span className="text-sm font-bold text-white block">Team Member Constraints</span>
                  <p className="text-xs text-white/60 mt-0.5">
                    Configure the minimum and maximum student members required per registered team.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Minimum Members per Team
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={eventFormData.maxTeamMembers || 10}
                      value={eventFormData.minTeamMembers}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          minTeamMembers: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-xs text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner font-mono transition-all"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Default: 3 members (Official Hult Prize rule)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Maximum Members per Team
                    </label>
                    <input
                      type="number"
                      min={eventFormData.minTeamMembers || 1}
                      max="10"
                      value={eventFormData.maxTeamMembers}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          maxTeamMembers: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-xs text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner font-mono transition-all"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Default: 5 members (Official Hult Prize rule)
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveEventDetails}
                    className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    Save Team Size Limits
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Registered Teams Roster */}
          {insideTab === "teams" && (
            <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                    Registered Teams Roster ({selectedEvent.registeredTeams?.length || 0})
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Team member constraint: <strong>{selectedEvent.minTeamMembers || 3} to {selectedEvent.maxTeamMembers || 5} members</strong> per venture.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTeamData((prev) => ({
                        ...prev,
                        membersCount: selectedEvent.minTeamMembers || 3,
                      }));
                      setShowAddTeamForm(!showAddTeamForm);
                    }}
                    className="rounded-xl bg-[#f20089] hover:bg-[#d8007a] text-white px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                  >
                    {showAddTeamForm ? "Cancel Add" : "+ Register Team"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportTeamsCSV}
                    disabled={!selectedEvent.registeredTeams?.length}
                    className="rounded-xl bg-white/[0.08] hover:bg-white/15 disabled:opacity-40 border border-white/15 text-white px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncToLiveEvent}
                    disabled={!selectedEvent.registeredTeams?.length}
                    className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Sync to Live Queue →
                  </button>
                </div>
              </div>

              {/* Inline Add Team Form */}
              {showAddTeamForm && (
                <form
                  onSubmit={handleAddTeamToEvent}
                  className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 space-y-3 animate-fadeIn text-xs shadow-lg"
                >
                  <h4 className="font-bold text-white text-sm">Register Team Manually</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Team Name *"
                      value={newTeamData.teamName}
                      onChange={(e) => setNewTeamData({ ...newTeamData, teamName: e.target.value })}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Venture Title"
                      value={newTeamData.ventureName}
                      onChange={(e) =>
                        setNewTeamData({ ...newTeamData, ventureName: e.target.value })
                      }
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Team Lead Name *"
                      value={newTeamData.leadName}
                      onChange={(e) => setNewTeamData({ ...newTeamData, leadName: e.target.value })}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Lead College Email (@heritageit.edu.in) *"
                      value={newTeamData.leadEmail}
                      onChange={(e) => setNewTeamData({ ...newTeamData, leadEmail: e.target.value })}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                    />
                    <div>
                      <label className="block text-white/60 mb-1">
                        Team Members Count ({selectedEvent.minTeamMembers || 3} to {selectedEvent.maxTeamMembers || 5}) *
                      </label>
                      <input
                        type="number"
                        min={selectedEvent.minTeamMembers || 1}
                        max={selectedEvent.maxTeamMembers || 10}
                        value={newTeamData.membersCount}
                        onChange={(e) =>
                          setNewTeamData({
                            ...newTeamData,
                            membersCount: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner font-mono transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="Department / Branch"
                        value={newTeamData.department}
                        onChange={(e) =>
                          setNewTeamData({ ...newTeamData, department: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-3.5 py-2 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md"
                    >
                      Save Team
                    </button>
                  </div>
                </form>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.02] backdrop-blur-xl shadow-inner">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-[11px] uppercase tracking-wider text-white/60">
                    <tr>
                      <th className="px-5 py-3.5">#</th>
                      <th className="px-5 py-3.5">Team & Venture</th>
                      <th className="px-5 py-3.5">Lead Student & Contact</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Members</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {(selectedEvent.registeredTeams || [])
                      .filter((t) => {
                        const q = teamSearchQuery.toLowerCase();
                        return (
                          t.teamName.toLowerCase().includes(q) ||
                          (t.ventureName && t.ventureName.toLowerCase().includes(q)) ||
                          t.leadName.toLowerCase().includes(q) ||
                          t.leadEmail.toLowerCase().includes(q)
                        );
                      })
                      .map((team: RegisteredTeamItem, idx: number) => (
                        <tr key={team.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 font-mono text-white/50">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">{team.teamName}</span>
                              {team.teamCode && (
                                <span className="font-mono text-[10px] font-bold text-[#f20089] bg-[#f20089]/15 border border-[#f20089]/35 px-2 py-0.5 rounded-md">
                                  {team.teamCode}
                                </span>
                              )}
                            </div>
                            {team.ventureName && (
                              <span className="text-[11px] text-white/60 block line-clamp-1 mt-0.5">
                                {team.ventureName}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-white block">{team.leadName}</span>
                            <span className="text-[11px] text-white/40 font-mono block truncate max-w-xs">
                              {team.leadEmail}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-white/80">{team.department}</td>
                          <td className="px-5 py-3.5 font-mono">
                            <span className="font-bold text-white">
                              {1 + (team.members?.length || 0)} / {team.membersCount || 4}
                            </span>
                            <span className="text-[10px] text-white/40 block">members joined</span>
                            {team.members && team.members.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1 max-w-xs font-sans">
                                {team.members.map((m, mIdx) => (
                                  <span
                                    key={mIdx}
                                    title={`${m.name} (${m.email || "N/A"}) - ${m.department || ""}`}
                                    className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] border border-white/10 px-1.5 py-0.5 text-[9px] text-white/80"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#f20089]" />
                                    <span>{m.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={team.status || "confirmed"}
                              onChange={(e) =>
                                handleUpdateTeamStatus(
                                  team.id,
                                  e.target.value as "confirmed" | "pending" | "waitlist"
                                )
                              }
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase outline-none cursor-pointer backdrop-blur-xl transition-all ${
                                team.status === "confirmed"
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                  : team.status === "waitlist"
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                  : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                              }`}
                            >
                              <option className="bg-neutral-900 text-emerald-300" value="confirmed">
                                Confirmed
                              </option>
                              <option className="bg-neutral-900 text-amber-300" value="waitlist">
                                Waitlist
                              </option>
                              <option className="bg-neutral-900 text-blue-300" value="pending">
                                Pending
                              </option>
                            </select>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveTeamFromEvent(team.id)}
                              className="text-white/40 hover:text-red-400 p-1 text-xs cursor-pointer transition-colors"
                              title="Remove team"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}

                    {(!selectedEvent.registeredTeams ||
                      selectedEvent.registeredTeams.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-white/40">
                          <p className="text-sm font-semibold text-white/70">No teams registered yet.</p>
                          <p className="text-xs text-white/40 mt-1">
                            Registered teams will appear here once submitted.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : isCreatingNew ? (
        /* ========================================================================= */
        /* VIEW 2: CREATE EVENT IN-PAGE                                              */
        /* ========================================================================= */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToEventsList}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/15 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <span>← Back to All Events</span>
            </button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f20089]/60 to-transparent" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#f20089]/10 blur-3xl" />

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)]">
                Create New Event
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Set up a new workshop, flagship pitch round, or orientation event.
              </p>
            </div>

            <form onSubmit={handleSaveEventDetails} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hult Prize HITK 2027 Grand Kickoff"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Category / Tag</label>
                  <select
                    value={eventFormData.tag}
                    onChange={(e) => setEventFormData({ ...eventFormData, tag: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all cursor-pointer"
                  >
                    <option value="Flagship" className="bg-neutral-900 text-white">Flagship</option>
                    <option value="Workshop" className="bg-neutral-900 text-white">Workshop</option>
                    <option value="Masterclass" className="bg-neutral-900 text-white">Masterclass</option>
                    <option value="Sprint" className="bg-neutral-900 text-white">Design Sprint</option>
                    <option value="Clinic" className="bg-neutral-900 text-white">Mentorship Clinic</option>
                    <option value="Info Session" className="bg-neutral-900 text-white">Info Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    value={eventFormData.order}
                    onChange={(e) =>
                      setEventFormData({ ...eventFormData, order: Number(e.target.value) })
                    }
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all font-mono"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">
                    Display order on website (0 = standard)
                  </span>
                </div>
              </div>

              {/* Min & Max Members per Team */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Min Members per Team</label>
                  <input
                    type="number"
                    min="1"
                    max={eventFormData.maxTeamMembers || 10}
                    value={eventFormData.minTeamMembers}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        minTeamMembers: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner font-mono transition-all"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">Default: 3 members</span>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Max Members per Team</label>
                  <input
                    type="number"
                    min={eventFormData.minTeamMembers || 1}
                    max="10"
                    value={eventFormData.maxTeamMembers}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        maxTeamMembers: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner font-mono transition-all"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">Default: 5 members</span>
                </div>
              </div>

              {/* Event Schedule (Start Date & End Date in Calendar format) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Start Date & Time * (Calendar)</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={toDatetimeLocalValue(eventFormData.startDate)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = formatEventDateRange(val, eventFormData.endDate, eventFormData.date);
                        setEventFormData({
                          ...eventFormData,
                          startDate: val,
                          date: formatted || eventFormData.date,
                        });
                      }}
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Pick event start date and time from calendar
                    </span>
                  </div>

                  <div>
                    <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                      <span>📅</span>
                      <span>End Date & Time (Calendar)</span>
                    </label>
                    <input
                      type="datetime-local"
                      min={toDatetimeLocalValue(eventFormData.startDate)}
                      value={toDatetimeLocalValue(eventFormData.endDate)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = formatEventDateRange(eventFormData.startDate, val, eventFormData.date);
                        setEventFormData({
                          ...eventFormData,
                          endDate: val,
                          date: formatted || eventFormData.date,
                        });
                      }}
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Optional event conclusion / pitch wrap-up
                    </span>
                  </div>
                </div>

                {eventFormData.date && (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs flex-wrap shadow-inner">
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="text-[#f20089] font-bold inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Schedule Summary:</span>
                      <span className="font-semibold text-white">{eventFormData.date}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CME212 / Main Auditorium"
                  value={eventFormData.venue}
                  onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details about the event, deliverables, and requirements..."
                  value={eventFormData.description}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, description: e.target.value })
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] focus:ring-1 focus:ring-[#f20089]/50 shadow-inner transition-all leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="createPublishImmediately"
                  checked={eventFormData.isPublished}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, isPublished: e.target.checked })
                  }
                  className="rounded border-white/20 text-[#f20089] accent-[#f20089]"
                />
                <label htmlFor="createPublishImmediately" className="text-white/80 cursor-pointer select-none">
                  Publish this event live on the website immediately
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleBackToEventsList}
                  className="rounded-2xl bg-white/[0.08] hover:bg-white/15 px-5 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 cursor-pointer font-[family-name:var(--font-google-sans)]"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: EVENTS CARDS LIST (CLEAN, THEMATIC OVERVIEW)                     */
        /* ========================================================================= */
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-google-sans)] text-white">
                Events & Schedule
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Click any event card to open its registration controls, deadline extender, and teams roster.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedEventId(null);
                setEventFormData({
                  title: "",
                  tag: "Flagship",
                  date: "",
                  startDate: "",
                  endDate: "",
                  venue: "",
                  description: "",
                  link: "",
                  isPublished: true,
                  order: events.length,
                  registrationStatus: "open",
                  registrationDeadline: "",
                  maxTeams: 40,
                  minTeamMembers: 3,
                  maxTeamMembers: 5,
                });
              }}
              className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center gap-2"
            >
              <span>+ Create New Event</span>
            </button>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-white/50 text-xs tracking-wider uppercase">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-neutral-400 text-sm mb-4">No events found in database.</p>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#f20089]/30 cursor-pointer"
              >
                Create your first event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {events.map((event) => {
                const isRegOpen =
                  event.registrationStatus === "open" || event.registrationStatus === "extended";
                const registeredCount =
                  event.registeredTeamsCount || event.registeredTeams?.length || 0;
                const minMem = event.minTeamMembers || 3;
                const maxMem = event.maxTeamMembers || 5;
                const countdown = getDeadlineCountdown(event.registrationDeadline);

                return (
                  <div
                    key={event._id}
                    onClick={() => handleGoInsideEvent(event)}
                    className="group relative rounded-3xl border border-white/15 bg-white/[0.03] hover:border-[#f20089]/50 hover:bg-white/[0.05] p-6 sm:p-7 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer hover:shadow-[0_10px_30px_rgba(242,0,137,0.15)]"
                  >
                    <div>
                      {/* Top Bar Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f20089]">
                            {event.tag}
                          </span>

                          {isRegOpen ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Registrations Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800 border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/50">
                              Registrations Closed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(event);
                            }}
                            className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                              event.isPublished
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {event.isPublished ? "● Live on Site" : "○ Draft"}
                          </button>
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-2.5 font-[family-name:var(--font-google-sans)] group-hover:text-pink-100 transition-colors leading-tight">
                        {event.title}
                      </h3>

                      {/* Schedule & Venue Meta */}
                      <div className="space-y-1 text-xs text-white/70 mb-3.5 font-sans">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-white/40" />
                          <span className="font-semibold text-white">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-white/40" />
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-5">
                        {event.description}
                      </p>

                      {/* Roster, Cutoff & Member Limits Strip */}
                      <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-inner text-xs mb-5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-white/40" />
                          <span className="font-bold text-white">
                            {registeredCount} Registered {registeredCount === 1 ? "Team" : "Teams"}
                          </span>
                          <span className="text-[11px] text-[#f20089] font-medium">
                            ({minMem}–{maxMem} members/team)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-[11px]">
                            Deadline: {formatDeadline(event.registrationDeadline)}
                          </span>
                          {countdown && (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                countdown.expired
                                  ? "bg-neutral-800 text-neutral-400"
                                  : "bg-purple-500/20 text-purple-300"
                              }`}
                            >
                              {countdown.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRegistration(event._id);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                          isRegOpen
                            ? "border-white/15 bg-white/[0.04] text-white/70 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/10"
                            : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        }`}
                      >
                        {isRegOpen ? "Stop Registration" : "Open Registration"}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#f20089] hover:bg-[#d8007a] text-white px-4 py-1.5 text-xs font-bold transition-all shadow-md shadow-[#f20089]/30">
                          <span>Manage Event →</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event._id, event.title);
                          }}
                          className="rounded-xl p-1.5 text-white/40 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                          title="Delete event"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ExternalLink,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";

import type { EventItem, RegisteredTeamItem } from "@/types";

// Helper to style event tag badges tastefully
function getTagBadgeStyle(tag?: string): string {
  const t = (tag || "").toLowerCase();
  if (t.includes("flagship")) {
    return "bg-rose-500/10 text-rose-300 border-rose-500/25";
  }
  if (t.includes("workshop")) {
    return "bg-purple-500/10 text-purple-300 border-purple-500/25";
  }
  if (t.includes("orientation")) {
    return "bg-blue-500/10 text-blue-300 border-blue-500/25";
  }
  if (t.includes("hackathon") || t.includes("competition")) {
    return "bg-amber-500/10 text-amber-300 border-amber-500/25";
  }
  if (t.includes("speaker") || t.includes("keynote")) {
    return "bg-sky-500/10 text-sky-300 border-sky-500/25";
  }
  return "bg-white/5 text-neutral-300 border-white/15";
}

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
  const [eventsFilterQuery, setEventsFilterQuery] = useState("");

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
          className={`flex items-center justify-between rounded-2xl px-5 py-3 text-xs sm:text-sm border shadow-lg animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-[#0a1f18] border-emerald-500/40 text-emerald-200"
              : "bg-[#240c10] border-red-500/40 text-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-white/60 hover:text-white text-xs cursor-pointer p-1 font-mono"
          >
            ✕
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
          <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getTagBadgeStyle(
                    selectedEvent.tag
                  )}`}
                >
                  {selectedEvent.tag}
                </span>

                {selectedEvent.registrationStatus !== "closed" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Registrations Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                    Registrations Closed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(selectedEvent)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer border transition-colors ${
                    selectedEvent.isPublished
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                      : "bg-white/[0.04] text-neutral-400 border-white/10 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {selectedEvent.isPublished ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live on Site</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Draft Hidden</span>
                    </>
                  )}
                </button>

                <Button
                  type="button"
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent._id, selectedEvent.title)}
                >
                  Delete Event
                </Button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                {selectedEvent.title}
              </h1>
              <p className="text-xs text-white/60 mt-1">
                Venue: <strong className="text-white">{selectedEvent.venue}</strong> • Schedule:{" "}
                <strong className="text-white">{selectedEvent.date}</strong>
              </p>
            </div>

            {/* Navigation Tabs inside the card */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleSwitchTab("details")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
                  insideTab === "details"
                    ? "bg-white text-black font-bold shadow-md shadow-white/10"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                Overview & Details
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab("registration")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
                  insideTab === "registration"
                    ? "bg-white text-black font-bold shadow-md shadow-white/10"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                Registration & Deadlines
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab("teams")}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
                  insideTab === "teams"
                    ? "bg-white text-black font-bold shadow-md shadow-white/10"
                    : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                Registered Teams ({selectedEvent.registeredTeams?.length || 0})
              </button>
            </div>
          </div>

          {/* Tab 1: Overview & Details Form */}
          {insideTab === "details" && (
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl animate-fadeIn">
              {/* Subtle top iridescent accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">Tag / Category</label>
                    <select
                      value={eventFormData.tag}
                      onChange={(e) => setEventFormData({ ...eventFormData, tag: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all cursor-pointer"
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
                      className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
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
                      className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
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
                      className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all font-mono"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">Default: 5 members</span>
                  </div>
                </div>

                {/* Event Schedule (Start Date & End Date in Calendar format) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-white/70" />
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
                        className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">
                        Pick event start date and time from calendar
                      </span>
                    </div>

                    <div>
                      <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-white/70" />
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
                        className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">
                        Optional event conclusion / pitch wrap-up
                      </span>
                    </div>
                  </div>

                  {eventFormData.date && (
                    <div className="rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 flex items-center justify-between gap-2 text-xs flex-wrap shadow-inner">
                      <div className="flex items-center gap-2 text-white/70 font-mono">
                        <span className="text-white font-bold">Schedule Summary:</span>
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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all leading-relaxed"
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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
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
                    className="rounded border-white/20 accent-white"
                  />
                  <label htmlFor="isPublishedInside" className="text-white/80 cursor-pointer select-none">
                    Publish this event live on the public website (/events)
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    className="font-[family-name:var(--font-google-sans)]"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Registration & Deadline Rules */}
          {insideTab === "registration" && (
            <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Registration Controls & Team Constraints
              </h3>

              {/* Start / Stop Registration Card */}
              <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
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
              <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 sm:p-6 space-y-4 shadow-lg">
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
                      className="rounded-xl border border-white/15 bg-[#121217] hover:bg-white/10 hover:border-white/40 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      +24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncreaseDeadline(selectedEvent._id, 72)}
                      className="rounded-xl border border-white/15 bg-[#121217] hover:bg-white/10 hover:border-white/40 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncreaseDeadline(selectedEvent._id, 168)}
                      className="rounded-xl border border-white/15 bg-[#121217] hover:bg-white/10 hover:border-white/40 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
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
                      className="flex-1 rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner font-mono transition-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEventDetails}
                    >
                      Save Deadline
                    </Button>
                  </div>
                </div>
              </div>

              {/* Team Size Limits (Min / Max Members) */}
              <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 sm:p-6 space-y-3 shadow-lg">
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
                      className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-xs text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner font-mono transition-all"
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
                      className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-xs text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner font-mono transition-all"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Default: 5 members (Official Hult Prize rule)
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveEventDetails}
                  >
                    Save Team Size Limits
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Registered Teams Roster */}
          {insideTab === "teams" && (
            <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
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
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setNewTeamData((prev) => ({
                        ...prev,
                        membersCount: selectedEvent.minTeamMembers || 3,
                      }));
                      setShowAddTeamForm(!showAddTeamForm);
                    }}
                  >
                    {showAddTeamForm ? "Cancel Add" : "+ Register Team"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportTeamsCSV}
                    disabled={!selectedEvent.registeredTeams?.length}
                  >
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSyncToLiveEvent}
                    disabled={!selectedEvent.registeredTeams?.length}
                  >
                    Sync to Live Queue →
                  </Button>
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder="Search teams..."
                    className="rounded-lg bg-neutral-900 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* Inline Add Team Form */}
              {showAddTeamForm && (
                <form
                  onSubmit={handleAddTeamToEvent}
                  className="rounded-2xl border border-white/15 bg-[#16161d] p-5 sm:p-6 space-y-3 animate-fadeIn text-xs shadow-lg"
                >
                  <h4 className="font-bold text-white text-sm">Register Team Manually</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Team Name *"
                      value={newTeamData.teamName}
                      onChange={(e) => setNewTeamData({ ...newTeamData, teamName: e.target.value })}
                      className="rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Venture Title"
                      value={newTeamData.ventureName}
                      onChange={(e) =>
                        setNewTeamData({ ...newTeamData, ventureName: e.target.value })
                      }
                      className="rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Team Lead Name *"
                      value={newTeamData.leadName}
                      onChange={(e) => setNewTeamData({ ...newTeamData, leadName: e.target.value })}
                      className="rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Lead College Email (@heritageit.edu.in) *"
                      value={newTeamData.leadEmail}
                      onChange={(e) => setNewTeamData({ ...newTeamData, leadEmail: e.target.value })}
                      className="rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
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
                        className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-white outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner font-mono transition-all"
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
                        className="w-full rounded-xl border border-white/15 bg-[#121217] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 shadow-inner transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                    >
                      Save Team
                    </Button>
                  </div>
                </form>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#16161d] shadow-inner">
                <table className="w-full text-left text-xs text-neutral-200">
                  <thead className="bg-[#121217] border-b border-white/10 text-[11px] uppercase tracking-wider text-white/70">
                    <tr>
                      <th className="px-5 py-3.5">#</th>
                      <th className="px-5 py-3.5">Team & Venture</th>
                      <th className="px-5 py-3.5">Lead Student & Contact</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Members</th>
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
                                <span className="font-mono text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md">
                                  {team.teamCode}
                                </span>
                              )}
                              {team.submissionStatus === "submitted" ? (
                                <span className="font-mono text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded">
                                  Submitted
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                  Forming
                                </span>
                              )}
                            </div>
                            {team.ventureName && (
                              <span className="text-[11px] text-white/60 block line-clamp-1 mt-0.5">
                                {team.ventureName}
                              </span>
                            )}
                            {team.pitchDeckUrl && (
                              <a
                                href={team.pitchDeckUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#f20089] hover:underline font-mono mt-0.5"
                              >
                                <ExternalLink size={10} />
                                <span>Pitch Deck</span>
                              </a>
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
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>{m.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                    {(!selectedEvent.registeredTeams ||
                      selectedEvent.registeredTeams.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-white/40">
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#16161d] hover:bg-[#202028] border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <span>← Back to All Events</span>
            </button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

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
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white placeholder-white/40 outline-none shadow-inner transition-all text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Category / Tag</label>
                  <select
                    value={eventFormData.tag}
                    onChange={(e) => setEventFormData({ ...eventFormData, tag: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white outline-none shadow-inner transition-all cursor-pointer"
                  >
                    <option value="Flagship" className="bg-[#16161d] text-white">Flagship</option>
                    <option value="Workshop" className="bg-[#16161d] text-white">Workshop</option>
                    <option value="Masterclass" className="bg-[#16161d] text-white">Masterclass</option>
                    <option value="Sprint" className="bg-[#16161d] text-white">Design Sprint</option>
                    <option value="Clinic" className="bg-[#16161d] text-white">Mentorship Clinic</option>
                    <option value="Info Session" className="bg-[#16161d] text-white">Info Session</option>
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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white outline-none shadow-inner transition-all font-mono"
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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white outline-none shadow-inner font-mono transition-all"
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
                    className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white outline-none shadow-inner font-mono transition-all"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">Default: 5 members</span>
                </div>
              </div>

              {/* Event Schedule (Start Date & End Date in Calendar format) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-white/70" />
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
                      className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white outline-none shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Pick event start date and time from calendar
                    </span>
                  </div>

                  <div>
                    <label className="block text-white/70 font-semibold mb-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-white/70" />
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
                      className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white outline-none shadow-inner transition-all [color-scheme:dark] cursor-pointer"
                    />
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Optional event conclusion / pitch wrap-up
                    </span>
                  </div>
                </div>

                {eventFormData.date && (
                  <div className="rounded-2xl border border-white/15 bg-[#16161d] px-4 py-2.5 flex items-center justify-between gap-2 text-xs flex-wrap shadow-inner">
                    <div className="flex items-center gap-2 text-white/70 font-mono">
                      <span className="text-white font-bold">Schedule Summary:</span>
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
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white placeholder-white/40 outline-none shadow-inner transition-all"
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
                  className="w-full rounded-2xl border border-white/15 bg-[#16161d] hover:border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/20 px-4 py-2.5 text-white placeholder-white/40 outline-none shadow-inner transition-all leading-relaxed"
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
                  className="rounded border-white/20 accent-white"
                />
                <label htmlFor="createPublishImmediately" className="text-white/80 cursor-pointer select-none">
                  Publish this event live on the website immediately
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleBackToEventsList}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  className="font-[family-name:var(--font-google-sans)]"
                >
                  Create Event
                </Button>
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
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-google-sans)] text-white tracking-tight">
                  Events & Schedule
                </h2>
                <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs font-mono font-medium text-neutral-300">
                  {events.length} {events.length === 1 ? "Event" : "Events"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Manage live events, team registration limits, deadlines, and rosters.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="default"
              className="font-[family-name:var(--font-google-sans)] font-semibold shadow-md flex items-center gap-2"
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
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </Button>
          </div>

          {/* Search Toolbar (if multiple events exist) */}
          {events.length > 2 && (
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter events by title, tag, or venue..."
                  value={eventsFilterQuery}
                  onChange={(e) => setEventsFilterQuery(e.target.value)}
                  className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                />
                {eventsFilterQuery && (
                  <button
                    type="button"
                    onClick={() => setEventsFilterQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              {eventsFilterQuery && (
                <div className="text-xs text-neutral-500 font-mono">
                  {events.filter((e) => {
                    const q = eventsFilterQuery.toLowerCase();
                    return (
                      e.title.toLowerCase().includes(q) ||
                      (e.tag && e.tag.toLowerCase().includes(q)) ||
                      (e.venue && e.venue.toLowerCase().includes(q))
                    );
                  }).length}{" "}
                  found
                </div>
              )}
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-white/50 text-xs tracking-wider uppercase font-mono">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c12]/90 p-12 text-center shadow-xl">
              <p className="text-neutral-400 text-sm mb-4">No events found in database.</p>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => setIsCreatingNew(true)}
              >
                Create your first event
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {events
                .filter((e) => {
                  if (!eventsFilterQuery.trim()) return true;
                  const q = eventsFilterQuery.toLowerCase();
                  return (
                    e.title.toLowerCase().includes(q) ||
                    (e.tag && e.tag.toLowerCase().includes(q)) ||
                    (e.venue && e.venue.toLowerCase().includes(q))
                  );
                })
                .map((event) => {
                  const isRegOpen =
                    event.registrationStatus === "open" || event.registrationStatus === "extended";
                  const registeredCount =
                    event.registeredTeamsCount || event.registeredTeams?.length || 0;
                  const minMem = event.minTeamMembers || 3;
                  const maxMem = event.maxTeamMembers || 5;
                  const countdown = getDeadlineCountdown(event.registrationDeadline);
                  const maxTeams = event.maxTeams || 40;
                  const capacityPct = Math.min(100, Math.round((registeredCount / maxTeams) * 100));

                  return (
                    <div
                      key={event._id}
                      onClick={() => handleGoInsideEvent(event)}
                      className="group relative rounded-2xl border border-white/10 bg-[#0c0c12]/90 hover:border-white/20 hover:bg-[#121219] p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer hover:shadow-2xl overflow-hidden"
                    >
                      {/* Ambient top highlight edge */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-rose-500/40 transition-all duration-500" />

                      <div>
                        {/* Top Status & Tag Ribbon */}
                        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getTagBadgeStyle(
                                event.tag
                              )}`}
                            >
                              {event.tag || "Event"}
                            </span>

                            {isRegOpen ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Registrations Open
                              </span>
                            ) : event.registrationStatus === "extended" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                Extended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
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
                              title={event.isPublished ? "Click to set as Draft" : "Click to publish"}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium cursor-pointer border transition-colors ${
                                event.isPublished
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                                  : "bg-white/[0.04] text-neutral-400 border-white/10 hover:bg-white/[0.08] hover:text-white"
                              }`}
                            >
                              {event.isPublished ? (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                  <span>Live</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-neutral-500" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Event Title */}
                        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-rose-300 transition-colors leading-snug line-clamp-1 mb-2.5 font-[family-name:var(--font-google-sans)]">
                          {event.title}
                        </h3>

                        {/* Schedule & Venue Meta */}
                        <div className="space-y-1.5 mb-3.5 text-xs text-neutral-300">
                          <div className="flex items-center gap-2" title={event.date}>
                            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="font-medium text-neutral-200 truncate">
                              {event.date || "Date to be announced"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400" title={event.venue}>
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="truncate">
                              {event.venue || "Venue to be announced"}
                            </span>
                          </div>
                        </div>

                        {/* Description with fixed height for equal grid alignment */}
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
                          {event.description || (
                            <span className="italic text-neutral-600">No event description provided.</span>
                          )}
                        </p>

                        {/* Roster & Capacity Metrics Card */}
                        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-5 space-y-2.5">
                          <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="font-semibold text-white">
                                {registeredCount}{" "}
                                <span className="text-neutral-400 font-normal">
                                  / {maxTeams} {registeredCount === 1 ? "team" : "teams"}
                                </span>
                              </span>
                              <span className="text-[11px] text-neutral-400 font-mono">
                                ({minMem}–{maxMem}/team)
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                              <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>{formatDeadline(event.registrationDeadline)}</span>
                              {countdown && (
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                    countdown.expired
                                      ? "bg-neutral-800 text-neutral-400 border-white/10"
                                      : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                  }`}
                                >
                                  {countdown.text}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Capacity Progress Bar */}
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(registeredCount > 0 ? 5 : 0, capacityPct))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Card Actions */}
                      <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-white/10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRegistration(event._id);
                          }}
                          className={`h-8.5 rounded-lg px-3 text-xs font-medium transition-all cursor-pointer border ${
                            isRegOpen
                              ? "border-white/10 bg-white/[0.03] text-neutral-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          }`}
                        >
                          {isRegOpen ? "Close Registration" : "Open Registration"}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoInsideEvent(event);
                            }}
                            className="h-8.5 inline-flex items-center gap-1.5 rounded-lg bg-white text-neutral-950 px-3.5 text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                          >
                            <span>Manage Event</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event._id, event.title);
                            }}
                            className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25 transition-colors cursor-pointer"
                            title="Delete event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

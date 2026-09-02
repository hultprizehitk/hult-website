"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";
import { parseHeritageEmail } from "@/lib/heritage-parser";

interface EventItem {
  _id: string;
  title: string;
  tag: string;
  date: string;
  venue: string;
  description: string;
  link?: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
}

interface Participant {
  _id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  role: string;
  createdAt: string;
}

interface AdminCMSClientProps {
  userEmail?: string;
  passcode?: string;
}

export default function AdminCMSClient({ userEmail, passcode }: AdminCMSClientProps) {
  const [activeTab, setActiveTab] = useState<"events" | "participants">("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Event form modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    tag: "Workshop",
    date: "",
    venue: "",
    description: "",
    link: "",
    isPublished: true,
    order: 0,
  });

  // Participant search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Headers helper with optional passcode
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (passcode) {
      headers["x-admin-passcode"] = passcode;
    }
    return headers;
  };

  // Load data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, participantsRes] = await Promise.all([
        fetch("/api/admin/events", { headers: getAuthHeaders() }),
        fetch("/api/admin/participants", { headers: getAuthHeaders() }),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }

      if (participantsRes.ok) {
        const data = await participantsRes.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle Event Submit (Create or Edit)
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        // PUT update
        const res = await fetch("/api/admin/events", {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ id: editingEventId, ...eventFormData }),
        });
        if (!res.ok) throw new Error("Failed to update event.");
        showToast("success", "Event updated successfully!");
      } else {
        // POST create
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(eventFormData),
        });
        if (!res.ok) throw new Error("Failed to create event.");
        showToast("success", "New event created successfully!");
      }

      setShowEventModal(false);
      setEditingEventId(null);
      setEventFormData({
        title: "",
        tag: "Workshop",
        date: "",
        venue: "",
        description: "",
        link: "",
        isPublished: true,
        order: 0,
      });
      fetchData();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error saving event.");
    }
  };

  // Toggle publish state directly
  const handleTogglePublish = async (event: EventItem) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: event._id, isPublished: !event.isPublished }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e._id === event._id ? { ...e, isPublished: !e.isPublished } : e))
        );
        showToast(
          "success",
          `Event "${event.title}" is now ${!event.isPublished ? "Published" : "Draft"}.`
        );
      }
    } catch (err) {
      showToast("error", "Failed to update publish state.");
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        showToast("success", "Event deleted successfully.");
      }
    } catch (err) {
      showToast("error", "Failed to delete event.");
    }
  };

  // Open edit modal
  const openEditModal = (event: EventItem) => {
    setEditingEventId(event._id);
    setEventFormData({
      title: event.title,
      tag: event.tag,
      date: event.date,
      venue: event.venue,
      description: event.description,
      link: event.link || "",
      isPublished: event.isPublished,
      order: event.order || 0,
    });
    setShowEventModal(true);
  };

  // Export participants to CSV
  const exportToCSV = () => {
    if (participants.length === 0) {
      showToast("error", "No participants to export.");
      return;
    }

    const headers = [
      "ID",
      "Parsed Full Name",
      "Google Account Name",
      "College Email",
      "Branch Code",
      "Department / Branch",
      "Passing Year",
      "Batch",
      "Role",
      "Registration Date",
    ];
    const rows = participants.map((p) => {
      const parsed = parseHeritageEmail(p.email, p.name);
      return [
        `"${p._id}"`,
        `"${parsed.fullName.replace(/"/g, '""')}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.email.replace(/"/g, '""')}"`,
        `"${parsed.branchCode}"`,
        `"${parsed.branchName.replace(/"/g, '""')}"`,
        `"${parsed.passingYear}"`,
        `"${parsed.batch}"`,
        `"${p.role}"`,
        `"${new Date(p.createdAt).toLocaleString()}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Hult_Prize_HITK_Participants_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Exported ${participants.length} participants to CSV!`);
  };

  // Filter participants by search and year
  const filteredParticipants = participants.filter((p) => {
    const parsed = parseHeritageEmail(p.email, p.name);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      parsed.fullName.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      parsed.branchCode.toLowerCase().includes(q) ||
      parsed.branchName.toLowerCase().includes(q);

    const matchesYear =
      selectedYear === "all" ||
      parsed.passingYear === selectedYear ||
      parsed.batch.includes(selectedYear) ||
      p.year === selectedYear;

    return matchesSearch && matchesYear;
  });

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-[#f20089] selection:text-white overflow-x-hidden">
      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <AnimatedGradient config={{ preset: "Aurora", speed: 14 }} noise={{ opacity: 0.08, scale: 1 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90" />
      </div>

      {/* Admin Top Navigation */}
      <header className="relative z-30 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-4 font-[family-name:var(--font-google-sans)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image src="/Hult-Prize.png" alt="Hult Prize Logo" fill sizes="48px" className="object-contain drop-shadow" />
          </Link>
          <div className="h-5 w-[1px] bg-white/20" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white">
            ADMIN <span className="text-[#f20089]">CMS</span>
          </span>
          <span className="hidden sm:inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
            Stealth Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden md:inline-block text-xs text-white/60">
              Logged in as <span className="text-white font-medium">{userEmail}</span>
            </span>
          )}
          <Link
            href="/"
            className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-all"
          >
            ← Back to Site
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/portal-hult-8f4b2c1e9a7d" })}
            className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#f20089]/40 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast feedback */}
        {statusMessage && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm backdrop-blur-2xl border animate-fadeIn ${
              statusMessage.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                : "bg-red-950/60 border-red-500/40 text-red-200"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-white/60 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Metric Pods */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">Total Students</span>
            <span className="text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] mt-1 block">
              {participants.length}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">Total Events</span>
            <span className="text-3xl font-extrabold text-white font-[family-name:var(--font-google-sans)] mt-1 block">
              {events.length}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#f20089]">Published Events</span>
            <span className="text-3xl font-extrabold text-[#f20089] font-[family-name:var(--font-google-sans)] mt-1 block">
              {events.filter((e) => e.isPublished).length}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">Draft Events</span>
            <span className="text-3xl font-extrabold text-neutral-300 font-[family-name:var(--font-google-sans)] mt-1 block">
              {events.filter((e) => !e.isPublished).length}
            </span>
          </div>
        </div>

        {/* CMS Tab Switcher */}
        <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer font-[family-name:var(--font-google-sans)] ${
              activeTab === "events"
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            📅 Events Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("participants")}
            className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer font-[family-name:var(--font-google-sans)] ${
              activeTab === "participants"
                ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/30"
                : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            👥 Registered Students ({participants.length})
          </button>
        </div>

        {/* TAB 1: EVENTS MANAGER */}
        {activeTab === "events" && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-google-sans)]">Events & Schedule</h2>
                <p className="text-xs text-white/60">
                  Manage events displayed on the public <Link href="/events" className="text-[#f20089] underline">/events</Link> page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingEventId(null);
                  setEventFormData({
                    title: "",
                    tag: "Workshop",
                    date: "",
                    venue: "",
                    description: "",
                    link: "",
                    isPublished: true,
                    order: events.length,
                  });
                  setShowEventModal(true);
                }}
                className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/40 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)]"
              >
                + Create New Event
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-white/60 text-sm">Loading events from MongoDB...</div>
            ) : events.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <p className="text-neutral-400 mb-4">No events found in MongoDB.</p>
                <button
                  type="button"
                  onClick={() => setShowEventModal(true)}
                  className="rounded-full bg-white/10 hover:bg-white/15 px-5 py-2 text-xs font-semibold text-white"
                >
                  Create your first event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl flex flex-col justify-between transition-all hover:border-white/20"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f20089]">
                          {event.tag}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleTogglePublish(event)}
                          className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                            event.isPublished
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {event.isPublished ? "● Live on Site" : "○ Draft Hidden"}
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 font-[family-name:var(--font-google-sans)]">
                        {event.title}
                      </h3>

                      <div className="space-y-1 text-xs text-neutral-300 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">📅 Date:</span>
                          <span className="font-semibold text-white">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">📍 Venue:</span>
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-3 mb-6 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className="rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event._id, event.title)}
                        className="rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PARTICIPANTS DIRECTORY */}
        {activeTab === "participants" && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-google-sans)]">
                  Registered Students
                </h2>
                <p className="text-xs text-white/60">
                  Live participant directory synced directly from MongoDB Atlas.
                </p>
              </div>

              <button
                type="button"
                onClick={exportToCSV}
                className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)]"
              >
                📥 Export to CSV
              </button>
            </div>

            {/* Search & Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Search by student name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089]"
                />
              </div>

              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-white outline-none backdrop-blur-xl focus:border-[#f20089]"
                >
                  <option value="all">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-google-sans)]">
                  <tr>
                    <th className="px-5 py-4">Student Name</th>
                    <th className="px-5 py-4">College Email</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Year</th>
                    <th className="px-5 py-4">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/50">
                        No student participants matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((student) => {
                      const parsed = parseHeritageEmail(student.email, student.name);
                      return (
                        <tr key={student._id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-4 font-bold text-white flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#f20089] to-purple-600 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                              {parsed.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block font-bold">{parsed.fullName}</span>
                              <span className="text-[10px] text-white/50 font-normal">
                                {parsed.firstName} • {parsed.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white/80 font-mono text-[11px]">{student.email}</td>
                          <td className="px-5 py-4">
                            <span className="block text-xs font-semibold text-white">{parsed.branchName}</span>
                            <span className="inline-block mt-0.5 rounded bg-[#f20089]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#f20089] uppercase">
                              {parsed.branchCode}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="block text-xs text-white/90 font-medium">Class of {parsed.passingYear}</span>
                            <span className="text-[10px] text-white/50">{parsed.batch}</span>
                          </td>
                          <td className="px-5 py-4 text-white/50">
                            {new Date(student.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* MODAL: CREATE / EDIT EVENT */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-neutral-950 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-extrabold text-white mb-4 font-[family-name:var(--font-google-sans)]">
              {editingEventId ? "Edit Event" : "Create New Event"}
            </h3>

            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Sprint & Pitch Clinic"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Tag / Type</label>
                  <select
                    value={eventFormData.tag}
                    onChange={(e) => setEventFormData({ ...eventFormData, tag: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Flagship">Flagship</option>
                    <option value="Masterclass">Masterclass</option>
                    <option value="Sprint">Design Sprint</option>
                    <option value="Clinic">Mentorship Clinic</option>
                    <option value="Info Session">Info Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={eventFormData.order}
                    onChange={(e) => setEventFormData({ ...eventFormData, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Date & Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. March 14, 2027 • 10:00 AM IST"
                  value={eventFormData.date}
                  onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swami Vivekananda Auditorium / Campus Hall"
                  value={eventFormData.venue}
                  onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about the session, speakers, or deliverables..."
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">Registration / Info Link (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://... or leave empty to use /register"
                  value={eventFormData.link}
                  onChange={(e) => setEventFormData({ ...eventFormData, link: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublishedCheck"
                  checked={eventFormData.isPublished}
                  onChange={(e) => setEventFormData({ ...eventFormData, isPublished: e.target.checked })}
                  className="rounded border-white/30 text-[#f20089]"
                />
                <label htmlFor="isPublishedCheck" className="text-xs text-white/80 cursor-pointer">
                  Publish to website immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-full bg-white/[0.08] hover:bg-white/15 px-5 py-2 text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-6 py-2 text-xs font-bold text-white shadow-lg shadow-[#f20089]/40"
                >
                  {editingEventId ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

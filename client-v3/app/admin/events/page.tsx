"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Users,
  Search,
  RefreshCw,
  X,
  Check,
} from "lucide-react";

interface AdminEvent {
  _id: string;
  title: string;
  tag: string;
  date: string;
  startDate?: string;
  endDate?: string;
  venue: string;
  description: string;
  link?: string;
  isPublished: boolean;
  registrationStatus: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  maxTeams: number;
  minTeamMembers: number;
  maxTeamMembers: number;
  registeredTeamsCount: number;
  createdAt: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    tag: "Flagship",
    date: "",
    venue: "",
    description: "",
    link: "",
    isPublished: true,
    registrationStatus: "open",
    registrationDeadline: "",
    maxTeams: 40,
    minTeamMembers: 3,
    maxTeamMembers: 5,
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      tag: "Flagship",
      date: "",
      venue: "",
      description: "",
      link: "",
      isPublished: true,
      registrationStatus: "open",
      registrationDeadline: "",
      maxTeams: 40,
      minTeamMembers: 3,
      maxTeamMembers: 5,
    });
    setModalOpen(true);
  };

  const openEditModal = (event: AdminEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      tag: event.tag || "Flagship",
      date: event.date,
      venue: event.venue,
      description: event.description,
      link: event.link || "",
      isPublished: event.isPublished,
      registrationStatus: event.registrationStatus || "open",
      registrationDeadline: event.registrationDeadline || "",
      maxTeams: event.maxTeams || 40,
      minTeamMembers: event.minTeamMembers || 3,
      maxTeamMembers: event.maxTeamMembers || 5,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent
        ? `/api/admin/events/${editingEvent._id}`
        : "/api/admin/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchEvents();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save event");
      }
    } catch (err) {
      console.error("Failed to save event:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete event "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleTogglePublish = async (event: AdminEvent) => {
    try {
      const res = await fetch(`/api/admin/events/${event._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !event.isPublished }),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.venue.toLowerCase().includes(search.toLowerCase()) ||
    ev.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Events Management
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure competitions, workshops, deadlines, and capacity for Hult Prize HITK.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search events by title, venue, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>
        <div className="text-xs font-mono text-neutral-400">
          {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found
        </div>
      </div>

      {/* Events Table Card */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500 font-mono">
            Loading events directory...
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02]">
                  <th className="py-3.5 px-4 font-semibold">Event Title</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Venue</th>
                  <th className="py-3.5 px-4 font-semibold">Capacity</th>
                  <th className="py-3.5 px-4 font-semibold">Reg Status</th>
                  <th className="py-3.5 px-4 font-semibold">Visibility</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((ev) => (
                  <tr key={ev._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                      {ev.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                        {ev.tag}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      <div className="font-medium text-white">{ev.date}</div>
                      <div className="text-[11px] text-neutral-400">{ev.venue}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        <span>
                          {ev.registeredTeamsCount || 0} / {ev.maxTeams || 40} teams
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                          ev.registrationStatus === "open"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : ev.registrationStatus === "extended"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        }`}
                      >
                        {ev.registrationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(ev)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                          ev.isPublished
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                            : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {ev.isPublished ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(ev)}
                          title="Edit Event"
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ev._id, ev.title)}
                          title="Delete Event"
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-neutral-500 font-mono">
            No events found. Click &quot;Create Event&quot; to initialize the schedule.
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d0d14] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. On-Campus Pitch Qualifier 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flagship, Workshop, Pitch"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oct 24, 2026 • 10:00 AM"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Venue / Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Auditorium, Heritage Institute of Technology"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Concise overview of event structure, criteria, and outcomes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Registration Status
                  </label>
                  <select
                    value={formData.registrationStatus}
                    onChange={(e) => setFormData({ ...formData, registrationStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="extended">Extended</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Max Teams Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value, 10) || 40 })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Reg Deadline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 20, 2026"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-white/20 bg-neutral-800 text-rose-500 focus:ring-0"
                />
                <label htmlFor="isPublished" className="text-neutral-300 cursor-pointer">
                  Publish immediately to public website (/events)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingEvent ? "Save Changes" : "Create Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

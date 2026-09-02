"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

export default function EventsManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal State
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

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        const res = await fetch("/api/admin/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEventId, ...eventFormData }),
        });
        if (!res.ok) throw new Error("Failed to update event.");
        showToast("success", "Event updated successfully!");
      } else {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      fetchEvents();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error saving event.");
    }
  };

  const handleTogglePublish = async (event: EventItem) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event._id, isPublished: !event.isPublished }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e._id === event._id ? { ...e, isPublished: !e.isPublished } : e
          )
        );
        showToast(
          "success",
          `Event "${event.title}" is now ${!event.isPublished ? "Published" : "Draft"}.`
        );
      }
    } catch {
      showToast("error", "Failed to update publish state.");
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        showToast("success", "Event deleted successfully.");
      }
    } catch {
      showToast("error", "Failed to delete event.");
    }
  };

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

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm backdrop-blur-2xl border animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/60 border-red-500/40 text-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-white/60 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-google-sans)] text-white">
            Events & Schedule
          </h2>
          <p className="text-xs text-white/60">
            Manage live events displayed on the public{" "}
            <Link href="/events" className="text-[#f20089] underline hover:text-[#d8007a]">
              /events
            </Link>{" "}
            page.
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

      {/* Events List */}
      {loading ? (
        <div className="py-20 text-center text-white/60 text-sm">
          Loading events from MongoDB...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-neutral-400 mb-4">No events found in MongoDB.</p>
          <button
            type="button"
            onClick={() => setShowEventModal(true)}
            className="rounded-full bg-white/10 hover:bg-white/15 px-5 py-2 text-xs font-semibold text-white cursor-pointer"
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

      {/* Modal: Create / Edit Event */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-neutral-950 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-extrabold text-white mb-4 font-[family-name:var(--font-google-sans)]">
              {editingEventId ? "Edit Event" : "Create New Event"}
            </h3>

            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Sprint & Pitch Clinic"
                  value={eventFormData.title}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                    Tag / Type
                  </label>
                  <select
                    value={eventFormData.tag}
                    onChange={(e) =>
                      setEventFormData({ ...eventFormData, tag: e.target.value })
                    }
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
                  <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={eventFormData.order}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Date & Time *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. March 14, 2027 • 10:00 AM IST"
                  value={eventFormData.date}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, date: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swami Vivekananda Auditorium / Campus Hall"
                  value={eventFormData.venue}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, venue: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about the session, speakers, or deliverables..."
                  value={eventFormData.description}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Registration / Info Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://... or leave empty to use /register"
                  value={eventFormData.link}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, link: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublishedCheck"
                  checked={eventFormData.isPublished}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, isPublished: e.target.checked })
                  }
                  className="rounded border-white/30 text-[#f20089]"
                />
                <label
                  htmlFor="isPublishedCheck"
                  className="text-xs text-white/80 cursor-pointer"
                >
                  Publish to website immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-full bg-white/[0.08] hover:bg-white/15 px-5 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#f20089] hover:bg-[#d8007a] px-6 py-2 text-xs font-bold text-white shadow-lg shadow-[#f20089]/40 cursor-pointer"
                >
                  {editingEventId ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

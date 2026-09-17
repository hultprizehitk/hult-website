"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface ContentItem {
  _id: string;
  contentType: "committee" | "announcement" | "sponsor" | "faq";
  title: string;
  subtitle?: string;
  category: string;
  description?: string;
  image?: string;
  links?: {
    linkedin?: string;
    github?: string;
    email?: string;
    website?: string;
  };
  badge?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState<"committee" | "announcement" | "sponsor">("committee");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State for Adding Item
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    category: "tech",
    description: "",
    image: "",
    linkedin: "",
    github: "",
    email: "",
    website: "",
    badge: "",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load content items:", err);
      showToast("error", "Failed to load content from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  // Handle One-Click Seed Committee
  const handleSeedCommittee = async () => {
    if (!confirm("This will populate the database with default committee members if empty. Continue?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_default_committee" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", data.message || "Seeded default committee members!");
        fetchItems();
      } else {
        showToast("error", data.error || "Failed to seed committee.");
      }
    } catch (err) {
      showToast("error", "Network error while seeding committee.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Item Submit
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: activeTab,
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim(),
          category: formData.category,
          description: formData.description.trim(),
          image: formData.image.trim(),
          badge: formData.badge.trim() || undefined,
          links: {
            linkedin: formData.linkedin.trim() || undefined,
            github: formData.github.trim() || undefined,
            email: formData.email.trim() || undefined,
            website: formData.website.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("success", `Added new ${activeTab} entry!`);
        setShowAddModal(false);
        setFormData({
          title: "",
          subtitle: "",
          category: "tech",
          description: "",
          image: "",
          linkedin: "",
          github: "",
          email: "",
          website: "",
          badge: "",
        });
        fetchItems();
      } else {
        showToast("error", data.error || "Failed to create entry.");
      }
    } catch {
      showToast("error", "Failed to submit new entry.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (item: ContentItem) => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, isActive: !item.isActive }),
      });
      if (res.ok) {
        showToast("success", `Updated ${item.title} visibility.`);
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, isActive: !item.isActive } : i))
        );
      }
    } catch {
      showToast("error", "Failed to update item status.");
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Item deleted successfully.");
        setItems((prev) => prev.filter((i) => i._id !== id));
      }
    } catch {
      showToast("error", "Failed to delete item.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              : "bg-red-950/90 text-red-300 border-red-500/40"
          }`}
        >
          <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#f20089] uppercase tracking-wider">
              Website CMS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
            Content Management System
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            Manage Organizing Committee members, flash announcements, and official sponsors without redeploying.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === "committee" && items.length === 0 && (
            <button
              type="button"
              onClick={handleSeedCommittee}
              disabled={actionLoading}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>{actionLoading ? "Seeding..." : "Seed Default Committee"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add New {activeTab === "committee" ? "Member" : activeTab === "announcement" ? "Announcement" : "Sponsor"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("committee")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "committee"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          👥 Organizing Committee
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "announcement"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          📢 Flash Announcements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sponsor")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sponsor"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          🤝 Sponsors & Partners
        </button>
      </div>

      {/* Content Display Table / Grid */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] backdrop-blur-2xl p-5 sm:p-6 shadow-2xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-white/60">
            <span className="inline-block animate-spin text-xl mb-2">🔄</span>
            <p>Loading {activeTab} records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-3xl">📭</span>
            <h3 className="text-base font-bold text-white">No {activeTab} items found in database</h3>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              {activeTab === "committee"
                ? "Click 'Seed Default Committee' to automatically import existing team members from code, or click 'Add New Member' to create a custom entry."
                : `Click '+ Add New' above to publish your first ${activeTab}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 px-3">Title / Name</th>
                  <th className="pb-3 px-3">Role / Category</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Links / Media</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/15">
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white block">{item.title}</span>
                          {item.description && (
                            <span className="text-[11px] text-white/50 line-clamp-1 max-w-xs block">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-medium text-white/90">{item.subtitle || "—"}</span>
                        <span className="rounded-full bg-white/[0.08] px-2 py-0.2 text-[9px] font-mono text-white/60 block w-fit">
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                          item.isActive
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : "bg-white/[0.05] border-white/15 text-white/40"
                        }`}
                      >
                        {item.isActive ? "● Active" : "○ Draft"}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 text-[11px] text-white/60">
                        {item.links?.linkedin && (
                          <a href={item.links.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#f20089]">
                            LinkedIn
                          </a>
                        )}
                        {item.links?.github && (
                          <a href={item.links.github} target="_blank" rel="noreferrer" className="hover:text-[#f20089]">
                            GitHub
                          </a>
                        )}
                        {item.links?.website && (
                          <a href={item.links.website} target="_blank" rel="noreferrer" className="hover:text-[#f20089]">
                            Website
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item._id, item.title)}
                        className="rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 px-2.5 py-1 text-[10px] font-semibold text-red-300 transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-neutral-950 p-6 sm:p-7 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)]">
                Add New {activeTab === "committee" ? "Committee Member" : activeTab === "announcement" ? "Announcement" : "Sponsor"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-white/70 font-semibold mb-1">Title / Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={activeTab === "committee" ? "e.g. Jane Doe" : activeTab === "announcement" ? "Headline" : "Company Name"}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Subtitle / Role</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Tech Lead / Gold Sponsor"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-[#f20089]"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Category / Team</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                  >
                    <option value="cd">Campus Director (CD)</option>
                    <option value="dcd">Deputy Campus Director (DCD)</option>
                    <option value="tech">Tech Team</option>
                    <option value="event_management">Event Management</option>
                    <option value="workshop">Workshop & Mentorship</option>
                    <option value="design">Design & Media</option>
                    <option value="sponsor">Sponsor / Partner</option>
                    <option value="general">General / Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Image / Photo / Logo URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Description / Bio</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description or announcement body"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-[#f20089]"
                />
              </div>

              {activeTab === "committee" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-[#f20089]"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-semibold mb-1">GitHub / Contact</label>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-white placeholder-white/40 outline-none focus:border-[#f20089]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-white/[0.08] hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-50 px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#f20089]/30"
                >
                  {actionLoading ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

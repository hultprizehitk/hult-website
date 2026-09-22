"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  FileText,
  Radio,
  Users,
  Award,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface ContentItem {
  _id: string;
  contentType: "announcement" | "committee" | "sponsor" | "faq";
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
}

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<"announcement" | "committee" | "sponsor">("announcement");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    category: "general",
    description: "",
    image: "",
    links: { linkedin: "", website: "" },
    order: 0,
    isActive: true,
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/content?type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load CMS content:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      subtitle: "",
      category: activeTab === "committee" ? "core_team" : activeTab === "sponsor" ? "Gold Partner" : "general",
      description: "",
      image: "",
      links: { linkedin: "", website: "" },
      order: items.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle || "",
      category: item.category || "general",
      description: item.description || "",
      image: item.image || "",
      links: {
        linkedin: item.links?.linkedin || "",
        website: item.links?.website || "",
      },
      order: item.order || 0,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        contentType: activeTab,
      };

      const url = "/api/admin/content";
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem ? { id: editingItem._id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchContent();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save content item");
      }
    } catch (err) {
      console.error("Failed to save content item:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchContent();
      }
    } catch (err) {
      console.error("Failed to delete content:", err);
    }
  };

  const toggleActive = async (item: ContentItem) => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, isActive: !item.isActive }),
      });
      if (res.ok) {
        fetchContent();
      }
    } catch (err) {
      console.error("Failed to toggle item status:", err);
    }
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Website Content CMS
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage live website announcements, organizing committee roster, and partner sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchContent}
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
            <span>
              {activeTab === "announcement"
                ? "New Announcement"
                : activeTab === "committee"
                ? "Add Member"
                : "Add Sponsor"}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("announcement")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
            activeTab === "announcement"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm"
              : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Announcements Banner</span>
        </button>

        <button
          onClick={() => setActiveTab("committee")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
            activeTab === "committee"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm"
              : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Organizing Committee (/team)</span>
        </button>

        <button
          onClick={() => setActiveTab("sponsor")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
            activeTab === "sponsor"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm"
              : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Partners & Sponsors</span>
        </button>
      </div>

      {/* Items Table / Cards */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500 font-mono">
            Loading {activeTab} records...
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02]">
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "committee" ? "Member" : "Title / Headline"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "committee" ? "Role & Department" : "Category / Tier"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Details / Link</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {item.image && (
                          <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                            <Image src={item.image} alt={item.title} fill unoptimized className="object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm text-neutral-300 truncate">
                      {item.description || item.links?.website || item.links?.linkedin || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-medium cursor-pointer transition-colors ${
                          item.isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.isActive ? "bg-emerald-400" : "bg-neutral-500"
                          }`}
                        />
                        <span>{item.isActive ? "Live / Active" : "Inactive"}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.title)}
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
            No {activeTab} content entries found.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d14] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingItem ? "Edit Entry" : "Create New Entry"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {activeTab === "committee" ? "Member Full Name *" : "Title / Heading *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Director / Live Announcement"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {activeTab === "committee" ? "Role Title (e.g. Lead Coordinator)" : "Subtitle / Tier"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Organizer / Title Partner"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Category Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. leadership, tech, event_management, sponsor"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Image / Photo / Logo URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Description / Action Message
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description or announcement action message..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  External URL / LinkedIn Link
                </label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/... or https://..."
                  value={formData.links.website || formData.links.linkedin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      links: { linkedin: e.target.value, website: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-white/20 bg-neutral-800 text-rose-500 focus:ring-0"
                />
                <label htmlFor="isActive" className="text-neutral-300 cursor-pointer">
                  Active (show immediately on live website)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingItem ? "Save Changes" : "Create Entry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

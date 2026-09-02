"use client";

import React, { useState, useEffect } from "react";
import { parseHeritageEmail } from "@/lib/heritage-parser";

interface Participant {
  _id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  role: string;
  createdAt: string;
}

export default function StudentsDirectory() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/participants");
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error("Failed to load participants:", err);
      showToast("error", "Failed to load participants from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Filter participants
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
      parsed.academicYear === selectedYear ||
      p.year === selectedYear;

    return matchesSearch && matchesYear;
  });

  // Export to CSV
  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      showToast("error", "No participants matching criteria to export.");
      return;
    }

    const headers = [
      "ID",
      "Parsed Full Name",
      "Google Account Name",
      "College Email",
      "Branch Code",
      "Department / Branch",
      "Academic Year",
      "Passing Year",
      "Batch",
      "Role",
      "Registration Date",
    ];

    const rows = filteredParticipants.map((p) => {
      const parsed = parseHeritageEmail(p.email, p.name);
      return [
        `"${p._id}"`,
        `"${parsed.fullName.replace(/"/g, '""')}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.email.replace(/"/g, '""')}"`,
        `"${parsed.branchCode}"`,
        `"${parsed.branchName.replace(/"/g, '""')}"`,
        `"${parsed.academicYear}"`,
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
    link.setAttribute(
      "download",
      `Hult_Prize_HITK_Participants_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Exported ${filteredParticipants.length} participants to CSV!`);
  };

  // Copy all filtered emails to clipboard
  const copyAllEmails = () => {
    if (filteredParticipants.length === 0) {
      showToast("error", "No emails to copy.");
      return;
    }
    const emails = filteredParticipants.map((p) => p.email).join(", ");
    navigator.clipboard.writeText(emails);
    showToast("success", `Copied ${filteredParticipants.length} emails to clipboard!`);
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
            Registered Students ({participants.length})
          </h2>
          <p className="text-xs text-white/60">
            Live participant directory synced in real-time from official Google sign-ins.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={copyAllEmails}
            className="rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
          >
            📋 Copy Emails
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)]"
          >
            📥 Export to CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Search by student name, email, branch, or department..."
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
            <option value="all">All Academic Years</option>
            <option value="3rd Year">3rd Year (Class of 2028)</option>
            <option value="2nd Year">2nd Year (Class of 2029)</option>
            <option value="1st Year">1st Year (Class of 2030)</option>
            <option value="4th Year">4th Year (Class of 2027)</option>
            <option value="Final Year">Final Year (Class of 2026)</option>
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
              <th className="px-5 py-4">Academic Year</th>
              <th className="px-5 py-4">Registered On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-white/60">
                  Loading students from database...
                </td>
              </tr>
            ) : filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-white/50">
                  No student participants matching criteria.
                </td>
              </tr>
            ) : (
              filteredParticipants.map((student) => {
                const parsed = parseHeritageEmail(student.email, student.name);
                return (
                  <tr
                    key={student._id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
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
                    <td className="px-5 py-4 text-white/80 font-mono text-[11px]">
                      {student.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="block text-xs font-semibold text-white">
                        {parsed.branchName}
                      </span>
                      <span className="inline-block mt-0.5 rounded bg-[#f20089]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#f20089] uppercase">
                        {parsed.branchCode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block text-xs font-bold text-white">
                        {parsed.academicYear}
                      </span>
                      <span className="text-[10px] text-purple-300 font-mono font-medium">
                        Class of {parsed.passingYear}
                      </span>
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
  );
}

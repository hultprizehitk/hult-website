"use client";

import React, { useState, useEffect } from "react";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import type { AdminRecord, Participant, UserRole } from "@/types";

interface AdminUserManagerProps {
  currentUserEmail: string;
}

const ROLE_PRESETS = [
  {
    role: "junior_admin" as const,
    label: "Junior Admin",
    icon: "🛡️",
    badgeClass: "bg-purple-500/20 border-purple-500/40 text-purple-300",
    desc: "Junior Admin • Verification and roster support",
  },
  {
    role: "lead_admin" as const,
    label: "Lead Admin",
    icon: "⭐",
    badgeClass: "bg-sky-500/20 border-sky-500/40 text-sky-300",
    desc: "Lead Admin • Operations, events, and participant management",
  },
  {
    role: "master_admin" as const,
    label: "Master Admin",
    icon: "👑",
    badgeClass: "bg-gradient-to-r from-amber-500/25 to-[#f20089]/25 border-amber-500/40 text-amber-300",
    desc: "Master Admin • Top-level executive clearance and team oversight",
  },
];

export default function AdminUserManager({ currentUserEmail }: AdminUserManagerProps) {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<"junior_admin" | "lead_admin" | "master_admin">("lead_admin");
  const [quickPromoteRole, setQuickPromoteRole] = useState<"junior_admin" | "lead_admin" | "master_admin">("junior_admin");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [searchStudentForAdmin, setSearchStudentForAdmin] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, participantsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/participants"),
      ]);

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        setAdmins(usersData.admins || []);
      }

      if (participantsRes && participantsRes.ok) {
        const pData = await participantsRes.json();
        setParticipants(pData.participants || []);
      }
    } catch (err) {
      console.error("Failed to load admin user data:", err);
      showToast("error", "Failed to load admin roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Grant admin access by email with designated role
  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.endsWith("@heritageit.edu.in")) {
      showToast("error", "Please provide a valid @heritageit.edu.in college email");
      return;
    }
    setIsSubmittingAdmin(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, action: "promote", role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to appoint admin");
      } else {
        showToast("success", data.message || `Granted ${selectedRole} access to ${cleanEmail}`);
        setAdminEmailInput("");
        fetchData();
      }
    } catch {
      showToast("error", "Network error while appointing admin");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Change existing admin's role
  const handleChangeRole = async (admin: AdminRecord, newRole: UserRole) => {
    if (admin.role === newRole) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: admin.email, action: "promote", role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to update role");
      } else {
        showToast("success", data.message || `Updated role for ${admin.name}`);
        fetchData();
      }
    } catch {
      showToast("error", "Failed to update role");
    }
  };

  // Revoke admin access
  const handleRevokeAdmin = async (admin: AdminRecord) => {
    if (admin.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      showToast("error", "You cannot revoke your own active administrator account");
      return;
    }
    if (
      !window.confirm(
        `Revoke administrator access for ${admin.name} (${admin.email})?`
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: admin.email, action: "demote" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to revoke admin");
      } else {
        showToast("success", data.message || `Revoked admin privileges for ${admin.email}`);
        fetchData();
      }
    } catch {
      showToast("error", "Failed to revoke admin");
    }
  };

  // Quick promote student to admin with selected role
  const handleQuickPromote = async (student: Participant, roleToGrant: "junior_admin" | "lead_admin" | "master_admin") => {
    const roleLabel =
      roleToGrant === "master_admin"
        ? "Master Admin"
        : roleToGrant === "lead_admin"
        ? "Lead Admin"
        : "Junior Admin";

    if (
      !window.confirm(
        `Promote ${student.name} (${student.email}) to ${roleLabel}?`
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, action: "promote", role: roleToGrant }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to promote student");
      } else {
        showToast("success", `Successfully appointed ${student.name} as ${roleLabel}!`);
        fetchData();
      }
    } catch {
      showToast("error", "Failed to promote student");
    }
  };

  const adminEmailParsed = adminEmailInput.includes("@heritageit.edu.in")
    ? parseHeritageEmail(adminEmailInput)
    : null;

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "master_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-[#f20089]/25 border border-amber-500/40 px-3 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider shadow-sm">
            <span>👑 Master Admin</span>
          </span>
        );
      case "lead_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-0.5 text-[10px] font-bold text-sky-300 uppercase tracking-wider">
            <span>⭐ Lead Admin</span>
          </span>
        );
      case "junior_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            <span>🛡️ Junior Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            <span>🛡️ Junior Admin</span>
          </span>
        );
    }
  };

  return (
    <section className="space-y-8 animate-fadeIn">
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

      {/* Header / Intro */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
            <span>👑 Master Administration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-google-sans)] text-white">
            Administrator Roles & Access Management
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Manage admin tiers: <strong>Master Admin</strong>, <strong>Lead Admin</strong>, and <strong>Junior Admin</strong>. Authorized users gain immediate access to this CMS upon college Google authentication.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">
            Active Master Session
          </span>
          <span className="text-xs font-mono text-amber-300">{currentUserEmail}</span>
        </div>
      </div>

      {/* Card 1: Appoint New Administrator Form */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)] mb-1">
            Appoint New Administrator
          </h3>
          <p className="text-xs text-neutral-300">
            Select the designated role tier and enter an official @heritageit.edu.in email address. Pre-authorized accounts gain immediate CMS access upon first Google sign-in.
          </p>
        </div>

        <form onSubmit={handleGrantAdmin} className="space-y-4">
          {/* Role Tier Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
              Select Administrator Role Tier:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ROLE_PRESETS.map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#f20089] bg-[#f20089]/15 shadow-lg shadow-[#f20089]/20"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-[#f20089] animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 leading-snug">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email input + submit */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative w-full flex-1">
              <input
                type="email"
                required
                placeholder="e.g. rohit.sharma.cse28@heritageit.edu.in"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-black/60 px-5 py-3.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAdmin}
              className="w-full sm:w-auto rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-50 px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#f20089]/40 transition-all hover:scale-105 cursor-pointer font-[family-name:var(--font-google-sans)] whitespace-nowrap"
            >
              {isSubmittingAdmin
                ? "Appointing..."
                : `Appoint as ${selectedRole === "master_admin" ? "Master Admin" : selectedRole === "lead_admin" ? "Lead Admin" : "Junior Admin"}`}
            </button>
          </div>

          {/* Email Preview */}
          {adminEmailParsed && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 animate-fadeIn flex flex-wrap items-center gap-4 text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                Identity Preview:
              </span>
              <span className="font-semibold text-white">
                👤 {adminEmailParsed.fullName}
              </span>
              <span className="text-emerald-300">
                🏛️ {adminEmailParsed.branchName} ({adminEmailParsed.branchCode})
              </span>
              <span className="text-purple-300">
                🎓 {adminEmailParsed.academicYear} ({adminEmailParsed.batch})
              </span>
            </div>
          )}
        </form>
      </div>

      {/* Card 2: Current Administrators Table */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
              Active Administrators ({admins.length})
            </h3>
            <p className="text-xs text-white/60">
              Change administrator roles or revoke access at any time.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span>Roles:</span>
            <span className="text-amber-300 font-semibold">Master Admin</span> •
            <span className="text-sky-300 font-semibold">Lead Admin</span> •
            <span className="text-purple-300 font-semibold">Junior Admin</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-google-sans)]">
              <tr>
                <th className="px-5 py-4">Administrator</th>
                <th className="px-5 py-4">College Email</th>
                <th className="px-5 py-4">Department / Year</th>
                <th className="px-5 py-4">Current Role</th>
                <th className="px-5 py-4">Change Role</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/60">
                    Loading administrators...
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                  const parsed = parseHeritageEmail(admin.email, admin.name);

                  return (
                    <tr
                      key={admin._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-white flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 ${
                            admin.role === "master_admin"
                              ? "bg-gradient-to-tr from-amber-500 to-[#f20089] shadow-md shadow-amber-500/30"
                              : admin.role === "lead_admin"
                              ? "bg-gradient-to-tr from-sky-400 to-blue-600 shadow-md shadow-sky-500/20"
                              : "bg-gradient-to-tr from-[#f20089] to-purple-600"
                          }`}
                        >
                          {parsed.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-bold">
                            {parsed.fullName || admin.name}
                          </span>
                          <span className="text-[10px] text-white/50">{admin.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-white/90">
                        {admin.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block text-white font-medium">
                          {parsed.branchName || admin.department}
                        </span>
                        <span className="text-[10px] text-white/50">
                          {parsed.academicYear || admin.year}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {renderRoleBadge(admin.role)}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={admin.role}
                          onChange={(e) =>
                            handleChangeRole(admin, e.target.value as UserRole)
                          }
                          className="rounded-xl border border-white/15 bg-black/70 px-2.5 py-1 text-[11px] text-white outline-none hover:border-[#f20089] focus:border-[#f20089] cursor-pointer"
                        >
                          <option value="junior_admin">🛡️ Junior Admin</option>
                          <option value="lead_admin">⭐ Lead Admin</option>
                          <option value="master_admin">👑 Master Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-amber-300/80 font-medium">
                            Current User
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeAdmin(admin)}
                            className="rounded-full border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-3 py-1 text-[11px] font-semibold text-red-300 transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 3: Quick Promote from Registered Students */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
              Quick Promote Registered Students
            </h3>
            <p className="text-xs text-neutral-300">
              Select any student and designate their admin tier directly.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={quickPromoteRole}
              onChange={(e) => setQuickPromoteRole(e.target.value as "junior_admin" | "lead_admin" | "master_admin")}
              className="rounded-2xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none backdrop-blur-xl focus:border-[#f20089] cursor-pointer"
            >
              <option value="junior_admin">🛡️ as Junior Admin</option>
              <option value="lead_admin">⭐ as Lead Admin</option>
              <option value="master_admin">👑 as Master Admin</option>
            </select>
            <input
              type="text"
              placeholder="Filter students..."
              value={searchStudentForAdmin}
              onChange={(e) => setSearchStudentForAdmin(e.target.value)}
              className="w-full sm:w-56 rounded-2xl border border-white/15 bg-black/60 px-4 py-2 text-xs text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089]"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 divide-y divide-white/5 bg-white/[0.01]">
          {participants
            .filter((p) => {
              const q = searchStudentForAdmin.toLowerCase();
              return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
            })
            .slice(0, 50)
            .map((student) => {
              const parsed = parseHeritageEmail(student.email, student.name);
              const existingAdmin = admins.find(
                (a) => a.email.toLowerCase() === student.email.toLowerCase()
              );

              return (
                <div
                  key={student._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">
                      {parsed.fullName || student.name}
                    </span>
                    <span className="text-[10px] text-white/60 font-mono">
                      {student.email} • {parsed.branchCode} • {parsed.academicYear}
                    </span>
                  </div>

                  {existingAdmin ? (
                    <div className="flex items-center gap-2">
                      {renderRoleBadge(existingAdmin.role)}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickPromote(student, quickPromoteRole)}
                      className="rounded-full bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 px-3.5 py-1 text-[11px] font-bold text-emerald-300 transition-all cursor-pointer"
                    >
                      + Promote ({quickPromoteRole === "master_admin" ? "Master" : quickPromoteRole === "lead_admin" ? "Lead" : "Junior"})
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

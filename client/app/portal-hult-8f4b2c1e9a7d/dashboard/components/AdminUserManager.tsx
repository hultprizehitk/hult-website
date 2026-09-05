"use client";

import React, { useState, useEffect } from "react";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import type { AdminRecord, Participant } from "@/types";

interface AdminUserManagerProps {
  currentUserEmail: string;
}

export default function AdminUserManager({ currentUserEmail }: AdminUserManagerProps) {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [adminEmailInput, setAdminEmailInput] = useState("");
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

  // Grant admin access by email
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
        body: JSON.stringify({ email: cleanEmail, action: "promote" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to appoint admin");
      } else {
        showToast("success", data.message || `Granted admin access to ${cleanEmail}`);
        setAdminEmailInput("");
        fetchData();
      }
    } catch {
      showToast("error", "Network error while appointing admin");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Revoke admin access
  const handleRevokeAdmin = async (admin: AdminRecord) => {
    if (admin.role === "superadmin") {
      showToast("error", "Super Administrator accounts cannot be revoked");
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

  // Quick promote student to admin
  const handleQuickPromote = async (student: Participant) => {
    if (
      !window.confirm(
        `Promote ${student.name} (${student.email}) to Administrator?`
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, action: "promote" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to promote student");
      } else {
        showToast("success", `Successfully promoted ${student.name} to Administrator!`);
        fetchData();
      }
    } catch {
      showToast("error", "Failed to promote student");
    }
  };

  const adminEmailParsed = adminEmailInput.includes("@heritageit.edu.in")
    ? parseHeritageEmail(adminEmailInput)
    : null;

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
            <span>👑 Executive Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-google-sans)] text-white">
            Administrator Access & Permissions
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Appoint new administrators by college email. Authorized users gain full access to this CMS upon Google authentication.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">
            Administrator Session
          </span>
          <span className="text-xs font-mono text-amber-300">{currentUserEmail}</span>
        </div>
      </div>

      {/* Card 1: Appoint New Administrator Form */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)] mb-2">
          Appoint New Administrator
        </h3>
        <p className="text-xs text-neutral-300 mb-6">
          Enter an official @heritageit.edu.in email address. If they have not logged in yet, they will be pre-authorized in MongoDB so their first login grants them full admin access.
        </p>

        <form onSubmit={handleGrantAdmin} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
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
              {isSubmittingAdmin ? "Granting..." : "👑 Grant Admin Access"}
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
        <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
          Active Administrators ({admins.length})
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-google-sans)]">
              <tr>
                <th className="px-5 py-4">Administrator</th>
                <th className="px-5 py-4">College Email</th>
                <th className="px-5 py-4">Department / Year</th>
                <th className="px-5 py-4">Role Clearance</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/60">
                    Loading administrators...
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSuper = admin.role === "superadmin";
                  const parsed = parseHeritageEmail(admin.email, admin.name);

                  return (
                    <tr
                      key={admin._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-white flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 ${
                            isSuper
                              ? "bg-gradient-to-tr from-amber-500 to-[#f20089] shadow-md shadow-amber-500/30"
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
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-[#f20089]/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                            👑 Executive Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                            🛡️ Administrator
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isSuper ? (
                          <span className="text-[11px] text-neutral-500 italic">
                            Permanent Lead
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeAdmin(admin)}
                            className="rounded-full border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-3 py-1 text-[11px] font-semibold text-red-300 transition-all cursor-pointer"
                          >
                            Revoke Access
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
              Select any registered student to instantly elevate them to Administrator.
            </p>
          </div>
          <input
            type="text"
            placeholder="Filter students by name or email..."
            value={searchStudentForAdmin}
            onChange={(e) => setSearchStudentForAdmin(e.target.value)}
            className="w-full sm:w-64 rounded-2xl border border-white/15 bg-black/60 px-4 py-2 text-xs text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089]"
          />
        </div>

        <div className="max-h-60 overflow-y-auto rounded-2xl border border-white/10 divide-y divide-white/5 bg-white/[0.01]">
          {participants
            .filter((p) => {
              const q = searchStudentForAdmin.toLowerCase();
              return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
            })
            .slice(0, 50)
            .map((student) => {
              const parsed = parseHeritageEmail(student.email, student.name);
              const isAlreadyAdmin = admins.some(
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

                  {isAlreadyAdmin ? (
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      ✓ Already Admin
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickPromote(student)}
                      className="rounded-full bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 px-3.5 py-1 text-[11px] font-bold text-emerald-300 transition-all cursor-pointer"
                    >
                      + Promote to Admin
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { Button } from "@/components/ui/button";
import type { AdminRecord, UserRole } from "@/types";

const ROLE_OPTIONS = [
  {
    value: "master_admin" as const,
    label: "Master Admin",
    badge: "Full Access",
    description: "Full system administration & role assignment",
    icon: ShieldAlert,
    color: "text-amber-400",
    badgeColor: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  },
  {
    value: "lead_admin" as const,
    label: "Lead Admin",
    badge: "Operations",
    description: "Event operations, rosters & manual check-in",
    icon: ShieldCheck,
    color: "text-sky-400",
    badgeColor: "bg-sky-500/15 border-sky-500/30 text-sky-300",
  },
  {
    value: "junior_admin" as const,
    label: "Junior Admin",
    badge: "Scanner Desk",
    description: "QR attendee scanner & pass verification",
    icon: Shield,
    color: "text-purple-400",
    badgeColor: "bg-purple-500/15 border-purple-500/30 text-purple-300",
  },
];

interface AdminUserManagerProps {
  currentUserEmail: string;
}

export default function AdminUserManager({ currentUserEmail }: AdminUserManagerProps) {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<"junior_admin" | "lead_admin" | "master_admin">("lead_admin");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [confirmRevokeEmail, setConfirmRevokeEmail] = useState<string | null>(null);
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
      const res = await fetch("/api/admin/users");
      if (res && res.ok) {
        const usersData = await res.json();
        setAdmins(usersData.admins || []);
      }
    } catch (err) {
      console.error("Failed to load admin user data:", err);
      showToast("error", "Failed to load admin roster.");
    } finally {
      setLoading(false);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

    setRevokingEmail(admin.email);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: admin.email, action: "revoke" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to revoke administrator privileges");
      } else {
        showToast("success", data.message || `Revoked administrator privileges for ${admin.email}`);
        setConfirmRevokeEmail(null);
        fetchData();
      }
    } catch {
      showToast("error", "Network error while revoking administrator privileges");
    } finally {
      setRevokingEmail(null);
    }
  };

  // Resend invitation email
  const handleResendInvite = async (admin: AdminRecord) => {
    setResendingEmail(admin.email);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: admin.email, action: "resend_invite" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to resend onboarding email");
      } else {
        showToast("success", data.message || `Resent onboarding email to ${admin.email}`);
      }
    } catch {
      showToast("error", "Network error while resending onboarding email");
    } finally {
      setResendingEmail(null);
    }
  };

  // Render Account Setup Status badge
  const renderAccountStatusBadge = (admin: AdminRecord) => {
    const isSetup = Boolean(admin.lastLoginAt || admin.image);

    if (isSetup) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 font-mono w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Active</span>
          </span>
          <span className="text-[9px] text-white/50 font-mono">
            {admin.lastLoginAt
              ? `Logged in ${new Date(admin.lastLoginAt).toLocaleDateString()}`
              : "Account Verified"}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 font-mono w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Pending Setup</span>
        </span>
        <span className="text-[9px] text-amber-200/60 font-mono">
          Awaiting Google Sign-In
        </span>
      </div>
    );
  };



  const adminEmailParsed = adminEmailInput.includes("@heritageit.edu.in")
    ? parseHeritageEmail(adminEmailInput)
    : null;

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "master_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider shadow-sm font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Master Admin</span>
          </span>
        );
      case "lead_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-0.5 text-[10px] font-bold text-sky-300 uppercase tracking-wider font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>Lead Admin</span>
          </span>
        );
      case "junior_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span>Junior Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span>Junior Admin</span>
          </span>
        );
    }
  };

  const currentRoleConfig = ROLE_OPTIONS.find((r) => r.value === selectedRole) || ROLE_OPTIONS[1];
  const CurrentRoleIcon = currentRoleConfig.icon;

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm border shadow-lg animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-[#0a1f18] border-emerald-500/40 text-emerald-200"
              : "bg-[#240c10] border-red-500/40 text-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-white/60 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INVITE USER Card */}
      <div className="relative mx-auto max-w-xl w-full rounded-3xl border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl animate-fadeIn">
        {/* Ambient Glows bounded in their own overflow-hidden container */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-widest text-white font-[family-name:var(--font-google-sans)] drop-shadow">
            INVITE USER
          </h3>
          <p className="text-xs text-white/60 mt-1">
            Designate an administrator role and enter an official college email.
          </p>
        </div>

        <form onSubmit={handleGrantAdmin} className="relative z-10 space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-[family-name:var(--font-google-sans)]">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="e.g. rohit.sharma.cse28@heritageit.edu.in"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-[#16161d] pl-11 pr-5 py-3 text-xs sm:text-sm text-white placeholder-white/30 outline-none transition-all focus:border-white/50 focus:ring-2 focus:ring-white/10 font-mono shadow-inner"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-[family-name:var(--font-google-sans)]">
              Role
            </label>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between rounded-2xl border border-white/15 bg-[#16161d] px-4 py-3 text-xs sm:text-sm text-white outline-none hover:border-white/40 focus:border-white/50 cursor-pointer transition-all shadow-inner group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl border ${currentRoleConfig.badgeColor}`}>
                  <CurrentRoleIcon className={`w-4 h-4 ${currentRoleConfig.color}`} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-white block text-sm">
                    {currentRoleConfig.label}
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${currentRoleConfig.badgeColor}`}>
                  {currentRoleConfig.badge}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                  roleDropdownOpen ? "rotate-180 text-white" : "group-hover:text-white"
                }`}
              />
            </button>

            {roleDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-white/20 bg-[#161622]/98 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 space-y-1.5 animate-fadeIn">
                {ROLE_OPTIONS.map((opt) => {
                  const isSelected = selectedRole === opt.value;
                  const OptionIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(opt.value);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white/[0.12] border border-white/25 text-white shadow-sm"
                          : "text-white/80 hover:bg-white/[0.06] hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${opt.badgeColor}`}>
                          <OptionIcon className={`w-4 h-4 ${opt.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {opt.label}
                            </span>
                            <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ${opt.badgeColor}`}>
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 pl-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Identity Preview */}
          {adminEmailParsed && (
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0a1f18] p-4 animate-fadeIn flex flex-wrap items-center gap-2.5 text-xs font-mono shadow-inner">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Identity:
              </span>
              <span className="font-semibold text-white inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                <span className="text-[9px] text-emerald-400 font-bold">NAME</span> {adminEmailParsed.fullName}
              </span>
              <span className="text-emerald-300 inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                <span className="text-[9px] text-emerald-400 font-bold">DEPT</span> {adminEmailParsed.branchName} ({adminEmailParsed.branchCode})
              </span>
              <span className="text-purple-300 inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-lg">
                <span className="text-[9px] text-purple-400 font-bold">YEAR</span> {adminEmailParsed.academicYear} ({adminEmailParsed.batch})
              </span>
            </div>
          )}

          {/* INVITE Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmittingAdmin}
              loading={isSubmittingAdmin}
              variant="default"
              size="lg"
              className="w-full rounded-2xl py-3.5 font-bold font-[family-name:var(--font-google-sans)] bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white shadow-lg shadow-pink-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmittingAdmin ? "DESIGNATING ROLE..." : "INVITE ADMINISTRATOR"}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* 1. Master Administrators Div */}
      <div className="rounded-3xl border border-amber-500/25 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                  Master Administrators
                </h3>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 font-mono">
                  {admins.filter((a) => a.role === "master_admin").length}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Executive committee clearance with full control across CMS, Events, Roles, and Operations.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-300 font-mono">
            Full Clearance
          </span>
        </div>

        {(() => {
          const masterList = admins.filter((a) => a.role === "master_admin");
          if (loading) {
            return (
              <div className="py-8 text-center text-white/60 text-xs">
                Loading Master Administrators...
              </div>
            );
          }
          if (masterList.length === 0) {
            return (
              <div className="py-8 px-4 text-center rounded-2xl border border-white/10 bg-[#16161d] text-white/50 text-xs italic">
                No Master Administrators recorded in database.
              </div>
            );
          }
          return (
            <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#16161d] shadow-inner">
              <table className="w-full text-left text-xs text-neutral-200">
                <thead className="border-b border-white/10 bg-[#121217] text-[11px] uppercase tracking-wider text-white/70 font-[family-name:var(--font-google-sans)]">
                  <tr>
                    <th className="px-5 py-3.5">Administrator</th>
                    <th className="px-5 py-3.5">College Email</th>
                    <th className="px-5 py-3.5">Department / Year</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Change Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {masterList.map((admin) => {
                    const isSelf = admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                    const parsed = parseHeritageEmail(admin.email, admin.name);
                    return (
                      <tr key={admin._id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5 text-white">
                          <div className="flex items-center gap-3">
                            {admin.image ? (
                              <img
                                src={admin.image}
                                alt={admin.name}
                                className="w-8 h-8 rounded-full border border-amber-500/30 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0 font-mono">
                                {(admin.name || "M").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block font-bold text-white truncate">
                                {parsed.fullName || admin.name || "Administrator"}
                              </span>
                              <span className="text-[10px] text-white/50 font-normal">
                                Added {new Date(admin.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-white/80">{admin.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="block text-white/80 font-medium">
                            {parsed.branchName || admin.department}
                          </span>
                          <span className="text-[10px] text-white/50">
                            {parsed.academicYear || admin.year}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">{renderAccountStatusBadge(admin)}</td>
                        <td className="px-5 py-3.5">
                          {isSelf ? (
                            <span className="text-[10px] text-white/40 italic font-mono">Current User</span>
                          ) : (
                            <select
                              value={admin.role}
                              onChange={(e) => handleChangeRole(admin, e.target.value as UserRole)}
                              className="rounded-xl border border-white/15 bg-[#121217] px-2.5 py-1 text-xs text-white outline-none focus:border-white/50 cursor-pointer"
                            >
                              <option value="master_admin">Master Admin</option>
                              <option value="lead_admin">Lead Admin</option>
                              <option value="junior_admin">Junior Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-white/40 italic font-mono px-2.5 py-1 rounded bg-white/5">
                              Current User
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-300/80 font-mono px-2.5 py-1 rounded border border-amber-500/25 bg-amber-500/10">
                              Executive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* 2. Lead Administrators Div */}
      <div className="rounded-3xl border border-sky-500/25 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/15 border border-sky-500/30">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                  Lead Administrators
                </h3>
                <span className="rounded-full bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 font-mono">
                  {admins.filter((a) => a.role === "lead_admin").length}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Operations &amp; live stage managers (Access to Teams, Scanner, Live Event, and Users).
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-full border bg-sky-500/10 border-sky-500/30 text-sky-300">
            Operations Clearance
          </span>
        </div>

        {(() => {
          const leadList = admins.filter((a) => a.role === "lead_admin");
          if (loading) {
            return (
              <div className="py-8 text-center text-white/60 text-xs">
                Loading Lead Administrators...
              </div>
            );
          }
          if (leadList.length === 0) {
            return (
              <div className="py-8 px-4 text-center rounded-2xl border border-white/10 bg-[#16161d] text-white/50 text-xs italic">
                No Lead Administrators appointed yet. Use the Invite card above to grant operations access.
              </div>
            );
          }
          return (
            <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#16161d] shadow-inner">
              <table className="w-full text-left text-xs text-neutral-200">
                <thead className="border-b border-white/10 bg-[#121217] text-[11px] uppercase tracking-wider text-white/70 font-[family-name:var(--font-google-sans)]">
                  <tr>
                    <th className="px-5 py-3.5">Administrator</th>
                    <th className="px-5 py-3.5">College Email</th>
                    <th className="px-5 py-3.5">Department / Year</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Change Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leadList.map((admin) => {
                    const isSelf = admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                    const parsed = parseHeritageEmail(admin.email, admin.name);
                    const isSetup = Boolean(admin.lastLoginAt || admin.image);
                    return (
                      <tr key={admin._id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5 text-white">
                          <div className="flex items-center gap-3">
                            {admin.image ? (
                              <img
                                src={admin.image}
                                alt={admin.name}
                                className="w-8 h-8 rounded-full border border-sky-500/30 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/25 flex items-center justify-center font-bold text-xs text-sky-300 shrink-0 font-mono">
                                {(admin.name || "L").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block font-bold text-white truncate">
                                {parsed.fullName || admin.name || "Administrator"}
                              </span>
                              <span className="text-[10px] text-white/50 font-normal">
                                Added {new Date(admin.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-white/80">{admin.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="block text-white/80 font-medium">
                            {parsed.branchName || admin.department}
                          </span>
                          <span className="text-[10px] text-white/50">
                            {parsed.academicYear || admin.year}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">{renderAccountStatusBadge(admin)}</td>
                        <td className="px-5 py-3.5">
                          {isSelf ? (
                            <span className="text-[10px] text-white/40 italic font-mono">Current User</span>
                          ) : (
                            <select
                              value={admin.role}
                              onChange={(e) => handleChangeRole(admin, e.target.value as UserRole)}
                              className="rounded-xl border border-white/15 bg-[#121217] px-2.5 py-1 text-xs text-white outline-none focus:border-white/50 cursor-pointer"
                            >
                              <option value="master_admin">Master Admin</option>
                              <option value="lead_admin">Lead Admin</option>
                              <option value="junior_admin">Junior Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-white/40 italic font-mono px-2.5 py-1 rounded bg-white/5">
                              Current User
                            </span>
                          ) : confirmRevokeEmail === admin.email ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="destructive"
                                size="xs"
                                disabled={revokingEmail === admin.email}
                                onClick={() => handleRevokeAdmin(admin)}
                                className="rounded-lg font-mono text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {revokingEmail === admin.email ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Revoking...</span>
                                  </>
                                ) : (
                                  <span>Confirm Revoke</span>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={revokingEmail === admin.email}
                                onClick={() => setConfirmRevokeEmail(null)}
                                className="rounded-lg font-mono text-[10px] border-white/20 text-white/70 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {!isSetup && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  disabled={resendingEmail === admin.email}
                                  onClick={() => handleResendInvite(admin)}
                                  className="rounded-lg font-mono text-[10px] border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-1 cursor-pointer"
                                  title="Resend onboarding invitation email"
                                >
                                  {resendingEmail === admin.email ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      <span>Resend Invite</span>
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => setConfirmRevokeEmail(admin.email)}
                                className="rounded-lg font-mono text-[10px] bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 flex items-center gap-1 cursor-pointer"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Revoke Access</span>
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* 3. Junior Administrators Div */}
      <div className="rounded-3xl border border-purple-500/25 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                  Junior Administrators
                </h3>
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 font-mono">
                  {admins.filter((a) => a.role === "junior_admin").length}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Gate check-in team with dedicated access to the Participant QR Scanner only.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-full border bg-purple-500/10 border-purple-500/30 text-purple-300">
            Scanner Desk Only
          </span>
        </div>

        {(() => {
          const juniorList = admins.filter((a) => a.role === "junior_admin");
          if (loading) {
            return (
              <div className="py-8 text-center text-white/60 text-xs">
                Loading Junior Administrators...
              </div>
            );
          }
          if (juniorList.length === 0) {
            return (
              <div className="py-8 px-4 text-center rounded-2xl border border-white/10 bg-[#16161d] text-white/50 text-xs italic">
                No Junior Administrators appointed yet. Use the Invite card above to add scanner staff.
              </div>
            );
          }
          return (
            <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#16161d] shadow-inner">
              <table className="w-full text-left text-xs text-neutral-200">
                <thead className="border-b border-white/10 bg-[#121217] text-[11px] uppercase tracking-wider text-white/70 font-[family-name:var(--font-google-sans)]">
                  <tr>
                    <th className="px-5 py-3.5">Administrator</th>
                    <th className="px-5 py-3.5">College Email</th>
                    <th className="px-5 py-3.5">Department / Year</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Change Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {juniorList.map((admin) => {
                    const isSelf = admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                    const parsed = parseHeritageEmail(admin.email, admin.name);
                    const isSetup = Boolean(admin.lastLoginAt || admin.image);
                    return (
                      <tr key={admin._id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5 text-white">
                          <div className="flex items-center gap-3">
                            {admin.image ? (
                              <img
                                src={admin.image}
                                alt={admin.name}
                                className="w-8 h-8 rounded-full border border-purple-500/30 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0 font-mono">
                                {(admin.name || "J").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block font-bold text-white truncate">
                                {parsed.fullName || admin.name || "Administrator"}
                              </span>
                              <span className="text-[10px] text-white/50 font-normal">
                                Added {new Date(admin.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-white/80">{admin.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="block text-white/80 font-medium">
                            {parsed.branchName || admin.department}
                          </span>
                          <span className="text-[10px] text-white/50">
                            {parsed.academicYear || admin.year}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">{renderAccountStatusBadge(admin)}</td>
                        <td className="px-5 py-3.5">
                          {isSelf ? (
                            <span className="text-[10px] text-white/40 italic font-mono">Current User</span>
                          ) : (
                            <select
                              value={admin.role}
                              onChange={(e) => handleChangeRole(admin, e.target.value as UserRole)}
                              className="rounded-xl border border-white/15 bg-[#121217] px-2.5 py-1 text-xs text-white outline-none focus:border-white/50 cursor-pointer"
                            >
                              <option value="master_admin">Master Admin</option>
                              <option value="lead_admin">Lead Admin</option>
                              <option value="junior_admin">Junior Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-white/40 italic font-mono px-2.5 py-1 rounded bg-white/5">
                              Current User
                            </span>
                          ) : confirmRevokeEmail === admin.email ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="destructive"
                                size="xs"
                                disabled={revokingEmail === admin.email}
                                onClick={() => handleRevokeAdmin(admin)}
                                className="rounded-lg font-mono text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {revokingEmail === admin.email ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Revoking...</span>
                                  </>
                                ) : (
                                  <span>Confirm Revoke</span>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={revokingEmail === admin.email}
                                onClick={() => setConfirmRevokeEmail(null)}
                                className="rounded-lg font-mono text-[10px] border-white/20 text-white/70 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {!isSetup && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  disabled={resendingEmail === admin.email}
                                  onClick={() => handleResendInvite(admin)}
                                  className="rounded-lg font-mono text-[10px] border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-1 cursor-pointer"
                                  title="Resend onboarding invitation email"
                                >
                                  {resendingEmail === admin.email ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      <span>Resend Invite</span>
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => setConfirmRevokeEmail(admin.email)}
                                className="rounded-lg font-mono text-[10px] bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 flex items-center gap-1 cursor-pointer"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Revoke Access</span>
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  History,
  Search,
  RefreshCw,
  UserCheck,
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  department: string;
  year: string;
  role: string;
  createdAt: string;
}

interface AuditLogRecord {
  _id: string;
  adminEmail: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export default function AdminAdminsAndLogsPage() {
  const [activeTab, setActiveTab] = useState<"admins" | "audit">("admins");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "admins") {
        const res = await fetch("/api/admin/users?adminsOnly=true");
        const data = await res.json();
        if (data.success) {
          setAdmins(data.users);
        }
      } else {
        const params = new URLSearchParams();
        if (targetTypeFilter !== "all") params.append("type", targetTypeFilter);
        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setAuditLogs(data.logs);
        }
      }
    } catch (err) {
      console.error("Failed to load admin/log data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, targetTypeFilter]);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setAdmins((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        const err = await res.json();
        alert(err.error || "Permission denied");
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Security & Audit Controls
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Role-based access clearance and immutable administrative event logs.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
            activeTab === "admins"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
              : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Administrator Roster ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
            activeTab === "audit"
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
              : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Immutable Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Administrators */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search admin by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-xs text-neutral-500 font-mono">
                Loading administrator roster...
              </div>
            ) : filteredAdmins.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02]">
                      <th className="py-3.5 px-4 font-semibold">Administrator</th>
                      <th className="py-3.5 px-4 font-semibold">Heritage Email</th>
                      <th className="py-3.5 px-4 font-semibold">Department</th>
                      <th className="py-3.5 px-4 font-semibold">Assigned Clearance</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAdmins.map((adm) => (
                      <tr key={adm._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {adm.image ? (
                              <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 border border-white/10">
                                <Image src={adm.image} alt={adm.name} fill unoptimized className="object-cover" />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center font-bold text-[10px] text-rose-300 shrink-0">
                                {(adm.name || "A")[0]}
                              </div>
                            )}
                            <span className="font-semibold text-white">{adm.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-neutral-300">{adm.email}</td>

                        <td className="py-3.5 px-4 text-neutral-300">{adm.department}</td>

                        <td className="py-3.5 px-4">
                          <select
                            value={adm.role}
                            onChange={(e) => updateRole(adm._id, e.target.value)}
                            className="text-xs font-mono font-semibold rounded-lg px-2.5 py-1 border bg-neutral-900 text-rose-300 border-rose-500/30 focus:outline-none cursor-pointer"
                          >
                            <option value="master_admin">Master Admin</option>
                            <option value="lead_admin">Lead Admin</option>
                            <option value="junior_admin">Junior Admin</option>
                            <option value="user">Revoke (User)</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-neutral-400 text-[11px]">
                          {new Date(adm.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-neutral-500 font-mono">
                No administrators found matching criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["all", "event", "team", "content", "user"].map((tp) => (
              <button
                key={tp}
                onClick={() => setTargetTypeFilter(tp)}
                className={`px-3 py-1.5 text-xs font-mono uppercase rounded-xl transition-colors cursor-pointer border ${
                  targetTypeFilter === tp
                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
                }`}
              >
                {tp}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-xs text-neutral-500 font-mono">
                Querying audit trail...
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02]">
                      <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                      <th className="py-3.5 px-4 font-semibold">Admin Caller</th>
                      <th className="py-3.5 px-4 font-semibold">Action Performed</th>
                      <th className="py-3.5 px-4 font-semibold">Type</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Target ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-white font-medium">{log.adminEmail}</span>
                        </td>

                        <td className="py-3.5 px-4 text-neutral-200">{log.action}</td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300 uppercase">
                            {log.targetType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right text-neutral-500 font-mono text-[10px] whitespace-nowrap">
                          {log.targetId ? log.targetId.slice(-8) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-neutral-500 font-mono">
                No audit records logged yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

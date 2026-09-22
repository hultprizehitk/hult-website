"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  Calendar,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Download,
} from "lucide-react";

interface AdminStats {
  totalStudents: number;
  totalAdmins: number;
  totalEvents: number;
  publishedEvents: number;
  totalTeams: number;
  confirmedTeams: number;
  activeAnnouncements: number;
  departmentStats: { department: string; count: number }[];
  recentAuditLogs: {
    _id: string;
    adminEmail: string;
    adminName: string;
    adminRole: string;
    action: string;
    targetType: string;
    timestamp: string;
  }[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Live Operations Online
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Executive Command Center
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time management for Hult Prize at Heritage Institute of Technology.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/admin/students?export=csv"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Roster</span>
          </a>

          <Link
            href="/admin/events"
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 transition-all shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Registered Students */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">
              Total Students
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-1">
            {loading ? "..." : stats?.totalStudents ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <span>Verified @heritageit.edu.in accounts</span>
          </div>
        </div>

        {/* Metric 2: Venture Teams */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">
              Venture Teams
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-1">
            {loading ? "..." : stats?.totalTeams ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats?.confirmedTeams ?? 0}</span>
            <span>confirmed teams</span>
          </div>
        </div>

        {/* Metric 3: Published Events */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">
              Active Events
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-1">
            {loading ? "..." : stats?.publishedEvents ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400">
            <span>{stats?.totalEvents ?? 0} total scheduled</span>
          </div>
        </div>

        {/* Metric 4: Announcements */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">
              Live Broadcasts
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white mb-1">
            {loading ? "..." : stats?.activeAnnouncements ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400">
            <span>Active banners on public site</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Department Breakdown & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Department Demographics</h2>
              <p className="text-xs text-neutral-400">Distribution of registered Heritage students</p>
            </div>
            <Link
              href="/admin/students"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <span>View Roster</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="h-32 flex items-center justify-center text-xs text-neutral-500 font-mono">
              Loading department telemetry...
            </div>
          ) : stats?.departmentStats && stats.departmentStats.length > 0 ? (
            <div className="space-y-3">
              {stats.departmentStats.map((item) => {
                const max = stats.departmentStats[0]?.count || 1;
                const percentage = Math.round((item.count / max) * 100);

                return (
                  <div key={item.department} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-white truncate max-w-[200px] sm:max-w-sm">
                        {item.department}
                      </span>
                      <span className="font-mono text-neutral-400">{item.count} students</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-neutral-500 font-mono">
              No students recorded in database yet.
            </div>
          )}
        </div>

        {/* System Diagnostics Card (1 col) */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">System Diagnostics</h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-neutral-400">Database</span>
                <span className="text-emerald-400 font-semibold">MongoDB Atlas OK</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-neutral-400">OAuth Gate</span>
                <span className="text-emerald-400 font-semibold">@heritageit.edu.in</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-neutral-400">Subdomain</span>
                <span className="text-white font-semibold">admin.localhost:3000</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-neutral-400">Admins Count</span>
                <span className="text-rose-400 font-semibold">{stats?.totalAdmins ?? 1} Cleared</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              href="/admin/admins"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 text-xs font-semibold text-white transition-all"
            >
              <span>Manage Admin Roles</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log Feed */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Recent Audit Trail</h2>
            <p className="text-xs text-neutral-400">Immutable record of administrative actions</p>
          </div>
          <Link
            href="/admin/admins"
            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
          >
            <span>All Logs</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="h-24 flex items-center justify-center text-xs text-neutral-500 font-mono">
            Loading audit feed...
          </div>
        ) : stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Admin</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentAuditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-neutral-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 text-white font-medium whitespace-nowrap">
                      {log.adminEmail}
                    </td>
                    <td className="py-3 text-neutral-300">{log.action}</td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400 uppercase">
                        {log.targetType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-neutral-500 font-mono">
            No audit records created yet.
          </div>
        )}
      </div>
    </div>
  );
}

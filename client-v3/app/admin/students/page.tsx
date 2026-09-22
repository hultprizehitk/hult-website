"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  image?: string;
  department: string;
  year: string;
  role: string;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search) params.append("search", search);
      if (department !== "all") params.append("department", department);
      if (year !== "all") params.append("year", year);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, department, year]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const getExportUrl = () => {
    const params = new URLSearchParams({ export: "csv" });
    if (search) params.append("search", search);
    if (department !== "all") params.append("department", department);
    if (year !== "all") params.append("year", year);
    return `/api/admin/students?${params.toString()}`;
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Students Directory
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Verified Heritage Institute of Technology student accounts in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchStudents()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <a
            href={getExportUrl()}
            download
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-4 py-2 text-xs transition-all shadow-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Filtered CSV</span>
          </a>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500/50"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science and Engineering">Computer Science & Eng</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics and Communication Engineering">ECE</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Applied Electronics and Instrumentation">AEIE</option>
            <option value="Chemical Engineering">Chemical Engineering</option>
            <option value="General Engineering">General / Other</option>
          </select>
        </div>

        <div>
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500/50"
          >
            <option value="all">All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
      </div>

      {/* Results Meta */}
      <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
        <div>
          Showing {students.length} of {totalCount} registered students
        </div>
        <div>
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500 font-mono">
            Querying student directory...
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02]">
                  <th className="py-3.5 px-4 font-semibold">Student Name</th>
                  <th className="py-3.5 px-4 font-semibold">Heritage Email</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Academic Year</th>
                  <th className="py-3.5 px-4 font-semibold">Clearance</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {student.image ? (
                          <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 border border-white/10">
                            <Image
                              src={student.image}
                              alt={student.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                            {(student.name || "S")[0]}
                          </div>
                        )}
                        <span className="font-medium text-white truncate max-w-[160px]">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {student.email}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-300 max-w-[200px] truncate">
                      {student.department}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {student.year}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                          student.role === "master_admin"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : student.role === "lead_admin"
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : student.role === "junior_admin"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-white/5 text-neutral-400 border border-white/10"
                        }`}
                      >
                        {student.role !== "user" && <Shield className="h-2.5 w-2.5" />}
                        <span>{student.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                      {new Date(student.createdAt).toLocaleDateString("en-IN", {
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
            No students found matching current filters.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-neutral-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Calendar,
  MapPin,
  Users,
  Download,
  Search,
  Clipboard,
  Mail,
  Phone,
  Check,
  Camera,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveCameraScannerModal from "./LiveCameraScannerModal";
import { parseHeritageEmail } from "@/lib/heritage-parser";

interface TeamMember {
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  roll?: string;
  joinedAt?: string | Date;
  checkedIn?: boolean;
  checkedInAt?: string | Date | null;
}

interface TeamLead {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
  checkedIn?: boolean;
  checkedInAt?: string | Date | null;
}

interface RegisteredTeam {
  id: string;
  teamCode: string;
  teamName: string;
  ventureName?: string;
  lead: TeamLead;
  leadEmail?: string;
  membersCount: number;
  department: string;
  members: TeamMember[];
  status: "confirmed" | "disqualified";
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: string | Date | null;
  checkedIn: boolean;
  checkedInAt?: string | Date | null;
  registeredAt: string | Date;
}

interface FlatParticipant {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  roll?: string;
  role: "Team Leader" | "Member";
  checkedIn: boolean;
  checkedInAt?: string | Date | null;
  registeredAt: string | Date;
  team: RegisteredTeam;
}

interface EventItem {
  _id: string;
  title: string;
  tag: string;
  date: string;
  venue: string;
  description: string;
  registrationStatus: "open" | "closed" | "extended" | "upcoming";
  isPublished: boolean;
  maxTeams: number;
  registeredTeamsCount: number;
  registeredTeams?: RegisteredTeam[];
}

export default function LiveEventManager() {
  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [eventMeta, setEventMeta] = useState<EventItem | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState<"registration" | "attendance">("registration");
  const [statusFilter, setStatusFilter] = useState<"submitted" | "forming" | "all">("all");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "checked_in" | "not_checked_in"
  >("all");
  const [viewMode, setViewMode] = useState<"teams" | "participants">("teams");
  const [eventSearch, setEventSearch] = useState("");

  // Modals & Inspection
  const [inspectingTeam, setInspectingTeam] = useState<RegisteredTeam | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New Team Form State
  const [newTeam, setNewTeam] = useState({
    teamName: "",
    leadName: "",
    leadEmail: "",
    leadPhone: "",
    department: "Computer Science & Engineering (CSE)",
    roll: "",
    membersCount: 4,
    status: "confirmed" as RegisteredTeam["status"],
    members: [
      { name: "", email: "", phone: "", department: "", roll: "" },
      { name: "", email: "", phone: "", department: "", roll: "" },
      { name: "", email: "", phone: "", department: "", roll: "" },
    ],
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Listen to URL ?eventId= parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const evParam = params.get("eventId");
      if (evParam) {
        setSelectedEventId(evParam);
      }
    }
  }, []);

  const handleSelectEvent = useCallback((id: string | null) => {
    setSelectedEventId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set("eventId", id);
      } else {
        url.searchParams.delete("eventId");
      }
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // -------------------------------------------------------------
  // 1. Fetch Events List
  // -------------------------------------------------------------
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } else {
        showToast("Failed to fetch events list.", "error");
      }
    } catch (err) {
      console.error("Fetch events error:", err);
      showToast("Network error fetching events.", "error");
    } finally {
      setLoadingEvents(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // -------------------------------------------------------------
  // 2. Fetch Teams for Selected Event
  // -------------------------------------------------------------
  const fetchTeamsForEvent = useCallback(
    async (eventId: string) => {
      setLoadingTeams(true);
      try {
        const res = await fetch(`/api/admin/teams?eventId=${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setTeams(Array.isArray(data.teams) ? data.teams : []);
          setEventMeta(data.event || null);
        } else {
          showToast("Failed to fetch registered teams.", "error");
        }
      } catch (err) {
        console.error("Fetch teams error:", err);
        showToast("Network error fetching teams.", "error");
      } finally {
        setLoadingTeams(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (selectedEventId) {
      fetchTeamsForEvent(selectedEventId);
    }
  }, [selectedEventId, fetchTeamsForEvent]);

  // -------------------------------------------------------------
  // 3. Team Actions
  // -------------------------------------------------------------
  // Helper to determine if team is fully registered and submitted
  const isTeamSubmitted = (t: RegisteredTeam) => {
    return t.submissionStatus === "submitted" || Boolean(t.submittedAt);
  };

  const handleToggleCheckIn = async (team: RegisteredTeam) => {
    if (!selectedEventId) return;
    if (!isTeamSubmitted(team)) {
      showToast("Forming teams cannot check in until registration is submitted.", "error");
      return;
    }
    setActionLoadingId(team.id);
    const nextCheckIn = !team.checkedIn;

    // Optimistic UI update
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== team.id) return t;
        const nowIso = nextCheckIn ? new Date().toISOString() : null;
        const updatedLead = {
          ...t.lead,
          checkedIn: nextCheckIn,
          checkedInAt: nowIso,
        };
        const updatedMembers = (t.members || []).map((m) => ({
          ...m,
          checkedIn: nextCheckIn,
          checkedInAt: nowIso,
        }));
        return {
          ...t,
          checkedIn: nextCheckIn,
          checkedInAt: nowIso,
          lead: updatedLead,
          members: updatedMembers,
        };
      })
    );
    if (inspectingTeam && inspectingTeam.id === team.id) {
      setInspectingTeam((prev) => {
        if (!prev) return null;
        const nowIso = nextCheckIn ? new Date().toISOString() : null;
        const updatedLead = {
          ...prev.lead,
          checkedIn: nextCheckIn,
          checkedInAt: nowIso,
        };
        const updatedMembers = (prev.members || []).map((m) => ({
          ...m,
          checkedIn: nextCheckIn,
          checkedInAt: nowIso,
        }));
        return {
          ...prev,
          checkedIn: nextCheckIn,
          checkedInAt: nowIso,
          lead: updatedLead,
          members: updatedMembers,
        };
      });
    }

    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_check_in",
          teamId: team.id,
          eventId: selectedEventId,
          teamCode: team.teamCode,
          checkedIn: nextCheckIn,
        }),
      });

      if (res.ok) {
        showToast(
          nextCheckIn
            ? `Team "${team.teamName}" marked as Checked In!`
            : `Check-in reverted for "${team.teamName}".`
        );
        fetchTeamsForEvent(selectedEventId);
      } else {
        fetchTeamsForEvent(selectedEventId);
        showToast("Failed to update check-in status.", "error");
      }
    } catch (err) {
      console.error(err);
      fetchTeamsForEvent(selectedEventId);
      showToast("Network error updating check-in.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleParticipantCheckIn = async (p: FlatParticipant) => {
    if (!selectedEventId) return;
    if (!isTeamSubmitted(p.team)) {
      showToast("Forming teams cannot check in until registration is submitted.", "error");
      return;
    }
    setActionLoadingId(p.id);
    const nextCheckIn = !p.checkedIn;
    const nowIso = nextCheckIn ? new Date().toISOString() : null;

    // Optimistically update teams state
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== p.teamId) return t;

        const isLead = p.role === "Team Leader";
        const updatedLead = isLead
          ? { ...t.lead, checkedIn: nextCheckIn, checkedInAt: nowIso }
          : t.lead;

        const updatedMembers = (t.members || []).map((m) => {
          if (
            !isLead &&
            ((p.email && m.email && m.email.toLowerCase() === p.email.toLowerCase()) ||
              (p.roll && m.roll && m.roll.toLowerCase() === p.roll.toLowerCase()) ||
              m.name.toLowerCase() === p.name.toLowerCase())
          ) {
            return { ...m, checkedIn: nextCheckIn, checkedInAt: nowIso };
          }
          return m;
        });

        const totalRoster = 1 + updatedMembers.length;
        const leadChecked = updatedLead.checkedIn ? 1 : 0;
        const membersChecked = updatedMembers.filter((m) => m.checkedIn).length;
        const allChecked = leadChecked + membersChecked >= totalRoster;

        return {
          ...t,
          lead: updatedLead,
          members: updatedMembers,
          checkedIn: allChecked,
          checkedInAt: allChecked ? (t.checkedInAt || nowIso) : null,
        };
      })
    );

    if (inspectingTeam && inspectingTeam.id === p.teamId) {
      setInspectingTeam((prev) => {
        if (!prev) return null;
        const isLead = p.role === "Team Leader";
        const updatedLead = isLead
          ? { ...prev.lead, checkedIn: nextCheckIn, checkedInAt: nowIso }
          : prev.lead;

        const updatedMembers = (prev.members || []).map((m) => {
          if (
            !isLead &&
            ((p.email && m.email && m.email.toLowerCase() === p.email.toLowerCase()) ||
              (p.roll && m.roll && m.roll.toLowerCase() === p.roll.toLowerCase()) ||
              m.name.toLowerCase() === p.name.toLowerCase())
          ) {
            return { ...m, checkedIn: nextCheckIn, checkedInAt: nowIso };
          }
          return m;
        });

        const totalRoster = 1 + updatedMembers.length;
        const leadChecked = updatedLead.checkedIn ? 1 : 0;
        const membersChecked = updatedMembers.filter((m) => m.checkedIn).length;
        const allChecked = leadChecked + membersChecked >= totalRoster;

        return {
          ...prev,
          lead: updatedLead,
          members: updatedMembers,
          checkedIn: allChecked,
          checkedInAt: allChecked ? (prev.checkedInAt || nowIso) : null,
        };
      });
    }

    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_participant_check_in",
          teamId: p.teamId,
          teamCode: p.teamCode,
          participantEmail: p.email,
          checkedIn: nextCheckIn,
          eventId: selectedEventId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.allCheckedIn && nextCheckIn) {
          showToast(`All members present! Team "${p.teamName}" auto-checked in.`);
        } else {
          showToast(
            nextCheckIn
              ? `Participant ${p.name} marked as Present.`
              : `Participant ${p.name} check-in reverted.`
          );
        }
        fetchTeamsForEvent(selectedEventId);
      } else {
        fetchTeamsForEvent(selectedEventId);
        showToast(data.error || "Failed to update participant check-in.", "error");
      }
    } catch (err) {
      console.error(err);
      fetchTeamsForEvent(selectedEventId);
      showToast("Network error updating participant check-in.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };



  const handleCreateWalkInTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    if (!newTeam.teamName.trim() || !newTeam.leadName.trim() || !newTeam.leadEmail.trim()) {
      showToast("Team Name, Leader Name, and Leader Email are required.", "error");
      return;
    }

    const validMembers = newTeam.members.filter((m) => m.name.trim() && m.email.trim());

    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          teamName: newTeam.teamName,
          leadName: newTeam.leadName,
          leadEmail: newTeam.leadEmail,
          leadPhone: newTeam.leadPhone,
          department: newTeam.department,
          roll: newTeam.roll,
          membersCount: validMembers.length + 1,
          members: validMembers,
          status: newTeam.status,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Team registered successfully!");
        setShowAddTeamModal(false);
        setNewTeam({
          teamName: "",
          leadName: "",
          leadEmail: "",
          leadPhone: "",
          department: "Computer Science & Engineering (CSE)",
          roll: "",
          membersCount: 4,
          status: "confirmed",
          members: [
            { name: "", email: "", phone: "", department: "", roll: "" },
            { name: "", email: "", phone: "", department: "", roll: "" },
            { name: "", email: "", phone: "", department: "", roll: "" },
          ],
        });
        fetchTeamsForEvent(selectedEventId);
      } else {
        showToast(data.error || "Failed to register team.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error creating team.", "error");
    }
  };

  // -------------------------------------------------------------
  // 4. Export CSV
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (!teams.length) {
      showToast("No data to export.", "error");
      return;
    }

    if (viewMode === "participants") {
      const headers = [
        "Participant Name",
        "Role",
        "Team Code",
        "Team Name",
        "Email",
        "Phone",
        "Department",
        "Roll No",
        "Checked In",
        "Check-In Time",
        "Registered At",
      ];
      const rows = allParticipants.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.role}"`,
        `"${p.teamCode}"`,
        `"${p.teamName.replace(/"/g, '""')}"`,
        `"${p.email}"`,
        `"${p.phone || ""}"`,
        `"${p.department.replace(/"/g, '""')}"`,
        `"${p.roll || ""}"`,
        `"${p.checkedIn ? "CHECKED_IN" : "ABSENT"}"`,
        `"${p.checkedInAt ? new Date(p.checkedInAt).toLocaleString() : "No"}"`,
        `"${new Date(p.registeredAt).toLocaleString()}"`,
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = `${(eventMeta?.title || "event").toLowerCase().replace(/\s+/g, "_")}_participants_attendance.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${allParticipants.length} participants to ${filename}`);
      return;
    }

    const headers = [
      "Team Code",
      "Team Name",
      "Status",
      "Checked In",
      "Checked In Time",
      "Leader Name",
      "Leader Email",
      "Leader Phone",
      "Leader Department",
      "Leader Roll",
      "Total Members",
      "Team Members Roster",
      "Registered At",
    ];

    const rows = teams.map((t) => {
      const coFoundersStr = t.members
        .map((m) => `${m.name} (${m.email}${m.phone ? `, ${m.phone}` : ""})`)
        .join(" | ");

      const checkInFormatted = t.checkedInAt
        ? new Date(t.checkedInAt).toLocaleString()
        : t.checkedIn
        ? "Yes"
        : "No";

      return [
        `"${t.teamCode}"`,
        `"${t.teamName.replace(/"/g, '""')}"`,
        `"${t.status.toUpperCase()}"`,
        `"${t.checkedIn ? "CHECKED_IN" : "ABSENT"}"`,
        `"${checkInFormatted}"`,
        `"${t.lead.name.replace(/"/g, '""')}"`,
        `"${t.lead.email}"`,
        `"${t.lead.phone || ""}"`,
        `"${t.lead.department || t.department || ""}"`,
        `"${t.lead.roll || ""}"`,
        t.members.length + 1,
        `"${coFoundersStr.replace(/"/g, '""')}"`,
        `"${new Date(t.registeredAt).toLocaleString()}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `${(eventMeta?.title || "event").toLowerCase().replace(/\s+/g, "_")}_registered_teams.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${teams.length} teams to ${filename}`);
  };

  const submittedCount = useMemo(
    () => teams.filter((t) => isTeamSubmitted(t)).length,
    [teams]
  );
  const formingCount = useMemo(
    () => teams.filter((t) => !isTeamSubmitted(t)).length,
    [teams]
  );

  // -------------------------------------------------------------
  // Filtered Teams Computation
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const isSubmitted = isTeamSubmitted(t);

      // Independent Domain Filtering
      if (filterDomain === "registration") {
        if (statusFilter === "submitted" && !isSubmitted) return false;
        if (statusFilter === "forming" && isSubmitted) return false;
        // "all" allows all teams
      } else {
        // Attendance domain: live event attendance evaluates confirmed submitted teams
        if (!isSubmitted) return false;
        if (activeFilter === "checked_in" && !t.checkedIn) return false;
        if (activeFilter === "not_checked_in" && t.checkedIn) return false;
        // "all" allows all submitted teams
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.teamName.toLowerCase().includes(q);
      const matchCode = t.teamCode.toLowerCase().includes(q);
      const matchLead =
        t.lead.name.toLowerCase().includes(q) || t.lead.email.toLowerCase().includes(q);
      const matchDept = (t.department || "").toLowerCase().includes(q);
      const matchMembers = t.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").includes(q)
      );

      return matchName || matchCode || matchLead || matchDept || matchMembers;
    });
  }, [teams, filterDomain, statusFilter, activeFilter, searchQuery]);

  // Flattened Participants for Participants View across all registered teams
  const allParticipants = useMemo<FlatParticipant[]>(() => {
    const list: FlatParticipant[] = [];
    for (const t of teams) {
      const isLeadChecked = Boolean(t.lead?.checkedIn || (t.checkedIn && t.lead?.checkedIn !== false));
      const leadCheckedInAt = t.lead?.checkedInAt || (isLeadChecked ? t.checkedInAt : null);

      list.push({
        id: `${t.id}_lead`,
        teamId: t.id,
        teamName: t.teamName,
        teamCode: t.teamCode,
        name: t.lead.name,
        email: t.lead.email,
        phone: t.lead.phone,
        department: t.lead.department || t.department || "General",
        roll: t.lead.roll,
        role: "Team Leader",
        checkedIn: isLeadChecked,
        checkedInAt: leadCheckedInAt,
        registeredAt: t.registeredAt,
        team: t,
      });

      if (Array.isArray(t.members)) {
        t.members.forEach((m, idx) => {
          const isMemChecked = Boolean(m.checkedIn !== undefined ? m.checkedIn : t.checkedIn);
          const memCheckedInAt = m.checkedInAt || (isMemChecked ? t.checkedInAt : null);

          list.push({
            id: `${t.id}_mem_${idx}`,
            teamId: t.id,
            teamName: t.teamName,
            teamCode: t.teamCode,
            name: m.name,
            email: m.email || "",
            phone: m.phone || "",
            department: m.department || t.department || "General",
            roll: m.roll || "",
            role: "Member",
            checkedIn: isMemChecked,
            checkedInAt: memCheckedInAt,
            registeredAt: t.registeredAt,
            team: t,
          });
        });
      }
    }
    return list;
  }, [teams]);

  const filteredParticipants = useMemo(() => {
    return allParticipants.filter((p) => {
      const isSubmitted = isTeamSubmitted(p.team);

      // Independent Domain Filtering
      if (filterDomain === "registration") {
        if (statusFilter === "submitted" && !isSubmitted) return false;
        if (statusFilter === "forming" && isSubmitted) return false;
      } else {
        // Attendance domain: live event attendance evaluates confirmed submitted participants
        if (!isSubmitted) return false;
        if (activeFilter === "checked_in" && !p.checkedIn) return false;
        if (activeFilter === "not_checked_in" && p.checkedIn) return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        (p.roll || "").toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.teamCode.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      );
    });
  }, [allParticipants, filterDomain, statusFilter, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    // Only count fully registered (submitted) teams and participants, exclude forming teams
    const eligibleTeams = teams.filter((t) => isTeamSubmitted(t));
    const total = eligibleTeams.length;
    const checkedIn = eligibleTeams.filter((t) => t.checkedIn).length;
    const remaining = total - checkedIn;
    const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    const getParticipantCount = (t: RegisteredTeam) =>
      1 + (Array.isArray(t.members) ? t.members.length : 0);

    const totalParticipants = eligibleTeams.reduce((acc, t) => acc + getParticipantCount(t), 0);
    const checkedInParticipants = eligibleTeams.reduce((acc, t) => {
      const leadPresent = Boolean(t.lead?.checkedIn || (t.checkedIn && t.lead?.checkedIn !== false));
      const membersPresent = Array.isArray(t.members)
        ? t.members.filter((m) => Boolean(m.checkedIn !== undefined ? m.checkedIn : t.checkedIn)).length
        : 0;
      return acc + (leadPresent ? 1 : 0) + membersPresent;
    }, 0);
    const remainingParticipants = totalParticipants - checkedInParticipants;
    const participantRate =
      totalParticipants > 0 ? Math.round((checkedInParticipants / totalParticipants) * 100) : 0;

    return {
      total,
      checkedIn,
      remaining,
      checkInRate,
      totalParticipants,
      checkedInParticipants,
      remainingParticipants,
      participantRate,
    };
  }, [teams]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const filteredEventsList = useMemo(() => {
    if (!eventSearch.trim()) return events;
    const q = eventSearch.toLowerCase().trim();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.tag || "").toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  return (
    <div className="space-y-8 animate-fadeIn text-white font-sans selection:bg-white/25 selection:text-white pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-[#0a1f18] text-emerald-200 shadow-emerald-900/30"
              : "border-rose-500/50 bg-[#240c10] text-rose-200 shadow-rose-900/30"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: ALL EVENTS HUB (When no event is selected)                        */}
      {/* ========================================================================= */}
      {!selectedEventId ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-google-sans)] text-white tracking-tight">
                  Live Event Operations
                </h1>
                <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs font-mono font-medium text-neutral-300">
                  {events.length} {events.length === 1 ? "Event" : "Events"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Select an active event to coordinate stage queue, inspect rosters, and monitor live check-ins.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Filter events by title, tag, or venue..."
                  className="w-full pl-8.5 pr-7 py-2 text-xs bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                />
                {eventSearch && (
                  <button
                    type="button"
                    onClick={() => setEventSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5 cursor-pointer"
                onClick={fetchEvents}
                title="Refresh events from database"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="py-20 text-center text-white/50 text-xs tracking-wider uppercase font-mono">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-neutral-500" />
              Loading events from database...
            </div>
          ) : filteredEventsList.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c12]/90 p-12 text-center shadow-xl">
              <Calendar className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)] mb-2">
                No Events Found
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mb-6">
                {eventSearch
                  ? `No events match "${eventSearch}". Try a different search term.`
                  : "You haven't created any events yet. Create your first event in the Events Manager to begin receiving team registrations."}
              </p>
              <Button asChild variant="default" size="default" className="font-[family-name:var(--font-google-sans)] font-semibold shadow-md">
                <Link href="/admin">
                  Go to Events Manager →
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEventsList.map((ev) => {
                const isRegOpen = ev.registrationStatus === "open";
                const isExtended = ev.registrationStatus === "extended";

                return (
                  <div
                    key={ev._id}
                    onClick={() => handleSelectEvent(ev._id)}
                    className="group relative rounded-2xl border border-white/10 bg-[#0c0c12]/90 hover:border-white/20 hover:bg-[#121219] p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer hover:shadow-2xl overflow-hidden"
                  >
                    {/* Ambient top highlight edge */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-rose-500/40 transition-all duration-500" />

                    <div>
                      {/* Status Ribbon */}
                      <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
                        {isRegOpen ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Registrations Open
                          </span>
                        ) : isExtended ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Extended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                            Closed
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-rose-300 transition-colors leading-snug line-clamp-1 mb-2.5 font-[family-name:var(--font-google-sans)]">
                        {ev.title}
                      </h3>

                      {/* Date & Venue */}
                      <div className="space-y-1.5 mb-3.5 text-xs text-neutral-300">
                        <div className="flex items-center gap-2" title={ev.date}>
                          <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium text-neutral-200 truncate">
                            {ev.date || "Date to be announced"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400" title={ev.venue}>
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">
                            {ev.venue || "Venue to be announced"}
                          </span>
                        </div>
                      </div>

                      {/* Description with fixed height for equal grid alignment */}
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-5 min-h-[2.5rem]">
                        {ev.description || (
                          <span className="italic text-neutral-600">No event description provided.</span>
                        )}
                      </p>
                    </div>

                    {/* Bottom Card Action */}
                    <div className="pt-3.5 border-t border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEvent(ev._id);
                        }}
                        className="h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-white text-neutral-950 px-3.5 text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                      >
                        <span>Enter Event & Manage Teams</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: INSIDE THE EVENT (LIVE EVENT & TEAMS MANAGEMENT)                 */
        /* ========================================================================= */
        <div className="space-y-8 animate-fadeIn">
          {/* Top Breadcrumb & Switcher Bar */}
          <div className="rounded-2xl border border-white/15 bg-[#0e0e12] p-4 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  handleSelectEvent(null);
                  setTeams([]);
                  setSearchQuery("");
                }}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-bold text-white hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-[family-name:var(--font-google-sans)]"
                title="Return to Events list"
              >
                <span>←</span>
                <span>All Live Events</span>
              </button>

              <div className="h-5 w-[1px] bg-white/20 hidden sm:block" />

              {/* Event Switcher Dropdown */}
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="rounded-xl border border-white/20 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-white focus:border-white/50 focus:outline-none cursor-pointer appearance-none pr-8 font-[family-name:var(--font-google-sans)] shadow-inner"
                >
                  {events.map((e) => (
                    <option key={e._id} value={e._id} className="bg-neutral-900 text-white">
                      {e.title} ({e.tag})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-2 text-xs text-white/50">
                  ▾
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => selectedEventId && fetchTeamsForEvent(selectedEventId)}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sync team registrations from database"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Data</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export registered teams and attendance to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Event Header Card Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {eventMeta?.tag || selectedEvent?.tag || "Live Event"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      (eventMeta?.registrationStatus || selectedEvent?.registrationStatus) === "open"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "bg-white/10 border-white/20 text-white/60"
                    }`}
                  >
                    Registration: {eventMeta?.registrationStatus || selectedEvent?.registrationStatus || "open"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                  {eventMeta?.title || selectedEvent?.title || "Active Pitch Session"}
                </h2>
                <p className="text-xs text-white/60 font-sans mt-1">
                  Venue: <strong className="text-white">{eventMeta?.venue || selectedEvent?.venue || "Heritage Auditorium"}</strong> • Scheduled: {eventMeta?.date || selectedEvent?.date || "TBD"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-2xl border border-white/15 bg-[#16161d] px-3.5 py-1.5 text-xs font-mono text-white shadow-sm flex items-center gap-2">
                  <span>Teams: <strong className="text-white">{stats.total}</strong></span>
                  <span className="text-white/20">•</span>
                  <span>Checked In: <strong className="text-emerald-300">{stats.checkedIn}</strong></span>
                  <span className="text-white/20">•</span>
                  <span>Pending: <strong className="text-amber-300">{stats.remaining}</strong></span>
                </span>
                <span className="rounded-2xl border border-sky-500/30 bg-sky-950/25 px-3.5 py-1.5 text-xs font-mono text-sky-200 shadow-sm flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Participants: <strong className="text-white">{stats.totalParticipants}</strong></span>
                  <span className="text-sky-500/40">•</span>
                  <span className="text-emerald-300 font-semibold">{stats.checkedInParticipants} Checked</span>
                  <span className="text-sky-500/40">•</span>
                  <span className="text-amber-300 font-semibold">{stats.remainingParticipants} Pending</span>
                </span>
              </div>
            </div>
          </div>

          {/* 4 Rich Stat Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Registered */}
            <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl hover:border-white/25 transition-all">
              <div className="flex items-center justify-between text-xs text-white/60 uppercase tracking-wider mb-2 font-mono">
                <span>Registered Teams</span>
                <Users className="h-4 w-4 text-neutral-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)] mb-1">
                {stats.total}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-sky-300/80 font-mono mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>{stats.totalParticipants} total participants</span>
              </div>
            </div>

            {/* Stat 2: Venue Checked-In */}
            <div className="rounded-3xl border border-emerald-500/30 bg-[#0a1f18] p-5 shadow-2xl shadow-emerald-950/20 hover:border-emerald-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-emerald-400 uppercase tracking-wider mb-2 font-mono">
                <span>Venue Checked-In</span>
                <span className="font-mono text-[10px] font-bold">PASS</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.checkedIn}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/90 font-mono mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{stats.checkedInParticipants} participants checked in</span>
              </div>
            </div>

            {/* Stat 3: Awaiting Arrival */}
            <div className="rounded-3xl border border-amber-500/30 bg-[#241a08] p-5 shadow-2xl shadow-amber-950/20 hover:border-amber-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-amber-400 uppercase tracking-wider mb-2 font-mono">
                <span>Awaiting Arrival</span>
                <span className="font-mono text-[10px] font-bold">PENDING</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.remaining}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-mono mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{stats.remainingParticipants} participants pending</span>
              </div>
            </div>

            {/* Stat 4: Check-in Attendance Rate */}
            <div className="rounded-3xl border border-sky-500/30 bg-[#081a2e] p-5 shadow-2xl shadow-sky-950/20 hover:border-sky-400/50 transition-all">
              <div className="flex items-center justify-between text-xs text-sky-400 uppercase tracking-wider mb-2 font-mono">
                <span>Attendance Rate</span>
                <span className="font-mono text-[10px] font-bold">% RATE</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-sky-300 font-[family-name:var(--font-google-sans)] mb-1">
                {stats.participantRate}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.participantRate}%` }}
                />
              </div>
              <p className="text-[11px] text-sky-300/70 mt-1">
                {stats.checkedInParticipants} of {stats.totalParticipants} participants ({stats.checkInRate}% teams)
              </p>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="space-y-4">
            {/* Search and View Mode Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    viewMode === "teams"
                      ? "Search by team name, code, leader, roll no..."
                      : "Search by student name, email, roll no, team..."
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#16161d] pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-rose-500/50 focus:outline-none shadow-inner transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Right: View Mode Toggle (By Teams / By Participants) & Showing Count */}
              <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode("teams")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      viewMode === "teams"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>By Teams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("participants")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      viewMode === "participants"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>By Participants</span>
                  </button>
                </div>

                <div className="text-xs text-white/50 font-mono hidden md:block">
                  {viewMode === "teams" ? (
                    <>
                      <strong className="text-white font-sans">{filteredTeams.length}</strong> of{" "}
                      <strong className="text-white font-sans">{teams.length}</strong> teams
                    </>
                  ) : (
                    <>
                      <strong className="text-white font-sans">{filteredParticipants.length}</strong> of{" "}
                      <strong className="text-white font-sans">{allParticipants.length}</strong> participants
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Tabs Bar (Registration Status on Left & Attendance Status on Right) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
              {/* Left: Registration Status (Fully Registered / Forming / All) */}
              <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setFilterDomain("registration");
                    setStatusFilter("submitted");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                    filterDomain === "registration" && statusFilter === "submitted"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>Fully Registered</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      filterDomain === "registration" && statusFilter === "submitted"
                        ? "bg-black/10 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {viewMode === "teams" ? submittedCount : stats.totalParticipants}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterDomain("registration");
                    setStatusFilter("forming");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                    filterDomain === "registration" && statusFilter === "forming"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>Forming</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      filterDomain === "registration" && statusFilter === "forming"
                        ? "bg-black/10 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {viewMode === "teams"
                      ? formingCount
                      : Math.max(0, allParticipants.length - stats.totalParticipants)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterDomain("registration");
                    setStatusFilter("all");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                    filterDomain === "registration" && statusFilter === "all"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{viewMode === "teams" ? "All Teams" : "All Participants"}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      filterDomain === "registration" && statusFilter === "all"
                        ? "bg-black/10 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {viewMode === "teams" ? teams.length : allParticipants.length}
                  </span>
                </button>
              </div>

              {/* Right: Attendance Filter (All / Checked In / Not Checked In) */}
              <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setFilterDomain("attendance");
                    setActiveFilter("all");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                    filterDomain === "attendance" && activeFilter === "all"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      filterDomain === "attendance" && activeFilter === "all"
                        ? "bg-black/10 text-black font-bold"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {viewMode === "teams" ? stats.total : stats.totalParticipants}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterDomain("attendance");
                    setActiveFilter("checked_in");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                    filterDomain === "attendance" && activeFilter === "checked_in"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        filterDomain === "attendance" && activeFilter === "checked_in"
                          ? "bg-emerald-600"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span>Checked In</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      filterDomain === "attendance" && activeFilter === "checked_in"
                        ? "bg-black/10 text-black font-bold"
                        : "bg-emerald-500/20 text-emerald-300 font-semibold"
                    }`}
                  >
                    {viewMode === "teams" ? stats.checkedIn : stats.checkedInParticipants}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterDomain("attendance");
                    setActiveFilter("not_checked_in");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
                    filterDomain === "attendance" && activeFilter === "not_checked_in"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        filterDomain === "attendance" && activeFilter === "not_checked_in"
                          ? "bg-amber-600"
                          : "bg-amber-400"
                      }`}
                    />
                    <span>Not Checked In</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      filterDomain === "attendance" && activeFilter === "not_checked_in"
                        ? "bg-black/10 text-black font-bold"
                        : "bg-amber-500/20 text-amber-300 font-semibold"
                    }`}
                  >
                    {viewMode === "teams" ? stats.remaining : stats.remainingParticipants}
                  </span>
                </button>
              </div>
            </div>

            {/* Live Participants Attendance Overview Strip */}
            <div className="rounded-2xl border border-white/10 bg-[#0e0e12]/90 backdrop-blur-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-[family-name:var(--font-google-sans)] flex items-center gap-2">
                    <span>Participant Attendance Tracking</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-white/80">
                      {stats.totalParticipants} Confirmed Students
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Live verification count of confirmed participants across all {stats.total} submitted teams (excluding forming)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-white/60">Checked In:</span>
                  <strong className="text-emerald-200">{stats.checkedInParticipants}</strong>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-white/60">Not Checked In:</span>
                  <strong className="text-amber-200">{stats.remainingParticipants}</strong>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
                  <span className="text-white/60">Turnout:</span>
                  <strong className="text-sky-200">{stats.participantRate}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Teams / Participants Table View (Matching Teams & Rosters Design) */}
          {loadingTeams ? (
            <div className="rounded-2xl border border-white/15 bg-[#0e0e12] p-20 text-center shadow-2xl">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mb-4" />
              <p className="text-xs text-neutral-400 font-mono">Loading registered teams for this event...</p>
            </div>
          ) : viewMode === "participants" ? (
            <div className="rounded-2xl border border-white/15 bg-[#0e0e12] shadow-2xl overflow-hidden">
              {filteredParticipants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-medium">Participant</th>
                        <th className="py-3.5 px-4 font-medium">Attendance</th>
                        <th className="py-3.5 px-4 font-medium">Team & Code</th>
                        <th className="py-3.5 px-4 font-medium">College Email</th>
                        <th className="py-3.5 px-4 font-medium">Roll No</th>
                        <th className="py-3.5 px-4 font-medium">Contact</th>
                        <th className="py-3.5 px-4 font-medium">Department</th>
                        <th className="py-3.5 px-4 font-medium">Academic Year</th>
                        <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredParticipants.map((p) => {
                        const parsed = parseHeritageEmail(p.email || "", p.name);
                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Participant Name & Role */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white text-sm tracking-tight">{p.name}</div>
                              <div className="inline-flex items-center gap-1 mt-0.5">
                                <span
                                  className={`font-mono text-[10px] font-bold rounded px-1.5 py-0.5 ${
                                    p.role === "Team Leader"
                                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                      : "bg-white/10 text-white/80 border border-white/15"
                                  }`}
                                >
                                  {p.role}
                                </span>
                              </div>
                            </td>

                            {/* Attendance Status */}
                            <td className="py-3.5 px-4">
                              {!isTeamSubmitted(p.team) ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-neutral-400 bg-white/[0.04] border border-white/10 whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                                  <span>Ineligible (Forming)</span>
                                </div>
                              ) : p.checkedIn ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Checked In</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  <span>Not Checked In</span>
                                </div>
                              )}
                              {isTeamSubmitted(p.team) && p.checkedInAt && (
                                <div className="text-[10px] font-mono text-white/40 mt-0.5">
                                  {new Date(p.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                            </td>

                            {/* Team & Code */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-white">{p.teamName}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-[11px] text-rose-400 font-bold">{p.teamCode}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.teamCode);
                                    showToast(`Copied code "${p.teamCode}" to clipboard!`);
                                  }}
                                  className="h-4 w-4 rounded bg-white/[0.05] hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                                  title="Copy Team Code"
                                >
                                  <Clipboard className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </td>

                            {/* College Email */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {p.email ? (
                                <a
                                  href={`mailto:${p.email}`}
                                  className="text-neutral-300 hover:text-white truncate block max-w-[170px] transition-colors"
                                >
                                  {p.email}
                                </a>
                              ) : (
                                <span className="text-white/30">N/A</span>
                              )}
                            </td>

                            {/* Roll No */}
                            <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                              {p.roll ? (
                                <span className="text-white/90 font-semibold">{p.roll}</span>
                              ) : (
                                <span className="text-white/30 font-normal">N/A</span>
                              )}
                            </td>

                            {/* Contact */}
                            <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                              {p.phone ? (
                                <a
                                  href={`tel:${p.phone}`}
                                  className="text-emerald-400 font-medium hover:underline"
                                >
                                  +91 {p.phone}
                                </a>
                              ) : (
                                <span className="text-white/30 font-normal">N/A</span>
                              )}
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span className="block text-xs font-semibold text-white whitespace-nowrap">
                                {p.department || parsed.branchName}
                              </span>
                              <span className="inline-block mt-0.5 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70 uppercase font-mono">
                                {parsed.branchCode}
                              </span>
                            </td>

                            {/* Academic Year */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="block text-xs font-bold text-white">
                                {parsed.academicYear}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono font-medium">
                                Class of {parsed.passingYear}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                {isTeamSubmitted(p.team) && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleParticipantCheckIn(p)}
                                    disabled={actionLoadingId === p.id}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                      p.checkedIn
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                        : "bg-white text-black hover:bg-neutral-200 shadow-sm"
                                    }`}
                                  >
                                    {actionLoadingId === p.id ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : p.checkedIn ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span>Present</span>
                                      </>
                                    ) : (
                                      <span>Check In</span>
                                    )}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setInspectingTeam(p.team)}
                                  className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                                  title="View full team dossier"
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-neutral-400 font-mono space-y-3">
                  <Users className="h-8 w-8 text-neutral-500 mx-auto" />
                  <p>
                    {searchQuery
                      ? `No participants match "${searchQuery}".`
                      : "No participants match the selected attendance filter."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-[#0e0e12] shadow-2xl overflow-hidden">
              {filteredTeams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-neutral-400 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-medium">Team & Code</th>
                        <th className="py-3.5 px-4 font-medium">Attendance</th>
                        <th className="py-3.5 px-4 font-medium">Team Leader</th>
                        <th className="py-3.5 px-4 font-medium">Roll No</th>
                        <th className="py-3.5 px-4 font-medium">Contact</th>
                        <th className="py-3.5 px-4 font-medium">Department</th>
                        <th className="py-3.5 px-4 font-medium">Academic Year</th>
                        <th className="py-3.5 px-4 font-medium text-center">Roster</th>
                        <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTeams.map((team) => {
                        const parsed = parseHeritageEmail(team.lead?.email || "", team.lead?.name);
                        const isSubmitted = isTeamSubmitted(team);
                        const rosterCount = 1 + (team.members?.length || 0);

                        return (
                          <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Team & Code */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white text-sm tracking-tight">{team.teamName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="font-mono text-[11px] text-rose-400 font-bold">
                                  {team.teamCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(team.teamCode);
                                    showToast(`Copied code "${team.teamCode}" to clipboard!`);
                                  }}
                                  className="h-4 w-4 rounded bg-white/[0.05] hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                                  title="Copy Team Code"
                                >
                                  <Clipboard className="h-2.5 w-2.5" />
                                </button>
                                {isSubmitted ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                    <span>Submitted</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                                    <span>Forming</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Attendance Status */}
                            <td className="py-3.5 px-4">
                              {(() => {
                                const leadPresent = Boolean(team.lead?.checkedIn || (team.checkedIn && team.lead?.checkedIn !== false));
                                const membersPresent = Array.isArray(team.members)
                                  ? team.members.filter((m) => Boolean(m.checkedIn !== undefined ? m.checkedIn : team.checkedIn)).length
                                  : 0;
                                const presentCount = (leadPresent ? 1 : 0) + membersPresent;
                                const isAllPresent = team.checkedIn || (rosterCount > 0 && presentCount >= rosterCount);

                                if (!isSubmitted) {
                                  return (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-neutral-400 bg-white/[0.04] border border-white/10 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                                      <span>Ineligible (Forming)</span>
                                    </div>
                                  );
                                }

                                if (isAllPresent) {
                                  return (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      <span>Checked In ({rosterCount}/{rosterCount} Pax)</span>
                                    </div>
                                  );
                                }

                                if (presentCount > 0) {
                                  return (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono bg-sky-500/15 border border-sky-500/30 text-sky-300 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                      <span>In Progress ({presentCount}/{rosterCount} Pax)</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>Not Checked In (0/{rosterCount} Pax)</span>
                                  </div>
                                );
                              })()}
                              {isSubmitted && team.checkedInAt && (
                                <div className="text-[10px] font-mono text-white/40 mt-0.5">
                                  {new Date(team.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                            </td>

                            {/* Team Leader */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-white">{team.lead.name}</div>
                              <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[160px] mt-0.5">
                                <a href={`mailto:${team.lead.email}`} className="hover:text-white transition-colors">
                                  {team.lead.email}
                                </a>
                              </div>
                            </td>

                            {/* Roll No */}
                            <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                              {team.lead?.roll ? (
                                <span className="text-white/90 font-semibold">{team.lead.roll}</span>
                              ) : (
                                <span className="text-white/30 font-normal">N/A</span>
                              )}
                            </td>

                            {/* Contact */}
                            <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                              {team.lead?.phone ? (
                                <a
                                  href={`tel:${team.lead.phone}`}
                                  className="text-emerald-400 font-medium hover:underline"
                                >
                                  +91 {team.lead.phone}
                                </a>
                              ) : (
                                <span className="text-white/30 font-normal">N/A</span>
                              )}
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span className="block text-xs font-semibold text-white whitespace-nowrap">
                                {team.lead?.department || team.department || parsed.branchName}
                              </span>
                              <span className="inline-block mt-0.5 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70 uppercase font-mono">
                                {parsed.branchCode}
                              </span>
                            </td>

                            {/* Academic Year */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="block text-xs font-bold text-white">
                                {parsed.academicYear}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono font-medium">
                                Class of {parsed.passingYear}
                              </span>
                            </td>

                            {/* Roster */}
                            <td className="py-3.5 px-4 font-mono text-neutral-300 text-center">
                              <button
                                type="button"
                                onClick={() => setInspectingTeam(team)}
                                className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                                title="View full team roster"
                              >
                                <Users className="h-3.5 w-3.5 text-neutral-400" />
                                <span>{rosterCount}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                {isSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCheckIn(team)}
                                    disabled={actionLoadingId === team.id}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                      team.checkedIn
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                        : "bg-white text-black hover:bg-neutral-200 shadow-sm"
                                    }`}
                                  >
                                    {actionLoadingId === team.id ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : team.checkedIn ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span>Checked In</span>
                                      </>
                                    ) : (
                                      <span>Check In</span>
                                    )}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setInspectingTeam(team)}
                                  className="rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                                  title="View complete dossier"
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-neutral-400 font-mono space-y-3">
                  <Users className="h-8 w-8 text-neutral-500 mx-auto" />
                  <p>
                    {statusFilter === "submitted" && submittedCount === 0
                      ? "No fully registered teams submitted yet for current filters."
                      : statusFilter === "forming"
                      ? "No forming teams found."
                      : searchQuery
                      ? `No teams match "${searchQuery}".`
                      : "No teams found matching current filters."}
                  </p>
                  {statusFilter === "submitted" && formingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDomain("registration");
                        setStatusFilter("forming");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-sans text-xs transition-colors cursor-pointer"
                    >
                      <span>View Forming Teams ({formingCount})</span>
                    </button>
                  )}
                  {teams.length === 0 && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="font-[family-name:var(--font-google-sans)] text-xs rounded-xl"
                        onClick={() => setShowAddTeamModal(true)}
                      >
                        + Register First Walk-In Team
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODAL 1: TEAM FULL DOSSIER INSPECTOR */}
          {inspectingTeam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setInspectingTeam(null)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="border-b border-white/10 pb-6 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold rounded-xl bg-white/10 border border-white/20 text-white px-3 py-1">
                      {inspectingTeam.teamCode}
                    </span>
                    {isTeamSubmitted(inspectingTeam) ? (() => {
                      const rosterTotal = 1 + (inspectingTeam.members?.length || 0);
                      const leadPresent = Boolean(inspectingTeam.lead?.checkedIn || (inspectingTeam.checkedIn && inspectingTeam.lead?.checkedIn !== false));
                      const membersPresent = (inspectingTeam.members || []).filter((m) => Boolean(m.checkedIn !== undefined ? m.checkedIn : inspectingTeam.checkedIn)).length;
                      const presentCount = (leadPresent ? 1 : 0) + membersPresent;
                      const isComplete = inspectingTeam.checkedIn || (rosterTotal > 0 && presentCount >= rosterTotal);

                      if (isComplete) {
                        return (
                          <span className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                            Verified Check-In ({rosterTotal}/{rosterTotal} Pax)
                          </span>
                        );
                      }

                      if (presentCount > 0) {
                        return (
                          <span className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border bg-sky-500/20 border-sky-500/40 text-sky-300">
                            In Progress ({presentCount}/{rosterTotal} Pax)
                          </span>
                        );
                      }

                      return (
                        <span className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border bg-amber-500/20 border-amber-500/30 text-amber-300">
                          Pending Check-In (0/{rosterTotal} Pax)
                        </span>
                      );
                    })() : (
                      <span className="rounded-full px-3 py-0.5 text-xs font-mono font-medium border bg-white/[0.04] border-white/10 text-neutral-400">
                        Ineligible (Forming)
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                    {inspectingTeam.teamName}
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    Event: {eventMeta?.title || "OnCampus"} • Department: {inspectingTeam.department} • Total Participants: {inspectingTeam.members.length + 1}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-[#16161d] p-5 mb-6 shadow-inner">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/60 mb-3">
                    Team Leader Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-white/40 block">Full Name:</span>
                      <strong className="text-white text-sm font-sans">{inspectingTeam.lead.name}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block">Attendance:</span>
                      {(() => {
                        const leadChecked = Boolean(inspectingTeam.lead?.checkedIn || (inspectingTeam.checkedIn && inspectingTeam.lead?.checkedIn !== false));
                        return leadChecked ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Present</span>
                            {inspectingTeam.lead?.checkedInAt && (
                              <span className="text-white/40 text-[10px] font-normal">
                                ({new Date(inspectingTeam.lead.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Not Checked In</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="text-white/40 block">Email Address:</span>
                      <a
                        href={`mailto:${inspectingTeam.lead.email}`}
                        className="text-white hover:underline"
                      >
                        {inspectingTeam.lead.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-white/40 block">Phone Number:</span>
                      <a
                        href={`tel:${inspectingTeam.lead.phone}`}
                        className="text-emerald-400 hover:underline"
                      >
                        {inspectingTeam.lead.phone || "Not provided"}
                      </a>
                    </div>
                    <div>
                      <span className="text-white/40 block">Roll / Student ID:</span>
                      <span className="text-white">{inspectingTeam.lead.roll || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-white/60 mb-3">
                    <span>Team Members ({inspectingTeam.members.length})</span>
                    <span className="text-white/80">Total Roster: {inspectingTeam.members.length + 1} Participants</span>
                  </div>

                  {inspectingTeam.members.length > 0 ? (
                    <div className="space-y-3">
                      {inspectingTeam.members.map((member, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-white/10 bg-[#16161d] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-inner"
                        >
                          <div>
                            <div className="text-sm font-bold text-white font-sans">
                              {member.name || `Member #${i + 1}`}
                            </div>
                            <div className="text-white/60">{member.email || "No email"}</div>
                            {member.department && (
                              <div className="text-[11px] text-white/40">{member.department}</div>
                            )}
                          </div>
                          <div className="text-right sm:text-right text-white/50 text-[11px] flex flex-col items-end gap-1.5">
                            {(() => {
                              const memChecked = Boolean(member.checkedIn !== undefined ? member.checkedIn : inspectingTeam.checkedIn);
                              return memChecked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                                  <span>Present</span>
                                  {member.checkedInAt && (
                                    <span className="text-white/40 text-[9px] font-normal">
                                      ({new Date(member.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20 font-mono">
                                  <span>Not Checked In</span>
                                </span>
                              );
                            })()}
                            {member.phone && (
                              <div className="flex items-center gap-1 justify-end">
                                <Phone className="h-3 w-3 text-emerald-400" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.roll && <div>Roll: {member.roll}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">
                      No additional team members registered under this team code.
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  {isTeamSubmitted(inspectingTeam) ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === inspectingTeam.id}
                      onClick={() => handleToggleCheckIn(inspectingTeam)}
                      className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        actionLoadingId === inspectingTeam.id
                          ? "opacity-50 cursor-not-allowed bg-white/10 text-white/50"
                          : inspectingTeam.checkedIn
                          ? "bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300"
                          : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                      }`}
                    >
                      {actionLoadingId === inspectingTeam.id
                        ? "Updating..."
                        : inspectingTeam.checkedIn
                        ? "Undo Check-In"
                        : "Mark Verified Check-In"}
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-white/40 italic py-1">
                      Forming team: registration must be submitted before check-in.
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingTeam(null)}
                      className="rounded-xl bg-white/[0.08] hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: REGISTER WALK-IN TEAM */}
          {showAddTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5">
                    Walk-In / Stage Registration
                  </span>
                  <h2 className="text-2xl font-black text-white font-[family-name:var(--font-google-sans)] mt-2">
                    Register Team for {eventMeta?.title || "Event"}
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    An official team code (e.g. HULT-XXXX) will be generated automatically upon submission.
                  </p>
                </div>

                <form onSubmit={handleCreateWalkInTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-white/70 mb-1">
                      Team Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTeam.teamName}
                      onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                      placeholder="e.g. SolarBloom"
                      className="w-full rounded-xl border border-white/15 bg-[#16161d] px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none shadow-inner"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-[#16161d] p-4 space-y-3 shadow-inner">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Team Leader Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Leader Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeam.leadName}
                          onChange={(e) => setNewTeam({ ...newTeam, leadName: e.target.value })}
                          placeholder="Leader full name"
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Leader Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newTeam.leadEmail}
                          onChange={(e) => setNewTeam({ ...newTeam, leadEmail: e.target.value })}
                          placeholder="leader@heritageit.edu.in"
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          value={newTeam.leadPhone}
                          onChange={(e) => setNewTeam({ ...newTeam, leadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          placeholder="10-digit phone"
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-white/60 mb-1">
                          Department / Branch
                        </label>
                        <input
                          type="text"
                          value={newTeam.department}
                          onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
                          placeholder="CSE, ECE, Biotechnology..."
                          className="w-full rounded-xl border border-white/15 bg-[#121217] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-[#16161d] p-4 space-y-3 shadow-inner">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Team Members (Optional)
                    </span>

                    {newTeam.members.map((member, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={`Member #${idx + 1} Name`}
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...newTeam.members];
                            updated[idx].name = e.target.value;
                            setNewTeam({ ...newTeam, members: updated });
                          }}
                          className="rounded-xl border border-white/15 bg-[#121217] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none shadow-inner"
                        />
                        <input
                          type="email"
                          placeholder={`Member #${idx + 1} Email`}
                          value={member.email}
                          onChange={(e) => {
                            const updated = [...newTeam.members];
                            updated[idx].email = e.target.value;
                            setNewTeam({ ...newTeam, members: updated });
                          }}
                          className="rounded-xl border border-white/15 bg-[#121217] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none shadow-inner"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setShowAddTeamModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="default"
                      className="font-[family-name:var(--font-google-sans)]"
                    >
                      Confirm Registration
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* ========================================================================= */}
          {/* MODAL 2: LIVE CAMERA PARTICIPANT QR SCANNER MODAL                         */}
          {/* ========================================================================= */}
          {selectedEventId && (
            <LiveCameraScannerModal
              isOpen={showCameraScanner}
              eventId={selectedEventId}
              eventTitle={eventMeta?.title || selectedEvent?.title}
              onClose={() => setShowCameraScanner(false)}
              onCheckInTeam={async (scannedCode) => {
                try {
                  const res = await fetch("/api/admin/teams", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "scan_check_in",
                      rawCode: scannedCode,
                      eventId: selectedEventId,
                    }),
                  });

                  const data = await res.json();
                  if (res.ok && data.success) {
                    fetchTeamsForEvent(selectedEventId);
                    return {
                      success: true,
                      message:
                        data.message ||
                        `Check-in recorded for ${data.participant?.name || data.team?.teamName || scannedCode}!`,
                      teamName: data.team?.teamName,
                      teamCode: data.team?.teamCode,
                    };
                  } else {
                    return {
                      success: false,
                      message: data.error || `Failed to check in (${scannedCode}).`,
                    };
                  }
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "Network error processing check-in.";
                  return {
                    success: false,
                    message,
                  };
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

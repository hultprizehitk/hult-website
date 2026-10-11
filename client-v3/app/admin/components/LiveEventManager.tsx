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
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  X,
  AlertCircle,
  Undo2,
  Lock,
  Unlock,
  Zap,
  ArrowLeft,
  ChevronDown,
  ScanLine,
  Activity,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveCameraScannerModal from "./LiveCameraScannerModal";
import CheckinMasterSwitch from "./CheckinMasterSwitch";
import OnSpotMasterSwitch from "./OnSpotMasterSwitch";
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
  isOnSpot?: boolean;
}

interface TeamLead {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
  checkedIn?: boolean;
  checkedInAt?: string | Date | null;
  isOnSpot?: boolean;
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
  isOnSpot?: boolean;
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
  isOnSpot?: boolean;
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
  checkinEnabled?: boolean;
  onSpotRegistrationEnabled?: boolean;
  maxTeams: number;
  registeredTeamsCount: number;
  registeredTeams?: RegisteredTeam[];
}

interface LiveEventManagerProps {
  isMasterAdmin?: boolean;
}

export default function LiveEventManager({ isMasterAdmin: propIsMasterAdmin }: LiveEventManagerProps = {}) {
  // Master Admin Clearance
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(propIsMasterAdmin ?? false);

  useEffect(() => {
    if (propIsMasterAdmin !== undefined) {
      setIsMasterAdmin(propIsMasterAdmin);
    } else {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((session) => {
          if (session?.user?.role === "master_admin") {
            setIsMasterAdmin(true);
          }
        })
        .catch(() => {});
    }
  }, [propIsMasterAdmin]);

  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [eventMeta, setEventMeta] = useState<EventItem | null>(null);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const isCheckinActive = Boolean(eventMeta?.checkinEnabled ?? selectedEvent?.checkinEnabled);
  const isOnSpotActive = Boolean(eventMeta?.onSpotRegistrationEnabled ?? selectedEvent?.onSpotRegistrationEnabled);

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
  const [checkInConfirmTarget, setCheckInConfirmTarget] = useState<{
    type: "team" | "participant";
    team?: RegisteredTeam;
    participant?: FlatParticipant;
    nextCheckIn: boolean;
  } | null>(null);

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
      const res = await fetch("/api/admin/events", { cache: "no-store" });
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
        const res = await fetch(`/api/admin/teams?eventId=${eventId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setTeams(Array.isArray(data.teams) ? data.teams : []);
          setEventMeta(data.event || null);
          if (data.event) {
            setEvents((prev) =>
              prev.map((e) =>
                e._id === eventId
                  ? { ...e, checkinEnabled: Boolean(data.event.checkinEnabled) }
                  : e
              )
            );
          }
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

  // Window focus auto-sync
  useEffect(() => {
    const handleFocus = () => {
      if (selectedEventId) {
        fetchTeamsForEvent(selectedEventId);
      } else {
        fetchEvents();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedEventId, fetchTeamsForEvent, fetchEvents]);

  // -------------------------------------------------------------
  // 3. Team Actions
  // -------------------------------------------------------------
  // Helper to determine if team is fully registered and submitted
  const isTeamSubmitted = (t: RegisteredTeam) => {
    return t.submissionStatus === "submitted" || Boolean(t.submittedAt);
  };

  const formatCheckInDateTime = (dateVal: string | Date | undefined | null) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    const dateStr = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toUpperCase();
    return { dateStr, timeStr, full: `${dateStr}, ${timeStr}` };
  };

  const handleToggleCheckIn = (team: RegisteredTeam) => {
    if (!selectedEventId) return;
    if (!isTeamSubmitted(team)) {
      showToast("Forming teams cannot check in until registration is submitted.", "error");
      return;
    }
    if (!team.checkedIn && !isCheckinActive) {
      showToast("Check-in is currently locked for this event. A Master Admin must enable check-in.", "error");
      return;
    }
    setCheckInConfirmTarget({
      type: "team",
      team,
      nextCheckIn: !team.checkedIn,
    });
  };

  const executeToggleCheckIn = async (team: RegisteredTeam, targetState?: boolean) => {
    if (!selectedEventId) return;
    if (!isTeamSubmitted(team)) {
      showToast("Forming teams cannot check in until registration is submitted.", "error");
      return;
    }
    const nextCheckIn = typeof targetState === "boolean" ? targetState : !team.checkedIn;
    if (nextCheckIn && !isCheckinActive) {
      showToast("Check-in is currently locked for this event. A Master Admin must enable check-in.", "error");
      return;
    }
    setActionLoadingId(team.id);

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

  const handleToggleParticipantCheckIn = (p: FlatParticipant) => {
    if (!selectedEventId) return;
    if (!isTeamSubmitted(p.team)) {
      showToast("Forming teams cannot check in until registration is submitted.", "error");
      return;
    }
    if (!p.checkedIn && !isCheckinActive) {
      showToast("Check-in is currently locked for this event. A Master Admin must enable check-in.", "error");
      return;
    }
    setCheckInConfirmTarget({
      type: "participant",
      participant: p,
      nextCheckIn: !p.checkedIn,
    });
  };

  const executeToggleParticipantCheckIn = async (p: FlatParticipant, targetState?: boolean) => {
    if (!selectedEventId) return;
    if (!isTeamSubmitted(p.team)) {
      showToast("Forming teams cannot check in until registration is submitted.", "error");
      return;
    }
    const nextCheckIn = typeof targetState === "boolean" ? targetState : !p.checkedIn;
    if (nextCheckIn && !isCheckinActive) {
      showToast("Check-in is currently locked for this event. A Master Admin must enable check-in.", "error");
      return;
    }
    setActionLoadingId(p.id);
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
          isOnSpot: true,
          checkedIn: true,
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
        "Registration Channel",
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
        `"${p.isOnSpot ? "ON-SPOT" : "ONLINE"}"`,
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
      "Registration Channel",
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
        `"${t.isOnSpot ? "ON-SPOT" : "ONLINE"}"`,
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
        isOnSpot: Boolean(t.isOnSpot || t.lead?.isOnSpot),
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
            isOnSpot: Boolean(t.isOnSpot || m.isOnSpot),
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

                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                          <OnSpotMasterSwitch
                            eventId={ev._id}
                            onSpotRegistrationEnabled={Boolean(ev.onSpotRegistrationEnabled)}
                            isMasterAdmin={isMasterAdmin}
                            onToggle={(newState) => {
                              setEvents((prev) =>
                                prev.map((e) =>
                                  e._id === ev._id
                                    ? {
                                        ...e,
                                        onSpotRegistrationEnabled: newState,
                                        ...(newState ? {} : { registrationStatus: "closed" }),
                                      }
                                    : e
                                )
                              );
                              showToast(
                                newState
                                  ? `On-Spot registration is now LIVE for "${ev.title}".`
                                  : `On-Spot registration has been CLOSED for "${ev.title}". Registrations closed.`
                              );
                            }}
                            compact={true}
                          />
                          <CheckinMasterSwitch
                            eventId={ev._id}
                            checkinEnabled={Boolean(ev.checkinEnabled)}
                            isMasterAdmin={isMasterAdmin}
                            onToggle={(newState) => {
                              setEvents((prev) =>
                                prev.map((e) => (e._id === ev._id ? { ...e, checkinEnabled: newState } : e))
                              );
                              showToast(
                                newState
                                  ? `Check-in is now ACTIVE for "${ev.title}".`
                                  : `Check-in has been LOCKED for "${ev.title}".`
                              );
                            }}
                            compact={true}
                          />
                        </div>
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
          {/* Command Rail */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0b10] p-2 shadow-2xl">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  handleSelectEvent(null);
                  setTeams([]);
                  setSearchQuery("");
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer"
                title="Return to Events list"
                aria-label="All live events"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {/* Event Switcher Dropdown */}
              <div className="relative min-w-0 flex-1 lg:flex-none">
                <span className="pointer-events-none absolute left-3.5 top-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                  Event
                </span>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="h-10 w-full lg:w-auto lg:max-w-sm truncate rounded-xl border border-white/10 bg-white/[0.04] pl-3.5 pr-9 pt-3.5 text-xs font-semibold text-white transition-colors hover:border-white/25 focus:border-white/40 focus:outline-none cursor-pointer appearance-none font-[family-name:var(--font-google-sans)]"
                >
                  {events.map((e) => (
                    <option key={e._id} value={e._id} className="bg-neutral-900 text-white">
                      {e.title} ({e.tag})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            {/* Master Switches & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.06] bg-black/30 p-1">
                {selectedEventId && (
                  <OnSpotMasterSwitch
                    eventId={selectedEventId}
                    onSpotRegistrationEnabled={isOnSpotActive}
                    isMasterAdmin={isMasterAdmin}
                    onToggle={(newState) => {
                      setEvents((prev) =>
                        prev.map((e) =>
                          e._id === selectedEventId
                            ? {
                                ...e,
                                onSpotRegistrationEnabled: newState,
                                ...(newState ? {} : { registrationStatus: "closed" }),
                              }
                            : e
                        )
                      );
                      setEventMeta((prev) =>
                        prev
                          ? {
                              ...prev,
                              onSpotRegistrationEnabled: newState,
                              ...(newState ? {} : { registrationStatus: "closed" }),
                            }
                          : null
                      );
                      showToast(
                        newState
                          ? "On-Spot Registration is now LIVE on website."
                          : "On-Spot Registration has been CLOSED. Registrations are now closed."
                      );
                    }}
                  />
                )}
                {selectedEventId && (
                  <CheckinMasterSwitch
                    eventId={selectedEventId}
                    checkinEnabled={isCheckinActive}
                    isMasterAdmin={isMasterAdmin}
                    onToggle={(newState) => {
                      setEvents((prev) =>
                        prev.map((e) => (e._id === selectedEventId ? { ...e, checkinEnabled: newState } : e))
                      );
                      setEventMeta((prev) => (prev ? { ...prev, checkinEnabled: newState } : null));
                      showToast(
                        newState
                          ? "Check-in is now OPEN for this event."
                          : "Check-in has been LOCKED for this event."
                      );
                    }}
                  />
                )}
              </div>

              <div className="hidden h-6 w-px bg-white/10 lg:block" />

              <button
                type="button"
                onClick={() => selectedEventId && fetchTeamsForEvent(selectedEventId)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer"
                title="Sync team registrations from database"
                aria-label="Sync data"
              >
                <RefreshCw className={`h-4 w-4 ${loadingTeams ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs font-semibold text-white/80 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer"
                title="Export registered teams and attendance to CSV"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>

              <Link
                href={`/admin/scanner?eventId=${selectedEventId || ""}`}
                className="group flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-neutral-950 shadow-[0_0_24px_rgba(255,255,255,0.12)] transition-all hover:bg-neutral-200 cursor-pointer font-[family-name:var(--font-google-sans)]"
                title="Open QR Scanner Console"
              >
                <ScanLine className="h-4 w-4" />
                <span>Scanner</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Event Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#08080c] shadow-2xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
                maskImage: "radial-gradient(ellipse 80% 90% at 20% 0%, black 20%, transparent 70%)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 90% at 20% 0%, black 20%, transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute -top-40 -left-24 h-96 w-96 rounded-full blur-3xl transition-colors duration-700 ${
                isCheckinActive ? "bg-emerald-500/15" : "bg-rose-500/10"
              }`}
            />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-sky-500/[0.06] blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:items-end">
              <div className="min-w-0">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {isCheckinActive ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Check-in Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                      <Lock className="h-3 w-3" />
                      Check-in Locked
                    </span>
                  )}
                  <span className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    {eventMeta?.tag || selectedEvent?.tag || "Live Event"}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      (eventMeta?.registrationStatus || selectedEvent?.registrationStatus) === "open"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-white/45"
                    }`}
                  >
                    Reg · {eventMeta?.registrationStatus || selectedEvent?.registrationStatus || "open"}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight text-white font-[family-name:var(--font-google-sans)] text-balance">
                  {eventMeta?.title || selectedEvent?.title || "Active Pitch Session"}
                </h2>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-white/35" />
                    <span className="font-medium text-white/85">{eventMeta?.venue || selectedEvent?.venue || "Heritage Auditorium"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-white/35" />
                    <span>{eventMeta?.date || selectedEvent?.date || "TBD"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-white/35" />
                    <LiveClock />
                  </span>
                </div>
              </div>

              {/* Arrival Meter */}
              <ArrivalMeter
                rate={stats.participantRate}
                arrived={stats.checkedInParticipants}
                pending={stats.remainingParticipants}
                total={stats.totalParticipants}
              />
            </div>

            {/* Check-in Locked Strip */}
            {!isCheckinActive && (
              <div className="relative flex items-center gap-3 border-t border-rose-500/20 bg-rose-500/[0.06] py-3 pl-7 pr-6 sm:pl-9 sm:pr-8">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, rgba(251,113,133,0.85) 0 4px, transparent 4px 8px)",
                  }}
                />
                <Lock className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-200/50">
                  <span className="font-semibold text-rose-300">QR scans and attendance disabled</span>
                  {" · "}
                  {isMasterAdmin ? "Flip the check-in switch to resume." : "Awaiting master admin to unlock."}
                </p>
              </div>
            )}
          </section>

          {/* Stat Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatTile
              label="Registered"
              value={stats.total}
              caption={`${stats.totalParticipants} participants`}
              progress={stats.total > 0 ? 100 : 0}
              icon={Users}
              tone="neutral"
            />
            <StatTile
              label="Checked In"
              value={stats.checkedIn}
              caption={`${stats.checkedInParticipants} participants`}
              progress={stats.checkInRate}
              icon={UserCheck}
              tone="emerald"
            />
            <StatTile
              label="Awaiting"
              value={stats.remaining}
              caption={`${stats.remainingParticipants} participants`}
              progress={stats.total > 0 ? (stats.remaining / stats.total) * 100 : 0}
              icon={Clock}
              tone="amber"
            />
            <StatTile
              label="Team Arrival"
              value={`${stats.checkInRate}%`}
              caption={`${stats.checkedIn} of ${stats.total} teams`}
              progress={stats.checkInRate}
              icon={Activity}
              tone="sky"
            />
          </div>

          {/* Roster Console: Search, Filters & Table */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl">
            <div className="space-y-3 border-b border-white/[0.06] bg-white/[0.01] p-3 sm:p-4">
              {/* View Toggle, Search & Count */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="inline-flex w-fit items-center rounded-xl border border-white/[0.06] bg-black/30 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("teams")}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all cursor-pointer ${
                      viewMode === "teams"
                        ? "bg-white text-neutral-950 font-semibold shadow-sm"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Teams</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("participants")}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all cursor-pointer ${
                      viewMode === "participants"
                        ? "bg-white text-neutral-950 font-semibold shadow-sm"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Participants</span>
                  </button>
                </div>

                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      viewMode === "teams"
                        ? "Search team, code, leader, roll no"
                        : "Search name, email, roll no, team"
                    }
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-9 text-xs text-white placeholder:text-white/30 transition-colors focus:border-white/30 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="hidden shrink-0 font-mono text-[11px] tabular-nums text-white/40 lg:block">
                  <span className="text-white">
                    {viewMode === "teams" ? filteredTeams.length : filteredParticipants.length}
                  </span>
                  {" / "}
                  {viewMode === "teams" ? `${teams.length} teams` : `${allParticipants.length} participants`}
                </div>
              </div>

              {/* Filter Groups */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                    Registration
                  </span>
                  <div className="inline-flex items-center gap-0.5 rounded-xl border border-white/[0.06] bg-black/30 p-1">
                    <FilterChip
                      label="Submitted"
                      count={viewMode === "teams" ? submittedCount : stats.totalParticipants}
                      active={filterDomain === "registration" && statusFilter === "submitted"}
                      onClick={() => {
                        setFilterDomain("registration");
                        setStatusFilter("submitted");
                      }}
                    />
                    <FilterChip
                      label="Forming"
                      count={
                        viewMode === "teams"
                          ? formingCount
                          : Math.max(0, allParticipants.length - stats.totalParticipants)
                      }
                      active={filterDomain === "registration" && statusFilter === "forming"}
                      onClick={() => {
                        setFilterDomain("registration");
                        setStatusFilter("forming");
                      }}
                    />
                    <FilterChip
                      label="All"
                      count={viewMode === "teams" ? teams.length : allParticipants.length}
                      active={filterDomain === "registration" && statusFilter === "all"}
                      onClick={() => {
                        setFilterDomain("registration");
                        setStatusFilter("all");
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                    Attendance
                  </span>
                  <div className="inline-flex items-center gap-0.5 rounded-xl border border-white/[0.06] bg-black/30 p-1">
                    <FilterChip
                      label="All"
                      count={viewMode === "teams" ? stats.total : stats.totalParticipants}
                      active={filterDomain === "attendance" && activeFilter === "all"}
                      onClick={() => {
                        setFilterDomain("attendance");
                        setActiveFilter("all");
                      }}
                    />
                    <FilterChip
                      label="Checked In"
                      dot="emerald"
                      count={viewMode === "teams" ? stats.checkedIn : stats.checkedInParticipants}
                      active={filterDomain === "attendance" && activeFilter === "checked_in"}
                      onClick={() => {
                        setFilterDomain("attendance");
                        setActiveFilter("checked_in");
                      }}
                    />
                    <FilterChip
                      label="Pending"
                      dot="amber"
                      count={viewMode === "teams" ? stats.remaining : stats.remainingParticipants}
                      active={filterDomain === "attendance" && activeFilter === "not_checked_in"}
                      onClick={() => {
                        setFilterDomain("attendance");
                        setActiveFilter("not_checked_in");
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Teams / Participants Table View */}
            {loadingTeams ? (
              <div className="divide-y divide-white/[0.04]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 max-w-full rounded bg-white/[0.08]" />
                      <div className="h-2.5 w-24 rounded bg-white/[0.05]" />
                    </div>
                    <div className="hidden h-6 w-24 rounded-full bg-white/[0.05] sm:block" />
                    <div className="hidden h-3 w-28 rounded bg-white/[0.05] md:block" />
                    <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            ) : viewMode === "participants" ? (
              filteredParticipants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                        <th className="py-3 px-4 font-medium">Participant</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Team</th>
                        <th className="py-3 px-4 font-medium">Email</th>
                        <th className="py-3 px-4 font-medium">Roll No</th>
                        <th className="py-3 px-4 font-medium">Contact</th>
                        <th className="py-3 px-4 font-medium">Department</th>
                        <th className="py-3 px-4 font-medium">Year</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredParticipants.map((p) => {
                        const parsed = parseHeritageEmail(p.email || "", p.name);
                        const eligible = isTeamSubmitted(p.team);
                        const tone: RowTone = !eligible ? "neutral" : p.checkedIn ? "emerald" : "amber";
                        const checkedAt = eligible && p.checkedIn
                          ? formatCheckInDateTime(p.checkedInAt || p.team.checkedInAt)
                          : null;

                        return (
                          <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                            {/* Participant Name & Role */}
                            <td className={`py-3.5 px-4 ${ROW_ACCENTS[tone]}`}>
                              <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                  <div className="max-w-[200px] truncate text-sm font-semibold tracking-tight text-white">
                                    {p.name}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    <MicroTag tone={p.role === "Team Leader" ? "sky" : "neutral"}>
                                      {p.role === "Team Leader" ? "Leader" : "Member"}
                                    </MicroTag>
                                    {p.isOnSpot && (
                                      <MicroTag tone="amber">
                                        <Zap size={9} />
                                        On-Spot
                                      </MicroTag>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Attendance Status */}
                            <td className="py-3.5 px-4">
                              <StatusPill
                                tone={tone}
                                label={!eligible ? "Forming" : p.checkedIn ? "Checked In" : "Pending"}
                                pulse={tone === "emerald"}
                              />
                              {checkedAt && (
                                <div className="mt-1.5 flex items-center gap-1 whitespace-nowrap font-mono text-[10px] text-white/40">
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                  <span>{checkedAt.dateStr}, {checkedAt.timeStr}</span>
                                </div>
                              )}
                            </td>

                            {/* Team & Code */}
                            <td className="py-3.5 px-4">
                              <div className="max-w-[180px] truncate font-medium text-white/90">{p.teamName}</div>
                              <TeamCode
                                code={p.teamCode}
                                onCopy={() => {
                                  navigator.clipboard.writeText(p.teamCode);
                                  showToast(`Copied code "${p.teamCode}" to clipboard!`);
                                }}
                              />
                            </td>

                            {/* College Email */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {p.email ? (
                                <a
                                  href={`mailto:${p.email}`}
                                  className="block max-w-[180px] truncate text-white/55 transition-colors hover:text-white"
                                >
                                  {p.email}
                                </a>
                              ) : (
                                <span className="text-white/20">—</span>
                              )}
                            </td>

                            {/* Roll No */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                              {p.roll ? (
                                <span className="font-medium text-white/85">{p.roll}</span>
                              ) : (
                                <span className="text-white/20">—</span>
                              )}
                            </td>

                            {/* Contact */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                              {p.phone ? (
                                <a href={`tel:${p.phone}`} className="text-white/65 transition-colors hover:text-emerald-300">
                                  +91 {p.phone}
                                </a>
                              ) : (
                                <span className="text-white/20">—</span>
                              )}
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span className="block whitespace-nowrap text-xs font-medium text-white/85">
                                {p.department || parsed.branchName}
                              </span>
                              <span className="mt-1 inline-block rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-white/55">
                                {parsed.branchCode}
                              </span>
                            </td>

                            {/* Academic Year */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="block text-xs font-medium text-white/85">{parsed.academicYear}</span>
                              <span className="font-mono text-[10px] text-white/35">Class of {parsed.passingYear}</span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                {eligible && (
                                  <CheckInButton
                                    checkedIn={p.checkedIn}
                                    loading={actionLoadingId === p.id}
                                    checkedLabel="Present"
                                    onClick={() => handleToggleParticipantCheckIn(p)}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setInspectingTeam(p.team)}
                                  className="h-8 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-white/75 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer"
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
                <EmptyRoster
                  message={
                    searchQuery
                      ? `No participants match "${searchQuery}"`
                      : "No participants match this filter"
                  }
                />
              )
            ) : filteredTeams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                      <th className="py-3 px-4 font-medium">Team</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Leader</th>
                      <th className="py-3 px-4 font-medium">Roll No</th>
                      <th className="py-3 px-4 font-medium">Contact</th>
                      <th className="py-3 px-4 font-medium">Department</th>
                      <th className="py-3 px-4 font-medium">Year</th>
                      <th className="py-3 px-4 font-medium text-center">Roster</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredTeams.map((team) => {
                      const parsed = parseHeritageEmail(team.lead?.email || "", team.lead?.name);
                      const isSubmitted = isTeamSubmitted(team);
                      const rosterCount = 1 + (team.members?.length || 0);

                      const leadPresent = Boolean(team.lead?.checkedIn || (team.checkedIn && team.lead?.checkedIn !== false));
                      const membersPresent = Array.isArray(team.members)
                        ? team.members.filter((m) => Boolean(m.checkedIn !== undefined ? m.checkedIn : team.checkedIn)).length
                        : 0;
                      const presentCount = (leadPresent ? 1 : 0) + membersPresent;
                      const isAllPresent = team.checkedIn || (rosterCount > 0 && presentCount >= rosterCount);

                      const tone: RowTone = !isSubmitted
                        ? "neutral"
                        : isAllPresent
                          ? "emerald"
                          : presentCount > 0
                            ? "sky"
                            : "amber";
                      const statusLabel = !isSubmitted
                        ? "Forming"
                        : isAllPresent
                          ? "Checked In"
                          : presentCount > 0
                            ? "Partial"
                            : "Pending";

                      let checkedAt: ReturnType<typeof formatCheckInDateTime> = null;
                      if (isSubmitted && (team.checkedIn || team.checkedInAt)) {
                        const allAts = [team.checkedInAt, team.lead?.checkedInAt, ...(team.members || []).map((m) => m.checkedInAt)].filter(Boolean) as (string | Date)[];
                        const targetAt = team.checkedInAt || (allAts.length > 0 ? allAts.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] : null);
                        checkedAt = formatCheckInDateTime(targetAt);
                      }

                      return (
                        <tr key={team.id} className="transition-colors hover:bg-white/[0.02]">
                          {/* Team & Code */}
                          <td className={`py-3.5 px-4 ${ROW_ACCENTS[tone]}`}>
                            <div className="flex items-center gap-3">
                              <div className="min-w-0">
                                <div className="max-w-[220px] truncate text-sm font-semibold tracking-tight text-white">
                                  {team.teamName}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <TeamCode
                                    code={team.teamCode}
                                    onCopy={() => {
                                      navigator.clipboard.writeText(team.teamCode);
                                      showToast(`Copied code "${team.teamCode}" to clipboard!`);
                                    }}
                                  />
                                  {team.isOnSpot && (
                                    <MicroTag tone="amber" className="mt-0.5">
                                      <Zap size={9} />
                                      On-Spot
                                    </MicroTag>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Attendance Status */}
                          <td className="py-3.5 px-4">
                            <StatusPill tone={tone} label={statusLabel} pulse={tone === "emerald" || tone === "sky"} />
                            {isSubmitted && (
                              <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap font-mono text-[10px] text-white/40">
                                <PresenceDots present={presentCount} total={rosterCount} tone={tone} />
                                <span className="tabular-nums">{presentCount}/{rosterCount}</span>
                                {checkedAt && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5 shrink-0" />
                                    {checkedAt.timeStr}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Team Leader */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-white/90">{team.lead.name}</div>
                            <a
                              href={`mailto:${team.lead.email}`}
                              className="mt-0.5 block max-w-[170px] truncate font-mono text-[10px] text-white/40 transition-colors hover:text-white"
                            >
                              {team.lead.email}
                            </a>
                          </td>

                          {/* Roll No */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                            {team.lead?.roll ? (
                              <span className="font-medium text-white/85">{team.lead.roll}</span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                            {team.lead?.phone ? (
                              <a href={`tel:${team.lead.phone}`} className="text-white/65 transition-colors hover:text-emerald-300">
                                +91 {team.lead.phone}
                              </a>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-4">
                            <span className="block whitespace-nowrap text-xs font-medium text-white/85">
                              {team.lead?.department || team.department || parsed.branchName}
                            </span>
                            <span className="mt-1 inline-block rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-white/55">
                              {parsed.branchCode}
                            </span>
                          </td>

                          {/* Academic Year */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="block text-xs font-medium text-white/85">{parsed.academicYear}</span>
                            <span className="font-mono text-[10px] text-white/35">Class of {parsed.passingYear}</span>
                          </td>

                          {/* Roster */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setInspectingTeam(team)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 font-mono text-xs text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer"
                              title="View full team roster"
                            >
                              <Users className="h-3.5 w-3.5 text-white/40" />
                              <span>{rosterCount}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              {isSubmitted && (
                                <CheckInButton
                                  checkedIn={team.checkedIn}
                                  loading={actionLoadingId === team.id}
                                  checkedLabel="Checked In"
                                  onClick={() => handleToggleCheckIn(team)}
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => setInspectingTeam(team)}
                                className="h-8 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-white/75 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white cursor-pointer"
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
              <EmptyRoster
                message={
                  statusFilter === "submitted" && submittedCount === 0
                    ? "No submitted teams yet"
                    : statusFilter === "forming"
                      ? "No forming teams"
                      : searchQuery
                        ? `No teams match "${searchQuery}"`
                        : "No teams match this filter"
                }
              >
                {statusFilter === "submitted" && formingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDomain("registration");
                      setStatusFilter("forming");
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    View Forming Teams ({formingCount})
                  </button>
                )}
                {teams.length === 0 && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="rounded-lg text-xs font-[family-name:var(--font-google-sans)]"
                    onClick={() => setShowAddTeamModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Register Walk-In Team
                  </Button>
                )}
              </EmptyRoster>
            )}
          </section>

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
                        const formatted = formatCheckInDateTime(inspectingTeam.checkedInAt || inspectingTeam.lead?.checkedInAt);
                        return (
                          <div className="flex flex-col items-start gap-1">
                            <span className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                              Verified Check-In ({rosterTotal}/{rosterTotal} Pax)
                            </span>
                            {formatted && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400/90">
                                <Clock className="h-3 w-3 opacity-70" />
                                <span>Checked In: {formatted.dateStr}, {formatted.timeStr}</span>
                              </span>
                            )}
                          </div>
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
                        const formatted = formatCheckInDateTime(inspectingTeam.lead?.checkedInAt || (leadChecked ? inspectingTeam.checkedInAt : null));
                        return leadChecked ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Present</span>
                            </span>
                            {formatted && (
                              <div className="text-emerald-400/80 text-[10px] font-mono flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 opacity-70" />
                                <span>{formatted.dateStr}, {formatted.timeStr}</span>
                              </div>
                            )}
                          </div>
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
                              const formatted = formatCheckInDateTime(member.checkedInAt || (memChecked ? inspectingTeam.checkedInAt : null));
                              return memChecked ? (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                                    <span>Present</span>
                                  </span>
                                  {formatted && (
                                    <span className="text-emerald-400/80 text-[9px] font-mono flex items-center gap-1">
                                      <Clock className="h-2 w-2 opacity-70" />
                                      <span>{formatted.dateStr}, {formatted.timeStr}</span>
                                    </span>
                                  )}
                                </div>
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
                if (!isCheckinActive) {
                  return {
                    success: false,
                    message: "Check-in is currently locked for this event. A Master Admin must enable check-in.",
                  };
                }
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

          {/* ========================================================================= */}
          {/* MODAL 3: CHECK-IN / ATTENDANCE CONFIRMATION MODAL                         */}
          {/* ========================================================================= */}
          {checkInConfirmTarget && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget && !actionLoadingId) {
                  setCheckInConfirmTarget(null);
                }
              }}
            >
              <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#0e0e12] p-6 sm:p-7 shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                  type="button"
                  disabled={Boolean(actionLoadingId)}
                  onClick={() => setCheckInConfirmTarget(null)}
                  className="absolute right-5 top-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header Icon + Title */}
                <div className="flex items-start gap-3.5 mb-5">
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      checkInConfirmTarget.nextCheckIn
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {checkInConfirmTarget.nextCheckIn ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Undo2 className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${
                        checkInConfirmTarget.nextCheckIn
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {checkInConfirmTarget.nextCheckIn ? "Check-In Confirmation" : "Revert Confirmation"}
                    </span>
                    <h3 className="text-lg font-black text-white font-[family-name:var(--font-google-sans)] leading-snug">
                      {checkInConfirmTarget.nextCheckIn
                        ? checkInConfirmTarget.type === "team"
                          ? "Confirm Team Check-In"
                          : "Confirm Participant Check-In"
                        : checkInConfirmTarget.type === "team"
                        ? "Revert Team Check-In"
                        : "Revert Participant Check-In"}
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {checkInConfirmTarget.nextCheckIn
                        ? "Verify and mark official attendance for this session."
                        : "Reset attendance status back to pending."}
                    </p>
                  </div>
                </div>

                {/* Target Details Box */}
                <div className="rounded-2xl border border-white/10 bg-[#16161d] p-4 space-y-3 mb-6">
                  {checkInConfirmTarget.type === "team" && checkInConfirmTarget.team && (
                    <>
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block">
                            Team Name
                          </span>
                          <span className="text-sm font-bold text-white block truncate">
                            {checkInConfirmTarget.team.teamName}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-white/10 text-neutral-300 px-2.5 py-1 rounded-lg border border-white/15 shrink-0">
                          {checkInConfirmTarget.team.teamCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-white/40 block">Team Leader</span>
                          <span className="text-white font-medium truncate block">
                            {checkInConfirmTarget.team.lead?.name || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-white/40 block">Roster Size</span>
                          <span className="text-white font-medium block">
                            {1 + (checkInConfirmTarget.team.members?.length || 0)} Members
                          </span>
                        </div>
                      </div>

                      {checkInConfirmTarget.team.department && (
                        <div className="pt-2 border-t border-white/5 text-[11px] text-white/60 truncate">
                          {checkInConfirmTarget.team.department}
                        </div>
                      )}
                    </>
                  )}

                  {checkInConfirmTarget.type === "participant" && checkInConfirmTarget.participant && (
                    <>
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block">
                            Participant
                          </span>
                          <span className="text-sm font-bold text-white block truncate">
                            {checkInConfirmTarget.participant.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            checkInConfirmTarget.participant.role === "Team Leader"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-white/10 text-white/70 border-white/15"
                          }`}
                        >
                          {checkInConfirmTarget.participant.role}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-white/40 block">Team</span>
                          <span className="text-white font-medium truncate block">
                            {checkInConfirmTarget.participant.teamName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-white/40 block">Team Code</span>
                          <span className="text-white font-mono font-medium block">
                            {checkInConfirmTarget.participant.teamCode}
                          </span>
                        </div>
                      </div>

                      {(checkInConfirmTarget.participant.email || checkInConfirmTarget.participant.roll) && (
                        <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-white/50 truncate">
                          {checkInConfirmTarget.participant.email}
                          {checkInConfirmTarget.participant.roll ? ` • Roll: ${checkInConfirmTarget.participant.roll}` : ""}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={Boolean(actionLoadingId)}
                    onClick={() => setCheckInConfirmTarget(null)}
                    className="rounded-xl border border-white/20 bg-white/[0.08] hover:bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(actionLoadingId)}
                    onClick={async () => {
                      if (checkInConfirmTarget.type === "team" && checkInConfirmTarget.team) {
                        const target = checkInConfirmTarget.team;
                        const nextState = checkInConfirmTarget.nextCheckIn;
                        setCheckInConfirmTarget(null);
                        await executeToggleCheckIn(target, nextState);
                      } else if (checkInConfirmTarget.type === "participant" && checkInConfirmTarget.participant) {
                        const target = checkInConfirmTarget.participant;
                        const nextState = checkInConfirmTarget.nextCheckIn;
                        setCheckInConfirmTarget(null);
                        await executeToggleParticipantCheckIn(target, nextState);
                      }
                    }}
                    className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                      checkInConfirmTarget.nextCheckIn
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                        : "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
                    } ${actionLoadingId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {actionLoadingId ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : checkInConfirmTarget.nextCheckIn ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Confirm Check-In</span>
                      </>
                    ) : (
                      <>
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Confirm Revert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Live Event Hero Helpers
// -------------------------------------------------------------
function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono tabular-nums text-white/70">
      {now.toLocaleTimeString("en-IN", { hour12: false })}
    </span>
  );
}

const METER_TICKS = 40;

function ArrivalMeter({
  rate,
  arrived,
  pending,
  total,
}: {
  rate: number;
  arrived: number;
  pending: number;
  total: number;
}) {
  const lit = Math.round((Math.min(Math.max(rate, 0), 100) / 100) * METER_TICKS);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            Participant Arrival
          </div>
          <div className="mt-1 text-5xl font-semibold leading-none tracking-tight tabular-nums text-white font-[family-name:var(--font-google-sans)]">
            {rate}
            <span className="text-2xl text-white/35">%</span>
          </div>
        </div>
        <div className="space-y-1 text-right font-mono text-[11px] tabular-nums">
          <div className="flex items-center justify-end gap-1.5 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {arrived} in
          </div>
          <div className="flex items-center justify-end gap-1.5 text-amber-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
            {pending} out
          </div>
        </div>
      </div>

      <div className="mt-5 flex h-10 items-end gap-[3px]" role="meter" aria-valuenow={rate} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: METER_TICKS }).map((_, i) => (
          <span
            key={i}
            className={`flex-1 rounded-[2px] transition-colors duration-500 ${
              i === lit - 1
                ? "bg-white shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                : i < lit
                  ? "bg-emerald-400"
                  : "bg-white/[0.07]"
            }`}
            style={{ height: i % 5 === 0 ? "100%" : "62%" }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-white/30">
        <span>0</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

const STAT_TONES = {
  neutral: {
    icon: "border-white/10 bg-white/[0.06] text-white/80",
    bar: "bg-white/70",
    edge: "via-white/25",
  },
  emerald: {
    icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    bar: "bg-emerald-400",
    edge: "via-emerald-400/50",
  },
  amber: {
    icon: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    bar: "bg-amber-400",
    edge: "via-amber-400/50",
  },
  sky: {
    icon: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    bar: "bg-sky-400",
    edge: "via-sky-400/50",
  },
} as const;

function StatTile({
  label,
  value,
  caption,
  progress,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  caption: string;
  progress: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof STAT_TONES;
}) {
  const t = STAT_TONES[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b10] p-4 sm:p-5 shadow-xl transition-colors hover:border-white/20">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${t.edge} to-transparent`} />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${t.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-white font-[family-name:var(--font-google-sans)]">
        {value}
      </div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${t.bar}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      <div className="mt-2 font-mono text-[11px] text-white/45">{caption}</div>
    </div>
  );
}

// -------------------------------------------------------------
// Roster Console Helpers
// -------------------------------------------------------------
type RowTone = "emerald" | "sky" | "amber" | "neutral";

const ROW_ACCENTS: Record<RowTone, string> = {
  emerald: "shadow-[inset_2px_0_0_rgba(52,211,153,0.9)]",
  sky: "shadow-[inset_2px_0_0_rgba(56,189,248,0.9)]",
  amber: "shadow-[inset_2px_0_0_rgba(251,191,36,0.55)]",
  neutral: "shadow-[inset_2px_0_0_rgba(255,255,255,0.1)]",
};

const TONE_PILLS: Record<RowTone, string> = {
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  neutral: "border-white/10 bg-white/[0.04] text-white/45",
};

const TONE_DOTS: Record<RowTone, string> = {
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  neutral: "bg-white/30",
};

function FilterChip({
  label,
  count,
  active,
  dot,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  dot?: "emerald" | "amber";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all cursor-pointer ${
        active ? "bg-white/10 text-white ring-1 ring-white/15" : "text-white/50 hover:text-white"
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOTS[dot]}`} />}
      <span>{label}</span>
      <span className={`font-mono text-[10px] tabular-nums ${active ? "text-white" : "text-white/35"}`}>{count}</span>
    </button>
  );
}

function StatusPill({ tone, label, pulse }: { tone: RowTone; label: string; pulse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${TONE_PILLS[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOTS[tone]} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

function PresenceDots({ present, total, tone }: { present: number; total: number; tone: RowTone }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-[2px] ${i < present ? TONE_DOTS[tone] : "bg-white/10"}`}
        />
      ))}
    </span>
  );
}

function MicroTag({
  tone,
  className = "",
  children,
}: {
  tone: RowTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${TONE_PILLS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function TeamCode({ code, onCopy }: { code: string; onCopy: () => void }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="group/code mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-rose-300/90 transition-colors hover:text-rose-200 cursor-pointer"
      title="Copy Team Code"
    >
      {code}
      <Clipboard className="h-2.5 w-2.5 text-white/25 transition-colors group-hover/code:text-white/70" />
    </button>
  );
}

function CheckInButton({
  checkedIn,
  loading,
  checkedLabel,
  onClick,
}: {
  checkedIn: boolean;
  loading: boolean;
  checkedLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all cursor-pointer disabled:cursor-wait ${
        checkedIn
          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
          : "bg-white text-neutral-950 shadow-sm hover:bg-neutral-200"
      }`}
    >
      {loading ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : checkedIn ? (
        <>
          <Check className="h-3 w-3" />
          <span>{checkedLabel}</span>
        </>
      ) : (
        <span>Check In</span>
      )}
    </button>
  );
}

function EmptyRoster({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Users className="h-5 w-5 text-white/35" />
      </div>
      <p className="font-mono text-xs text-white/45">{message}</p>
      {children && <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}

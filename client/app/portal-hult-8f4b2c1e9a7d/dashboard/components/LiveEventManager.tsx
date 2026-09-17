"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface SchedulePhase {
  id: string;
  time: string;
  title: string;
  location: string;
  status: "completed" | "active" | "upcoming";
}

interface PitchTeam {
  id: string;
  order: number;
  name: string;
  venture: string;
  department: string;
  lead: string;
  membersCount: number;
  status: "completed" | "on_stage" | "on_deck" | "pending";
  juryScoreStatus: string;
}

interface LiveAttendee {
  id: string;
  name: string;
  email: string;
  department: string;
  roll: string;
  checkedIn: boolean;
  checkInTime?: string;
}

export default function LiveEventManager() {
  // -------------------------------------------------------------
  // 1. Stage Timer State
  // -------------------------------------------------------------
  const [timerSeconds, setTimerSeconds] = useState(360); // 6:00 default pitch
  const [timerRunning, setTimerRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<"pitch" | "qa" | "transition">("pitch");
  const [projectorMode, setProjectorMode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSetPreset = (preset: "pitch" | "qa" | "transition") => {
    setActivePreset(preset);
    setTimerRunning(false);
    if (preset === "pitch") setTimerSeconds(360); // 6 min
    if (preset === "qa") setTimerSeconds(240); // 4 min
    if (preset === "transition") setTimerSeconds(120); // 2 min
  };

  const handleAddMinutes = (mins: number) => {
    setTimerSeconds((prev) => prev + mins * 60);
  };

  // -------------------------------------------------------------
  // 2. Schedule Timeline State (Empty - No mock data)
  // -------------------------------------------------------------
  const [phases, setPhases] = useState<SchedulePhase[]>([]);
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [newPhase, setNewPhase] = useState({
    time: "",
    title: "",
    location: "",
    status: "upcoming" as SchedulePhase["status"],
  });

  // Load / sync with localStorage for session persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hult_live_phases");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setPhases(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hult_live_phases", JSON.stringify(phases));
    } catch {
      // ignore
    }
  }, [phases]);

  const handleSetPhaseStatus = (id: string, newStatus: "completed" | "active" | "upcoming") => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id === id) return { ...p, status: newStatus };
        if (newStatus === "active" && p.status === "active") return { ...p, status: "completed" };
        return p;
      })
    );
  };

  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhase.title.trim()) return;
    const created: SchedulePhase = {
      id: "phase_" + Date.now(),
      time: newPhase.time.trim() || "10:00 AM",
      title: newPhase.title.trim(),
      location: newPhase.location.trim() || "Main Auditorium",
      status: newPhase.status,
    };
    setPhases((prev) => [...prev, created]);
    setNewPhase({ time: "", title: "", location: "", status: "upcoming" });
    setShowAddPhaseModal(false);
  };

  const handleDeletePhase = (id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id));
  };

  // -------------------------------------------------------------
  // 3. Pitch Teams State (Empty - No mock data)
  // -------------------------------------------------------------
  const [teams, setTeams] = useState<PitchTeam[]>([]);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    venture: "",
    department: "",
    lead: "",
    membersCount: 4,
    status: "pending" as PitchTeam["status"],
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hult_live_teams");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setTeams(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hult_live_teams", JSON.stringify(teams));
    } catch {
      // ignore
    }
  }, [teams]);

  const [teamFilter, setTeamFilter] = useState<"all" | "pending" | "completed">("all");

  const currentOnStageTeam =
    teams.find((t) => t.status === "on_stage") || (teams.length > 0 ? teams[0] : undefined);
  const nextOnDeckTeam = teams.find((t) => t.status === "on_deck");

  // Advance queue: move On Deck to On Stage, mark previous as Completed
  const handleAdvanceTeamQueue = () => {
    if (teams.length === 0) return;
    setTeams((prev) => {
      const stageIndex = prev.findIndex((t) => t.status === "on_stage");
      const deckIndex = prev.findIndex((t) => t.status === "on_deck");

      if (stageIndex === -1 && deckIndex === -1 && prev.length > 0) {
        return prev.map((t, idx) => {
          if (idx === 0) return { ...t, status: "on_stage", juryScoreStatus: "In Progress" };
          if (idx === 1) return { ...t, status: "on_deck" };
          return t;
        });
      }

      return prev.map((t, idx) => {
        if (idx === stageIndex) return { ...t, status: "completed", juryScoreStatus: "5/5 Submitted" };
        if (idx === deckIndex) return { ...t, status: "on_stage", juryScoreStatus: "In Progress" };
        if (idx === deckIndex + 1 && t.status === "pending") return { ...t, status: "on_deck" };
        return t;
      });
    });
    handleSetPreset("pitch");
  };

  const handleSetTeamStatus = (id: string, newStatus: PitchTeam["status"]) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === id) return { ...t, status: newStatus };
        if (newStatus === "on_stage" && t.status === "on_stage") return { ...t, status: "completed" };
        return t;
      })
    );
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;
    const created: PitchTeam = {
      id: "team_" + Date.now(),
      order: teams.length + 1,
      name: newTeam.name.trim(),
      venture: newTeam.venture.trim() || "Social Venture",
      department: newTeam.department.trim() || "Department of Technology",
      lead: newTeam.lead.trim() || "Team Lead",
      membersCount: Number(newTeam.membersCount) || 4,
      status: newTeam.status,
      juryScoreStatus: newTeam.status === "completed" ? "5/5 Submitted" : "Pending Pitch",
    };
    setTeams((prev) => [...prev, created]);
    setNewTeam({
      name: "",
      venture: "",
      department: "",
      lead: "",
      membersCount: 4,
      status: "pending",
    });
    setShowAddTeamModal(false);
  };

  const handleDeleteTeam = (id: string) => {
    setTeams((prev) =>
      prev.filter((t) => t.id !== id).map((t, idx) => ({ ...t, order: idx + 1 }))
    );
  };

  // -------------------------------------------------------------
  // 4. Live Check-in & Attendees State (Empty - No mock data)
  // -------------------------------------------------------------
  const [attendees, setAttendees] = useState<LiveAttendee[]>([]);
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [newAttendee, setNewAttendee] = useState({
    name: "",
    email: "",
    department: "",
    roll: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hult_live_attendees");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setAttendees(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hult_live_attendees", JSON.stringify(attendees));
    } catch {
      // ignore
    }
  }, [attendees]);

  // -------------------------------------------------------------
  // Cloud Database Synchronization Engine (/api/admin/live)
  // -------------------------------------------------------------
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSyncedAt, setCloudSyncedAt] = useState<Date | null>(null);
  const initialCloudLoadDone = useRef(false);

  // 1. Initial Cloud Fetch & Hydration
  const loadCloudState = useCallback(async () => {
    setCloudSyncing(true);
    try {
      const res = await fetch("/api/admin/live");
      if (res.ok) {
        const data = await res.json();
        if (data?.liveState) {
          const ls = data.liveState;
          if (Array.isArray(ls.phases) && ls.phases.length > 0) {
            setPhases(ls.phases);
          }
          if (Array.isArray(ls.teams) && ls.teams.length > 0) {
            setTeams(ls.teams);
          }
          if (Array.isArray(ls.attendees) && ls.attendees.length > 0) {
            setAttendees(ls.attendees);
          }
          if (ls.timerSeconds !== undefined && ls.timerSeconds > 0) {
            setTimerSeconds(ls.timerSeconds);
          }
          if (ls.activePreset) {
            setActivePreset(ls.activePreset);
          }
          setCloudSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.warn("Notice: Initial live event cloud sync failed, using local copy:", err);
    } finally {
      initialCloudLoadDone.current = true;
      setCloudSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadCloudState();
  }, [loadCloudState]);

  // 2. Debounced push to MongoDB cloud
  useEffect(() => {
    if (!initialCloudLoadDone.current) return;

    const timer = setTimeout(async () => {
      try {
        setCloudSyncing(true);
        await fetch("/api/admin/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phases,
            teams,
            attendees,
            timerSeconds,
            timerRunning,
            activePreset,
          }),
        });
        setCloudSyncedAt(new Date());
      } catch (err) {
        console.error("Auto cloud sync error:", err);
      } finally {
        setCloudSyncing(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [phases, teams, attendees, timerSeconds, timerRunning, activePreset]);

  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [fastCheckInInput, setFastCheckInInput] = useState("");

  const totalAttendees = attendees.length;
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const checkInRate = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  const handleToggleCheckIn = (id: string) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setAttendees((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextState = !a.checkedIn;
          return {
            ...a,
            checkedIn: nextState,
            checkInTime: nextState ? now : undefined,
          };
        }
        return a;
      })
    );
  };

  const handleFastCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const q = fastCheckInInput.trim().toLowerCase();
    if (!q) return;

    const found = attendees.find(
      (a) =>
        a.roll.toLowerCase() === q ||
        a.email.toLowerCase() === q ||
        a.name.toLowerCase().includes(q)
    );

    if (found) {
      handleToggleCheckIn(found.id);
      setFastCheckInInput("");
    } else {
      alert(`Attendee "${fastCheckInInput}" not found in current attendee records.`);
    }
  };

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendee.name.trim() || !newAttendee.roll.trim()) return;
    const created: LiveAttendee = {
      id: "att_" + Date.now(),
      name: newAttendee.name.trim(),
      email: newAttendee.email.trim() || `${newAttendee.roll.trim()}@heritageit.edu.in`,
      department: newAttendee.department.trim() || "Engineering",
      roll: newAttendee.roll.trim(),
      checkedIn: false,
    };
    setAttendees((prev) => [created, ...prev]);
    setNewAttendee({ name: "", email: "", department: "", roll: "" });
    setShowAddAttendeeModal(false);
  };

  const handleDeleteAttendee = (id: string) => {
    setAttendees((prev) => prev.filter((a) => a.id !== id));
  };

  // -------------------------------------------------------------
  // 5. Broadcast Announcement State (Empty by default)
  // -------------------------------------------------------------
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<"info" | "notice" | "urgent">("notice");
  const [activeBanner, setActiveBanner] = useState<{
    text: string;
    priority: "info" | "notice" | "urgent";
    timestamp: string;
  } | null>(null);

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setActiveBanner({
      text: broadcastMessage.trim(),
      priority: broadcastPriority,
      timestamp: now,
    });
    setBroadcastMessage("");
  };

  // -------------------------------------------------------------
  // 6. Navigation Tabs inside Live Console
  // -------------------------------------------------------------
  const [activeViewTab, setActiveViewTab] = useState<"command" | "schedule" | "teams" | "checkin">("command");

  return (
    <div className="space-y-8 animate-fadeIn font-sans pb-16">
      {/* Live Broadcast Banner (Top of page) */}
      {activeBanner && (
        <div
          className={`relative overflow-hidden rounded-2xl p-4 backdrop-blur-2xl border flex items-center justify-between gap-4 animate-fadeIn shadow-2xl ${
            activeBanner.priority === "urgent"
              ? "bg-red-950/60 border-red-500/50 text-red-200"
              : activeBanner.priority === "notice"
              ? "bg-amber-950/60 border-amber-500/50 text-amber-200"
              : "bg-sky-950/60 border-sky-500/50 text-sky-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeBanner.priority === "urgent"
                    ? "bg-red-400"
                    : activeBanner.priority === "notice"
                    ? "bg-amber-400"
                    : "bg-sky-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  activeBanner.priority === "urgent"
                    ? "bg-red-500"
                    : activeBanner.priority === "notice"
                    ? "bg-amber-500"
                    : "bg-sky-500"
                }`}
              />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full">
                  Live Stage Broadcast • {activeBanner.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">{activeBanner.text}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveBanner(null)}
            className="text-white/60 hover:text-white text-xs cursor-pointer p-1"
            title="Dismiss Announcement"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header & Stage Status */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Stage Command Center
            </span>
            <span className="text-xs text-white/50">•</span>
            <span className="text-xs text-white/70 font-mono">Stage A • Main Auditorium</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
            Live Event Management
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            Real-time pitch countdown, queue advancement, attendee check-in desk, and control room dispatch.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadCloudState}
            disabled={cloudSyncing}
            className="rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-3.5 py-2.5 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Reload from MongoDB database"
          >
            <span className={cloudSyncing ? "animate-spin" : ""}>🔄</span>
            <span>{cloudSyncing ? "Syncing..." : "Sync Cloud"}</span>
          </button>
          {cloudSyncedAt && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DB Connected</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setProjectorMode(true)}
            className="rounded-2xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2.5 text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Stage Projector View</span>
          </button>
          <button
            type="button"
            onClick={handleAdvanceTeamQueue}
            disabled={teams.length === 0}
            className="rounded-2xl bg-[#f20089] hover:bg-[#d8007a] disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f20089]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer font-[family-name:var(--font-google-sans)] flex items-center gap-2"
          >
            <span>Advance Next Team →</span>
          </button>
        </div>
      </div>

      {/* Primary Console Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveViewTab("command")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
            activeViewTab === "command"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Stage Command & Timer
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab("teams")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
            activeViewTab === "teams"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Pitch Teams Queue ({teams.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab("checkin")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
            activeViewTab === "checkin"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Attendance Desk ({checkedInCount}/{totalAttendees})
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab("schedule")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap font-[family-name:var(--font-google-sans)] ${
            activeViewTab === "schedule"
              ? "bg-white text-black shadow-md"
              : "bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Run of Show Schedule ({phases.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: STAGE COMMAND & TIMER                                             */}
      {/* ========================================================================= */}
      {activeViewTab === "command" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Row: Timer Widget + Current Team On Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Stage Timer Box (lg:col-span-6) */}
            <div className="lg:col-span-6 relative rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-[#f20089]/15 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f20089] bg-[#f20089]/15 border border-[#f20089]/30 px-2.5 py-0.5 rounded-full">
                      Stage Clock
                    </span>
                    <span className="text-xs text-white/50">•</span>
                    <span className="text-xs text-white/70 font-semibold">
                      {activePreset === "pitch"
                        ? "6-Minute Pitch"
                        : activePreset === "qa"
                        ? "4-Minute Jury Q&A"
                        : "2-Minute Transition"}
                    </span>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      timerRunning ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
                    }`}
                  />
                </div>

                {/* Big Digital Digits */}
                <div className="text-center py-4 sm:py-6">
                  <div
                    className={`font-mono text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight transition-colors ${
                      timerSeconds === 0
                        ? "text-red-500 animate-pulse"
                        : timerSeconds <= 60
                        ? "text-amber-400 animate-pulse"
                        : "text-white"
                    }`}
                  >
                    {formatTimer(timerSeconds)}
                  </div>
                  <p className="text-xs text-white/50 mt-1 uppercase tracking-widest font-mono">
                    {timerSeconds === 0
                      ? "Time Expired • Ring Chime"
                      : timerRunning
                      ? "Clock Ticking"
                      : "Clock Paused"}
                  </p>
                </div>

                {/* Preset Switcher Pills */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => handleSetPreset("pitch")}
                    className={`rounded-2xl p-2.5 text-center transition-all cursor-pointer border ${
                      activePreset === "pitch"
                        ? "bg-[#f20089]/20 border-[#f20089] text-white"
                        : "bg-white/[0.04] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold tracking-wider">Pitch</span>
                    <span className="font-mono text-sm font-bold">06:00</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPreset("qa")}
                    className={`rounded-2xl p-2.5 text-center transition-all cursor-pointer border ${
                      activePreset === "qa"
                        ? "bg-[#f20089]/20 border-[#f20089] text-white"
                        : "bg-white/[0.04] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold tracking-wider">Q&A</span>
                    <span className="font-mono text-sm font-bold">04:00</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPreset("transition")}
                    className={`rounded-2xl p-2.5 text-center transition-all cursor-pointer border ${
                      activePreset === "transition"
                        ? "bg-[#f20089]/20 border-[#f20089] text-white"
                        : "bg-white/[0.04] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold tracking-wider">Reset</span>
                    <span className="font-mono text-sm font-bold">02:00</span>
                  </button>
                </div>
              </div>

              {/* Timer Control Buttons */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className={`rounded-2xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                      timerRunning
                        ? "bg-amber-500 hover:bg-amber-400 text-black"
                        : "bg-emerald-500 hover:bg-emerald-400 text-black"
                    }`}
                  >
                    {timerRunning ? "Pause" : "Start Timer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPreset(activePreset)}
                    className="rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/15 px-3.5 py-2 text-xs font-semibold text-white/80 transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddMinutes(1)}
                    className="rounded-xl bg-white/[0.06] hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all cursor-pointer"
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMinutes(2)}
                    className="rounded-xl bg-white/[0.06] hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all cursor-pointer"
                  >
                    +2m
                  </button>
                </div>
              </div>
            </div>

            {/* Current Team On Stage (lg:col-span-6) */}
            <div className="lg:col-span-6 relative rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

              {currentOnStageTeam ? (
                <>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Now Presenting On Stage
                      </span>
                      <span className="text-xs text-white/50 font-mono">
                        Team #{currentOnStageTeam.order}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white font-[family-name:var(--font-google-sans)]">
                        {currentOnStageTeam.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 font-medium mt-1 leading-relaxed">
                        "{currentOnStageTeam.venture}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block mb-0.5">
                          Team Lead
                        </span>
                        <span className="text-xs font-bold text-white">{currentOnStageTeam.lead}</span>
                        <span className="text-[10px] text-white/50 block">
                          {currentOnStageTeam.membersCount} Members Total
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                        <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block mb-0.5">
                          Department
                        </span>
                        <span className="text-xs font-semibold text-white/90 truncate block">
                          {currentOnStageTeam.department}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono block">Class of 2028</span>
                      </div>
                    </div>

                    {/* On Deck Next Preview */}
                    {nextOnDeckTeam && (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-3.5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 block">
                            Next Up • On Deck
                          </span>
                          <span className="text-xs font-bold text-white">{nextOnDeckTeam.name}</span>
                          <span className="text-[11px] text-white/60 block truncate max-w-xs">
                            {nextOnDeckTeam.venture}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-2 py-1 rounded-xl shrink-0">
                          Team #{nextOnDeckTeam.order}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <span className="text-xs text-white/60 font-mono">
                      Jury Status:{" "}
                      <strong className="text-emerald-300">{currentOnStageTeam.juryScoreStatus}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleAdvanceTeamQueue}
                      className="rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/20 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Mark Complete & Advance
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative z-10 my-auto py-12 text-center">
                  <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                    Stage Currently Idle
                  </h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 mb-4">
                    No team is currently presenting on stage. Add teams to the pitch queue to begin live presentations.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewTab("teams");
                      setShowAddTeamModal(true);
                    }}
                    className="rounded-xl bg-[#f20089] hover:bg-[#d8007a] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>+ Add First Pitch Team</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Dispatch: Broadcast Alert Form */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)]">
                  Live Stage & Control Room Dispatch
                </h4>
                <p className="text-xs text-white/60">
                  Broadcast live text announcements across venue screens and coordinator devices.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {(["info", "notice", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBroadcastPriority(p)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold uppercase transition-all cursor-pointer ${
                      broadcastPriority === p
                        ? p === "urgent"
                          ? "bg-red-500 text-white"
                          : p === "notice"
                          ? "bg-amber-500 text-black"
                          : "bg-sky-500 text-white"
                        : "bg-white/[0.05] text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handlePublishBroadcast} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type emergency announcement or stage notice (e.g. Next 3 teams please assemble at Stage Left)..."
                className="flex-1 rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 outline-none backdrop-blur-xl focus:border-[#f20089]"
              />
              <button
                type="submit"
                className="rounded-2xl bg-white hover:bg-neutral-200 text-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 font-[family-name:var(--font-google-sans)]"
              >
                Broadcast Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PITCH TEAMS QUEUE                                                 */}
      {/* ========================================================================= */}
      {activeViewTab === "teams" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Participating Pitch Teams Roster ({teams.length})
              </h3>
              <p className="text-xs text-white/60">
                Track pitching progress, manage active stage assignments, and audit judge scorecards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                {(["all", "pending", "completed"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTeamFilter(filter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase transition-all cursor-pointer ${
                      teamFilter === filter
                        ? "bg-[#f20089] text-white shadow-md"
                        : "bg-white/[0.05] text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddTeamModal(true)}
                className="rounded-xl bg-white text-black hover:bg-white/90 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md whitespace-nowrap"
              >
                <span>+ Add Team</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/15 bg-white/[0.03] backdrop-blur-2xl shadow-xl">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/60 font-[family-name:var(--font-google-sans)]">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Team & Venture Title</th>
                  <th className="px-5 py-4">Lead & Members</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Stage Status</th>
                  <th className="px-5 py-4">Jury Score</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {teams
                  .filter((t) => {
                    if (teamFilter === "pending") return t.status === "pending" || t.status === "on_deck";
                    if (teamFilter === "completed") return t.status === "completed";
                    return true;
                  })
                  .map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        t.status === "on_stage" ? "bg-[#f20089]/10" : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-white/80">{t.order}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-white block text-sm">{t.name}</span>
                        <span className="text-[11px] text-white/60 block line-clamp-1">{t.venture}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-white block">{t.lead}</span>
                        <span className="text-[10px] text-white/50">{t.membersCount} Team Members</span>
                      </td>
                      <td className="px-5 py-4 text-white/80">{t.department}</td>
                      <td className="px-5 py-4">
                        {t.status === "on_stage" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            On Stage
                          </span>
                        ) : t.status === "on_deck" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                            On Deck
                          </span>
                        ) : t.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white/70">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase text-white/40">
                            In Queue
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-white/90">{t.juryScoreStatus}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status !== "on_stage" && (
                            <button
                              type="button"
                              onClick={() => handleSetTeamStatus(t.id, "on_stage")}
                              className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-[#f20089]/30 hover:border-[#f20089]/50 px-2.5 py-1 text-[11px] font-bold text-white transition-all cursor-pointer"
                            >
                              Set On Stage
                            </button>
                          )}
                          {t.status !== "completed" && (
                            <button
                              type="button"
                              onClick={() => handleSetTeamStatus(t.id, "completed")}
                              className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-emerald-500/30 hover:border-emerald-500/50 px-2.5 py-1 text-[11px] font-bold text-white transition-all cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(t.id)}
                            className="text-white/40 hover:text-red-400 p-1 text-xs cursor-pointer transition-colors"
                            title="Remove Team"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {teams.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-white/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-white/80">No pitch teams in roster</span>
                        <span className="text-xs text-white/40">
                          Click "+ Add Team" to register competing ventures for the live pitch round.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ATTENDANCE & CHECK-IN DESK                                       */}
      {/* ========================================================================= */}
      {activeViewTab === "checkin" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-2xl shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
                Total Registered
              </span>
              <div className="text-3xl font-black text-white mt-1 font-[family-name:var(--font-google-sans)]">
                {totalAttendees}
              </div>
              <span className="text-[11px] text-white/40">Verified student roster</span>
            </div>

            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5 backdrop-blur-2xl shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                Checked In Venue
              </span>
              <div className="text-3xl font-black text-emerald-300 mt-1 font-[family-name:var(--font-google-sans)]">
                {checkedInCount}
              </div>
              <span className="text-[11px] text-emerald-400/70">{checkInRate}% Attendance Turnout</span>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-2xl shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                Pending Arrival
              </span>
              <div className="text-3xl font-black text-amber-300 mt-1 font-[family-name:var(--font-google-sans)]">
                {Math.max(0, totalAttendees - checkedInCount)}
              </div>
              <span className="text-[11px] text-white/40">Not yet verified at desk</span>
            </div>
          </div>

          {/* Quick Check-In Bar */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white font-[family-name:var(--font-google-sans)]">
                  Fast Check-In Scanner
                </h4>
                <p className="text-xs text-white/60">
                  Search by college roll number, official email, or student name for instant verification.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <form onSubmit={handleFastCheckIn} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Enter roll or email..."
                    value={fastCheckInInput}
                    onChange={(e) => setFastCheckInInput(e.target.value)}
                    className="rounded-2xl border border-white/15 bg-black/60 px-4 py-2 text-xs text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-[#f20089] w-full sm:w-56 font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer shrink-0"
                  >
                    Verify
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowAddAttendeeModal(true)}
                  className="rounded-2xl bg-white text-black hover:bg-white/90 px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-md"
                >
                  + Add Student
                </button>
              </div>
            </div>

            <div className="pt-2">
              <input
                type="text"
                placeholder="Filter attendees list..."
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white placeholder-white/30 outline-none backdrop-blur-xl focus:border-white/30"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.01]">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/60">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">College Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendees
                    .filter((a) => {
                      const q = attendeeSearch.toLowerCase();
                      return (
                        a.name.toLowerCase().includes(q) ||
                        a.email.toLowerCase().includes(q) ||
                        a.roll.toLowerCase().includes(q) ||
                        a.department.toLowerCase().includes(q)
                      );
                    })
                    .map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-bold text-white">{a.name}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-white/80">{a.roll}</td>
                        <td className="px-4 py-3 text-white/70">{a.department}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-white/60">{a.email}</td>
                        <td className="px-4 py-3">
                          {a.checkedIn ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                              Checked In ({a.checkInTime})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/40">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(a.id)}
                              className={`rounded-xl px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                                a.checkedIn
                                  ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                  : "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30"
                              }`}
                            >
                              {a.checkedIn ? "Undo" : "Check In"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttendee(a.id)}
                              className="text-white/40 hover:text-red-400 p-1 text-xs cursor-pointer transition-colors"
                              title="Delete attendee"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {attendees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-white/50">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-white/80">No attendees registered yet</span>
                          <span className="text-xs text-white/40">
                            Add attendee registrations to verify students at the venue entrance desk.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: RUN OF SHOW SCHEDULE                                             */}
      {/* ========================================================================= */}
      {activeViewTab === "schedule" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Run of Show • Stage Schedule ({phases.length})
              </h3>
              <p className="text-xs text-white/60">
                Real-time timeline progression. Designate active stage milestones or audit completed phases.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPhaseModal(true)}
              className="rounded-xl bg-white text-black hover:bg-white/90 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md whitespace-nowrap"
            >
              <span>+ Add Milestone</span>
            </button>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-2xl shadow-xl divide-y divide-white/5">
            {phases.map((p, idx) => (
              <div
                key={p.id}
                className={`py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  p.status === "active" ? "bg-white/[0.02] -mx-6 px-6" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className={`h-8 w-8 rounded-2xl flex items-center justify-center text-xs font-mono font-bold ${
                        p.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : p.status === "active"
                          ? "bg-[#f20089] text-white shadow-lg shadow-[#f20089]/40"
                          : "bg-white/[0.05] text-white/50 border border-white/10"
                      }`}
                    >
                      {p.status === "completed" ? "✓" : idx + 1}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-[#f20089]">{p.time}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-xs text-white/60">{p.location}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white">{p.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {p.status === "active" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f20089]/20 border border-[#f20089]/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f20089]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f20089] animate-ping" />
                      Live Now
                    </span>
                  )}

                  {p.status !== "active" && (
                    <button
                      type="button"
                      onClick={() => handleSetPhaseStatus(p.id, "active")}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-[#f20089]/30 hover:border-[#f20089]/50 px-3 py-1 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Make Active
                    </button>
                  )}

                  {p.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleSetPhaseStatus(p.id, "completed")}
                      className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-emerald-500/30 hover:border-emerald-500/50 px-3 py-1 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeletePhase(p.id)}
                    className="text-white/40 hover:text-red-400 p-1 text-xs cursor-pointer transition-colors"
                    title="Delete milestone"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {phases.length === 0 && (
              <div className="text-center py-12">
                <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 mx-auto mb-2 flex items-center justify-center text-white/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white/80">No schedule milestones configured</p>
                <p className="text-xs text-white/40 mt-1">
                  Click "+ Add Milestone" to outline the run of show schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS FOR ADDING REAL DATA                                               */}
      {/* ========================================================================= */}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-white/15 bg-neutral-900 p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn font-sans">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Register Pitch Team
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="text-white/50 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solaria Power"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Venture Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Decentralized Solar Micro-Grids"
                  value={newTeam.venture}
                  onChange={(e) => setNewTeam({ ...newTeam, venture: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                    Team Lead Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aditya Sen"
                    value={newTeam.lead}
                    onChange={(e) => setNewTeam({ ...newTeam, lead: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                    Members Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newTeam.membersCount}
                    onChange={(e) => setNewTeam({ ...newTeam, membersCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={newTeam.department}
                  onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Initial Status
                </label>
                <select
                  value={newTeam.status}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, status: e.target.value as PitchTeam["status"] })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                >
                  <option value="pending">In Queue (Pending)</option>
                  <option value="on_deck">On Deck (Next Up)</option>
                  <option value="on_stage">On Stage (Active Now)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#f20089]/30"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddPhaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-white/15 bg-neutral-900 p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn font-sans">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Add Schedule Milestone
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPhaseModal(false)}
                className="text-white/50 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPhase} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Time *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:30 AM"
                  value={newPhase.time}
                  onChange={(e) => setNewPhase({ ...newPhase, time: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Phase Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Round 1 Pitching"
                  value={newPhase.title}
                  onChange={(e) => setNewPhase({ ...newPhase, title: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Location / Hall
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium"
                  value={newPhase.location}
                  onChange={(e) => setNewPhase({ ...newPhase, location: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Status
                </label>
                <select
                  value={newPhase.status}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, status: e.target.value as SchedulePhase["status"] })
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active (Live Now)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPhaseModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#f20089]/30"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Attendee Modal */}
      {showAddAttendeeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-white/15 bg-neutral-900 p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn font-sans">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-google-sans)]">
                Add Student Attendee
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAttendeeModal(false)}
                className="text-white/50 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAttendee} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Debjit Das"
                  value={newAttendee.name}
                  onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  College Roll Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12624001001"
                  value={newAttendee.roll}
                  onChange={(e) => setNewAttendee({ ...newAttendee, roll: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  College Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. student@heritageit.edu.in"
                  value={newAttendee.email}
                  onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical Engineering"
                  value={newAttendee.department}
                  onChange={(e) => setNewAttendee({ ...newAttendee, department: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-white outline-none focus:border-[#f20089]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAttendeeModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f20089] hover:bg-[#d8007a] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#f20089]/30"
                >
                  Add Attendee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN PROJECTOR STAGE DISPLAY OVERLAY                                */}
      {/* ========================================================================= */}
      {projectorMode && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-8 sm:p-14 text-center select-none animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#f20089]">
                Hult Prize HITK • OnCampus Final Pitching
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Stage Presentation Monitor</h2>
            </div>
            <button
              type="button"
              onClick={() => setProjectorMode(false)}
              className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
            >
              Exit Projector View ✕
            </button>
          </div>

          {/* Center Gigantic Countdown Clock */}
          <div className="space-y-4">
            <div
              className={`font-mono text-8xl sm:text-9xl md:text-[14rem] font-black tracking-tight leading-none ${
                timerSeconds === 0
                  ? "text-red-500 animate-pulse"
                  : timerSeconds <= 60
                  ? "text-amber-400 animate-pulse"
                  : "text-white"
              }`}
            >
              {formatTimer(timerSeconds)}
            </div>
            <p className="text-base sm:text-xl font-bold uppercase tracking-widest text-white/50 font-mono">
              {activePreset === "pitch"
                ? "6-Minute Pitch Timer"
                : activePreset === "qa"
                ? "4-Minute Jury Q&A Timer"
                : "2-Minute Transition Timer"}
            </p>
          </div>

          {/* Bottom Presenter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full text-left">
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/20 p-6">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                Currently On Stage
              </span>
              {currentOnStageTeam ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{currentOnStageTeam.name}</h3>
                  <p className="text-xs text-white/70 mt-1 truncate">{currentOnStageTeam.venture}</p>
                </>
              ) : (
                <>
                  <h3 className="text-xl sm:text-2xl font-black text-white/60">Stage Idle</h3>
                  <p className="text-xs text-white/40 mt-1">No team currently presenting</p>
                </>
              )}
            </div>

            {nextOnDeckTeam && (
              <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-6">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-1">
                  Next Up On Deck
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{nextOnDeckTeam.name}</h3>
                <p className="text-xs text-white/70 mt-1 truncate">{nextOnDeckTeam.venture}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import jsQR from "jsqr";
import {
  Camera,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  SwitchCamera,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Undo2,
  Calendar,
  Users,
  Check,
  Pause,
  UserCheck,
  User,
  X,
  Clock,
  Lock,
  Unlock,
} from "lucide-react";
import CheckinMasterSwitch from "@/app/admin/components/CheckinMasterSwitch";
import OnSpotMasterSwitch from "@/app/admin/components/OnSpotMasterSwitch";

interface FlatParticipant {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  name: string;
  email: string;
  role: "Team Leader" | "Member";
  department?: string;
  roll?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  isOnSpot?: boolean;
}

interface TeamMember {
  name: string;
  email?: string;
  department?: string;
  roll?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  isOnSpot?: boolean;
}

interface TeamLead {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  isOnSpot?: boolean;
}

interface RegisteredTeam {
  id: string;
  teamCode: string;
  teamName: string;
  ventureName?: string;
  lead: TeamLead;
  membersCount: number;
  department?: string;
  members: TeamMember[];
  status: "confirmed" | "disqualified";
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: string | Date | null;
  checkedIn: boolean;
  checkedInAt?: string | null;
  isOnSpot?: boolean;
  registeredAt: string | Date;
}

interface EventItem {
  _id: string;
  title: string;
  tag: string;
  date: string;
  venue: string;
  registrationStatus: "open" | "closed" | "extended" | "upcoming";
  registeredTeamsCount: number;
  maxTeams: number;
  checkinEnabled?: boolean;
  onSpotRegistrationEnabled?: boolean;
}

interface SessionScanLog {
  id: string;
  teamCode: string;
  teamName: string;
  leadName?: string;
  participantName?: string;
  participantRole?: string;
  timestamp: string;
  status: "success" | "duplicate" | "error";
  message: string;
  checkedInCount?: number;
  totalMembers?: number;
  allCheckedIn?: boolean;
}

interface ScannerConsoleProps {
  isMasterAdmin?: boolean;
  isLeadOrMaster?: boolean;
}

export default function ScannerConsole({
  isMasterAdmin: propIsMasterAdmin,
  isLeadOrMaster: propIsLeadOrMaster,
}: ScannerConsoleProps = {}) {
  // Admin Clearance
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(propIsMasterAdmin ?? false);
  const [isLeadOrMaster, setIsLeadOrMaster] = useState<boolean>(
    propIsLeadOrMaster ?? propIsMasterAdmin ?? false
  );

  useEffect(() => {
    if (propIsMasterAdmin !== undefined) {
      setIsMasterAdmin(propIsMasterAdmin);
    }
    if (propIsLeadOrMaster !== undefined) {
      setIsLeadOrMaster(propIsLeadOrMaster);
    }
    if (propIsMasterAdmin === undefined || propIsLeadOrMaster === undefined) {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((session) => {
          const role = session?.user?.role;
          if (role === "master_admin") {
            setIsMasterAdmin(true);
            setIsLeadOrMaster(true);
          } else if (role === "lead_admin") {
            setIsLeadOrMaster(true);
          }
        })
        .catch(() => {});
    }
  }, [propIsMasterAdmin, propIsLeadOrMaster]);

  // -------------------------------------------------------------
  // Event & Teams Data State
  // -------------------------------------------------------------
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [teams, setTeams] = useState<RegisteredTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // -------------------------------------------------------------
  // Camera & Scanner State
  // -------------------------------------------------------------
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number } | null>(null);

  // -------------------------------------------------------------
  // Feedback, Scan Pop-Up Modal & Session Logs
  // -------------------------------------------------------------
  const [scanModal, setScanModal] = useState<{
    isOpen: boolean;
    stage: "confirm" | "done" | "duplicate" | "error";
    participant?: FlatParticipant | null;
    rawCode: string;
    isSubmitting?: boolean;
    message?: string;
    teamName?: string;
    teamCode?: string;
    participantName?: string;
    participantRole?: string;
    roll?: string;
    department?: string;
    checkedInAt?: string | null;
    totalMembers?: number;
    checkedInCount?: number;
    allCheckedIn?: boolean;
  } | null>(null);

  const [requireConfirmation, setRequireConfirmation] = useState<boolean>(true);

  const closeScanModal = useCallback(() => {
    setScanModal(null);
    setIsProcessing(false);
  }, []);

  const [lastScanResult, setLastScanResult] = useState<{
    status: "success" | "duplicate" | "error";
    message: string;
    teamCode: string;
    teamName?: string;
    leadName?: string;
    participantName?: string;
    participantRole?: string;
    membersCount?: number;
    checkedInCount?: number;
    totalMembers?: number;
    allCheckedIn?: boolean;
  } | null>(null);

  const scanResultTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissScanResult = useCallback(() => {
    if (scanResultTimerRef.current) {
      clearTimeout(scanResultTimerRef.current);
      scanResultTimerRef.current = null;
    }
    setLastScanResult(null);
    setIsProcessing(false);
  }, []);

  const showScanResult = useCallback(
    (result: {
      status: "success" | "duplicate" | "error";
      message: string;
      teamCode: string;
      teamName?: string;
      leadName?: string;
      participantName?: string;
      participantRole?: string;
      membersCount?: number;
      checkedInCount?: number;
      totalMembers?: number;
      allCheckedIn?: boolean;
    }) => {
      if (scanResultTimerRef.current) {
        clearTimeout(scanResultTimerRef.current);
      }
      setLastScanResult(result);
      scanResultTimerRef.current = setTimeout(() => {
        setLastScanResult(null);
      }, 4500);
    },
    []
  );

  const [sessionLogs, setSessionLogs] = useState<SessionScanLog[]>([]);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "checked_in" | "not_checked_in">("all");
  const [viewMode, setViewMode] = useState<"teams" | "participants">("teams");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [checkInConfirmTarget, setCheckInConfirmTarget] = useState<{
    type: "team" | "participant";
    team?: RegisteredTeam;
    participant?: FlatParticipant;
    nextCheckIn: boolean;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // Audio Synthesis Feedback
  // -------------------------------------------------------------
  const playAudioChime = useCallback(
    (type: "success" | "duplicate" | "error") => {
      if (!soundEnabled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "success") {
          // Ascending crisp dual-chime
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
        } else if (type === "duplicate") {
          // Double buzz warning
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } else {
          // Low error buzz
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.32);
          osc.start();
          osc.stop(ctx.currentTime + 0.32);
        }
      } catch {
        // Audio context muted or unsupported
      }
    },
    [soundEnabled]
  );

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // QR Content Parser
  // -------------------------------------------------------------
  const parseTeamCode = (raw: string): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();

    // 1. Full URL with teamCode param
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const codeParam = url.searchParams.get("teamCode") || url.searchParams.get("code");
        if (codeParam) return codeParam.trim().toUpperCase();
      }
    } catch {}

    // 2. Query string format: teamCode=XYZ
    if (trimmed.includes("teamCode=")) {
      const match = trimmed.match(/teamCode=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1].trim().toUpperCase();
    }

    // 3. JSON format: {"teamCode": "XYZ"}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.teamCode) return String(parsed.teamCode).trim().toUpperCase();
      } catch {}
    }

    // 4. Standard team code
    if (/^[A-Za-z0-9_-]{4,32}$/.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    return trimmed;
  };

  // -------------------------------------------------------------
  // 1. Fetch Events
  // -------------------------------------------------------------
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/admin/events", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const evList: EventItem[] = Array.isArray(data.events) ? data.events : [];
        setEvents(evList);

        // Auto-select event from URL or first active event
        const urlParams = new URLSearchParams(window.location.search);
        const urlEventId = urlParams.get("eventId");
        if (urlEventId && evList.some((e) => e._id === urlEventId)) {
          setSelectedEventId(urlEventId);
        } else if (evList.length > 0) {
          const openEvent = evList.find((e) => e.registrationStatus === "open");
          setSelectedEventId(openEvent ? openEvent._id : evList[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // -------------------------------------------------------------
  // 2. Fetch Teams for Selected Event
  // -------------------------------------------------------------
  const fetchTeams = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setLoadingTeams(true);
    try {
      const res = await fetch(`/api/admin/teams?eventId=${eventId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTeams(Array.isArray(data.teams) ? data.teams : []);
        if (data.event) {
          setEvents((prev) =>
            prev.map((e) =>
              e._id === eventId
                ? { ...e, checkinEnabled: Boolean(data.event.checkinEnabled) }
                : e
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchTeams(selectedEventId);
      // Sync URL
      const url = new URL(window.location.href);
      url.searchParams.set("eventId", selectedEventId);
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedEventId, fetchTeams]);

  // Window focus auto-sync
  useEffect(() => {
    const handleFocus = () => {
      if (selectedEventId) {
        fetchTeams(selectedEventId);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedEventId, fetchTeams]);

  const selectedEvent = useMemo(
    () => events.find((e) => e._id === selectedEventId) || null,
    [events, selectedEventId]
  );
  const isCheckinActive = Boolean(selectedEvent?.checkinEnabled);
  const isOnSpotActive = Boolean(selectedEvent?.onSpotRegistrationEnabled);

  const handleToggleCheckin = (newState: boolean) => {
    setEvents((prev) =>
      prev.map((e) => (e._id === selectedEventId ? { ...e, checkinEnabled: newState } : e))
    );
    triggerToast(
      newState
        ? "Check-in is now ACTIVE for this event."
        : "Check-in has been LOCKED for this event."
    );
  };

  const handleToggleOnSpot = (newState: boolean) => {
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
    triggerToast(
      newState
        ? "On-Spot Registration is now LIVE on website."
        : "On-Spot Registration has been CLOSED. Registrations are now closed."
    );
  };

  // -------------------------------------------------------------
  // 3. Team Submission & Participant Lookup Helpers
  // -------------------------------------------------------------
  const isTeamSubmitted = useCallback((t: RegisteredTeam) => {
    return t.submissionStatus === "submitted" || Boolean(t.submittedAt);
  }, []);

  const eligibleTeams = useMemo(
    () => teams.filter((t) => isTeamSubmitted(t)),
    [teams, isTeamSubmitted]
  );

  const allFlattenedParticipants = useMemo<FlatParticipant[]>(() => {
    const list: FlatParticipant[] = [];
    for (const t of eligibleTeams) {
      const isLeadChecked = Boolean(t.lead?.checkedIn || (t.checkedIn && t.lead?.checkedIn !== false));
      const leadCheckedInAt = t.lead?.checkedInAt || (isLeadChecked ? t.checkedInAt : null);

      list.push({
        id: `${t.id}_lead`,
        teamId: t.id,
        teamName: t.teamName,
        teamCode: t.teamCode,
        name: t.lead.name,
        email: t.lead.email,
        role: "Team Leader",
        department: t.lead.department || t.department || "General",
        roll: t.lead.roll || "",
        checkedIn: isLeadChecked,
        checkedInAt: leadCheckedInAt,
        isOnSpot: Boolean(t.isOnSpot || t.lead?.isOnSpot),
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
            role: "Member",
            department: m.department || t.department || "General",
            roll: m.roll || "",
            checkedIn: isMemChecked,
            checkedInAt: memCheckedInAt,
            isOnSpot: Boolean(t.isOnSpot || m.isOnSpot),
          });
        });
      }
    }
    return list;
  }, [eligibleTeams]);

  // -------------------------------------------------------------
  // 4. Submit Check-in Execution
  // -------------------------------------------------------------
  const submitCheckIn = useCallback(
    async (code: string, participant?: FlatParticipant | null) => {
      setScanModal((prev) => (prev ? { ...prev, isSubmitting: true } : null));

      try {
        const res = await fetch("/api/admin/teams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "scan_check_in",
            payload: code,
            eventId: selectedEventId,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const isDup = Boolean(data.duplicate);
          playAudioChime(isDup ? "duplicate" : "success");

          const teamCode = data.team?.teamCode || participant?.teamCode || code;
          const teamName = data.team?.teamName || participant?.teamName || "Team";
          const participantName = data.participant?.name || participant?.name || "Participant";
          const participantRole = data.participant?.role || participant?.role || "Member";
          const checkedInCount = data.checkedInCount ?? 1;
          const totalMembers = data.totalMembers ?? (data.team ? 1 + (data.team.members?.length || 0) : 4);
          const allCheckedIn = Boolean(data.allCheckedIn);

          if (data.team) {
            setTeams((prev) =>
              prev.map((t) => (t.id === data.team.id || t.teamCode === data.team.teamCode ? data.team : t))
            );
          }

          const logEntry: SessionScanLog = {
            id: `${code}_${Date.now()}`,
            teamCode,
            teamName,
            leadName: data.team?.lead?.name,
            participantName,
            participantRole,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: isDup ? "duplicate" : "success",
            message: data.message || (isDup ? "Already checked in" : "Verified & Checked In"),
            checkedInCount,
            totalMembers,
            allCheckedIn,
          };

          setSessionLogs((prev) => [logEntry, ...prev.slice(0, 49)]);

          setScanModal({
            isOpen: true,
            stage: isDup ? "duplicate" : "done",
            isSubmitting: false,
            participant: participant || null,
            rawCode: code,
            teamName,
            teamCode,
            participantName,
            participantRole,
            roll: participant?.roll || data.participant?.roll || "",
            department: participant?.department || data.participant?.department || "",
            checkedInAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            checkedInCount,
            totalMembers,
            allCheckedIn,
            message: data.message || (isDup ? "Pass already verified." : "Registration confirmed • Check-in is done!"),
          });
        } else {
          playAudioChime("error");
          const errorMsg = data.error || `Verification failed (${code})`;

          const logEntry: SessionScanLog = {
            id: `${code}_${Date.now()}`,
            teamCode: participant?.teamCode || code,
            teamName: participant?.teamName || "Verification Blocked",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: "error",
            message: errorMsg,
          };

          setSessionLogs((prev) => [logEntry, ...prev.slice(0, 49)]);

          setScanModal({
            isOpen: true,
            stage: "error",
            isSubmitting: false,
            rawCode: code,
            message: errorMsg,
            teamCode: participant?.teamCode || code,
            teamName: participant?.teamName,
            participantName: participant?.name,
          });
        }
      } catch (err: unknown) {
        playAudioChime("error");
        const errMsg = err instanceof Error ? err.message : "Network error processing check-in.";
        setScanModal({
          isOpen: true,
          stage: "error",
          isSubmitting: false,
          rawCode: code,
          message: errMsg,
        });
      }
    },
    [selectedEventId, playAudioChime]
  );

  // -------------------------------------------------------------
  // 5. Process Check-in Submission (Handles Participant QR & Team QR)
  // -------------------------------------------------------------
  const handleCheckInCode = useCallback(
    async (rawCode: string) => {
      const code = String(rawCode || "").trim();
      if (!code) return;

      if (!isCheckinActive) {
        playAudioChime("error");
        setScanModal({
          isOpen: true,
          stage: "error",
          rawCode: code,
          message: "Check-in is currently locked for this event. A Master Admin must activate check-in before attendance can be recorded.",
        });
        setIsProcessing(true);
        return;
      }

      // If modal is already open, do not re-trigger another scan
      if (scanModal?.isOpen) {
        return;
      }

      // Prevent duplicate scan of the same exact code within 2.5 seconds
      const now = Date.now();
      if (
        lastScannedCodeRef.current &&
        lastScannedCodeRef.current.code === code &&
        now - lastScannedCodeRef.current.time < 2500
      ) {
        return;
      }
      lastScannedCodeRef.current = { code, time: now };

      // Pause continuous scanning while modal or processing is active
      setIsProcessing(true);

      // Parse code components
      let extractedEmail: string | null = null;
      let extractedTeamCode: string | null = null;
      let extractedRoll: string | null = null;

      if (code.startsWith("{") && code.endsWith("}")) {
        try {
          const parsed = JSON.parse(code);
          if (parsed.email) extractedEmail = String(parsed.email).trim().toLowerCase();
          if (parsed.participantEmail) extractedEmail = String(parsed.participantEmail).trim().toLowerCase();
          if (parsed.teamCode) extractedTeamCode = String(parsed.teamCode).trim().toUpperCase();
          if (parsed.roll) extractedRoll = String(parsed.roll).trim();
        } catch {}
      }
      if (!extractedEmail && !extractedTeamCode && (code.startsWith("http://") || code.startsWith("https://"))) {
        try {
          const urlObj = new URL(code);
          extractedEmail = urlObj.searchParams.get("email") || urlObj.searchParams.get("participantEmail");
          extractedTeamCode = urlObj.searchParams.get("teamCode") || urlObj.searchParams.get("code");
          extractedRoll = urlObj.searchParams.get("roll");
          if (extractedEmail) extractedEmail = extractedEmail.trim().toLowerCase();
          if (extractedTeamCode) extractedTeamCode = extractedTeamCode.trim().toUpperCase();
        } catch {}
      }
      if (!extractedEmail && code.includes(":")) {
        const parts = code.split(":");
        parts.forEach((p) => {
          const tp = p.trim();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tp)) extractedEmail = tp.toLowerCase();
          else if (/^[A-Za-z0-9_-]{4,32}$/.test(tp)) extractedTeamCode = tp.toUpperCase();
        });
      }
      if (!extractedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(code)) {
        extractedEmail = code.toLowerCase();
      }
      if (!extractedEmail && !extractedTeamCode && /^[A-Za-z0-9_-]{4,32}$/.test(code)) {
        extractedTeamCode = code.toUpperCase();
      }

      // Prioritized lookup in allFlattenedParticipants
      let match: FlatParticipant | undefined;
      if (extractedEmail) {
        match = allFlattenedParticipants.find(
          (p) => p.email && p.email.toLowerCase() === extractedEmail
        );
      }
      if (!match && extractedRoll) {
        match = allFlattenedParticipants.find(
          (p) => p.roll && p.roll.trim().toLowerCase() === extractedRoll.toLowerCase()
        );
      }
      if (!match && extractedTeamCode) {
        match = allFlattenedParticipants.find(
          (p) => p.teamCode?.toUpperCase() === extractedTeamCode
        );
      }

      if (match) {
        const matchingTeam = eligibleTeams.find(
          (t) => t.id === match.teamId || t.teamCode?.toUpperCase() === match.teamCode?.toUpperCase()
        );
        const totalPax = matchingTeam ? 1 + (matchingTeam.members?.length || 0) : 4;
        const currentCheckedPax = matchingTeam
          ? (matchingTeam.lead?.checkedIn ? 1 : 0) +
            (matchingTeam.members?.filter((m) => m.checkedIn).length || 0)
          : 0;

        if (match.checkedIn) {
          // Already Checked In (Duplicate Pass)
          playAudioChime("duplicate");
          const logEntry: SessionScanLog = {
            id: `${code}_${Date.now()}`,
            teamCode: match.teamCode,
            teamName: match.teamName,
            participantName: match.name,
            participantRole: match.role,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: "duplicate",
            message: `Already checked in (${match.name})`,
            checkedInCount: currentCheckedPax,
            totalMembers: totalPax,
            allCheckedIn: currentCheckedPax >= totalPax,
          };
          setSessionLogs((prev) => [logEntry, ...prev.slice(0, 49)]);

          setScanModal({
            isOpen: true,
            stage: "duplicate",
            participant: match,
            rawCode: code,
            teamName: match.teamName,
            teamCode: match.teamCode,
            participantName: match.name,
            participantRole: match.role,
            roll: match.roll,
            department: match.department,
            checkedInAt: match.checkedInAt || "Earlier today",
            totalMembers: totalPax,
            checkedInCount: currentCheckedPax,
            allCheckedIn: currentCheckedPax >= totalPax,
            message: `Pass for ${match.name} has already been verified and checked in.`,
          });
          return;
        }

        // Fresh Pass: Show Confirmation Pop-Up Modal
        if (requireConfirmation) {
          playAudioChime("duplicate"); // Pleasant alert chime
          setScanModal({
            isOpen: true,
            stage: "confirm",
            participant: match,
            rawCode: code,
            teamName: match.teamName,
            teamCode: match.teamCode,
            participantName: match.name,
            participantRole: match.role,
            roll: match.roll,
            department: match.department,
            totalMembers: totalPax,
            checkedInCount: currentCheckedPax,
            message: "Verify attendee pass credentials and confirm check-in.",
          });
          return;
        } else {
          // Instant direct check-in
          await submitCheckIn(code, match);
          return;
        }
      }

      // If not in local pre-cached list, verify through backend preview
      if (requireConfirmation) {
        try {
          const res = await fetch("/api/admin/teams", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "preview_check_in",
              payload: code,
              eventId: selectedEventId,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            if (data.duplicate) {
              playAudioChime("duplicate");
              setScanModal({
                isOpen: true,
                stage: "duplicate",
                rawCode: code,
                teamName: data.team?.teamName || "Registered Team",
                teamCode: data.team?.teamCode || extractedTeamCode || code,
                participantName: data.participant?.name || "Attendee",
                participantRole: data.participant?.role || "Participant",
                checkedInAt: data.checkedInAt || "Earlier today",
                totalMembers: data.totalMembers,
                checkedInCount: data.checkedInCount,
                allCheckedIn: data.allCheckedIn,
                message: data.message || "Pass already verified.",
              });
              return;
            }

            playAudioChime("duplicate");
            setScanModal({
              isOpen: true,
              stage: "confirm",
              rawCode: code,
              teamName: data.team?.teamName || "Registered Team",
              teamCode: data.team?.teamCode || extractedTeamCode || code,
              participantName: data.participant?.name || "Attendee",
              participantRole: data.participant?.role || "Participant",
              roll: data.participant?.roll || extractedRoll || "",
              department: data.participant?.department || data.team?.department || "General",
              totalMembers: data.totalMembers,
              checkedInCount: data.checkedInCount,
              message: "Verify attendee pass credentials and confirm check-in.",
            });
            return;
          } else {
            playAudioChime("error");
            setScanModal({
              isOpen: true,
              stage: "error",
              rawCode: code,
              message: data.error || `Invalid pass or verification failed (${code})`,
            });
            return;
          }
        } catch {
          await submitCheckIn(code, null);
          return;
        }
      } else {
        await submitCheckIn(code, null);
        return;
      }
    },
    [allFlattenedParticipants, eligibleTeams, isCheckinActive, requireConfirmation, scanModal, playAudioChime, submitCheckIn, selectedEventId]
  );

  // -------------------------------------------------------------
  // 4. Undo Check-In Action
  // -------------------------------------------------------------
  const handleUndoCheckIn = async (teamCode: string) => {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_check_in",
          eventId: selectedEventId,
          teamCode,
          checkedIn: false,
        }),
      });

      if (res.ok) {
        setTeams((prev) =>
          prev.map((t) =>
            t.teamCode.toUpperCase() === teamCode.toUpperCase()
              ? { ...t, checkedIn: false, checkedInAt: null }
              : t
          )
        );
        setSessionLogs((prev) => prev.filter((log) => log.teamCode !== teamCode));
        triggerToast(`Check-in reverted for ${teamCode}`);
      } else {
        triggerToast("Failed to revert check-in.");
      }
    } catch {
      triggerToast("Network error reverting check-in.");
    }
  };

  // -------------------------------------------------------------
  // 5. Toggle Team Check-in Manually from Roster
  // -------------------------------------------------------------
  const handleToggleRosterCheckIn = (team: RegisteredTeam) => {
    if (!team.checkedIn && !isCheckinActive) {
      triggerToast("Check-in is currently locked for this event. A Master Admin must enable check-in.");
      return;
    }
    setCheckInConfirmTarget({
      type: "team",
      team,
      nextCheckIn: !team.checkedIn,
    });
  };

  const executeToggleRosterCheckIn = async (team: RegisteredTeam, targetState?: boolean) => {
    const nextCheckIn = typeof targetState === "boolean" ? targetState : !team.checkedIn;
    if (nextCheckIn && !isCheckinActive) {
      triggerToast("Check-in is currently locked for this event. A Master Admin must enable check-in.");
      return;
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
        setTeams((prev) =>
          prev.map((t) =>
            t.id === team.id
              ? { ...t, checkedIn: nextCheckIn, checkedInAt: nextCheckIn ? new Date().toISOString() : null }
              : t
          )
        );
        triggerToast(
          nextCheckIn
            ? `Checked in: ${team.teamName}`
            : `Unchecked: ${team.teamName}`
        );
      }
    } catch {
      triggerToast("Error updating check-in status.");
    }
  };

  // -------------------------------------------------------------
  // 5b. Toggle Individual Participant Check-in
  // -------------------------------------------------------------
  const handleToggleParticipantCheckIn = (p: FlatParticipant) => {
    if (!p.checkedIn && !isCheckinActive) {
      triggerToast("Check-in is currently locked for this event. A Master Admin must enable check-in.");
      return;
    }
    setCheckInConfirmTarget({
      type: "participant",
      participant: p,
      nextCheckIn: !p.checkedIn,
    });
  };

  const executeToggleParticipantCheckIn = async (p: FlatParticipant, targetState?: boolean) => {
    const nextCheckIn = typeof targetState === "boolean" ? targetState : !p.checkedIn;
    if (nextCheckIn && !isCheckinActive) {
      triggerToast("Check-in is currently locked for this event. A Master Admin must enable check-in.");
      return;
    }
    setActionLoadingId(p.id);

    // Optimistic update
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== p.teamId && t.teamCode.toUpperCase() !== p.teamCode.toUpperCase()) {
          return t;
        }
        const nowIso = new Date().toISOString();
        const isLead = p.role === "Team Leader";
        const updatedLead = isLead
          ? { ...t.lead, checkedIn: nextCheckIn, checkedInAt: nextCheckIn ? nowIso : null }
          : t.lead;

        const updatedMembers = (t.members || []).map((m) => {
          if (
            !isLead &&
            ((p.email && m.email?.toLowerCase() === p.email.toLowerCase()) ||
              (p.roll && m.roll?.toLowerCase() === p.roll.toLowerCase()) ||
              m.name.toLowerCase() === p.name.toLowerCase())
          ) {
            return { ...m, checkedIn: nextCheckIn, checkedInAt: nextCheckIn ? nowIso : null };
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
        if (data.team) {
          setTeams((prev) =>
            prev.map((t) => (t.id === data.team.id || t.teamCode === data.team.teamCode ? data.team : t))
          );
        }
        triggerToast(
          nextCheckIn
            ? `${p.name} marked Present.`
            : `Reverted check-in for ${p.name}.`
        );
      } else {
        fetchTeams(selectedEventId);
        triggerToast(data.error || "Failed to update participant check-in.");
      }
    } catch {
      fetchTeams(selectedEventId);
      triggerToast("Network error updating participant.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -------------------------------------------------------------
  // 6. Camera Lifecycle & Frame Scanner
  // -------------------------------------------------------------
  const startCamera = useCallback(
    async (overrideFacing?: "environment" | "user") => {
      const facing = overrideFacing || cameraFacing;
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported on this browser.");
        return;
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          // Brief pause to allow the hardware camera sensor pipeline to release cleanly
          await new Promise((r) => setTimeout(r, 60));
        }

        let mediaStream: MediaStream | null = null;

        // Strategy 0: If camera permissions were already granted previously, inspect device labels
        // to directly target the designated hardware camera sensor.
        if (navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            if (videoInputs.length > 0 && videoInputs[0].label) {
              let matchedDevice: MediaDeviceInfo | undefined;
              if (facing === "environment") {
                matchedDevice =
                  videoInputs.find((d) =>
                    /back|rear|environment|facing\s*back|camera2\s*0|main/i.test(d.label)
                  ) || (videoInputs.length > 1 ? videoInputs[videoInputs.length - 1] : undefined);
              } else {
                matchedDevice =
                  videoInputs.find((d) => /front|user|selfie|facing\s*front|camera2\s*1/i.test(d.label)) ||
                  videoInputs[0];
              }

              if (matchedDevice?.deviceId) {
                try {
                  mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                      deviceId: { exact: matchedDevice.deviceId },
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                    },
                    audio: false,
                  });
                } catch (devErr) {
                  console.warn("Direct deviceId acquisition failed, falling back:", devErr);
                  mediaStream = null;
                }
              }
            }
          } catch (enumErr) {
            console.warn("Pre-enumeration failed:", enumErr);
          }
        }

        // Strategy 1: Exact facingMode constraint.
        // On mobile Android Chrome & iOS Safari, { facingMode: { exact: "environment" } } enforces the back camera!
        if (!mediaStream) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { exact: facing },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch (exactErr) {
            console.warn("Exact facingMode acquisition failed (typical on desktops with 1 webcam):", exactErr);
          }
        }

        // Strategy 2: Direct string facingMode (e.g. { video: { facingMode: "environment" } })
        if (!mediaStream) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: facing,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch (directErr) {
            console.warn("Direct facingMode acquisition failed:", directErr);
          }
        }

        // Strategy 3: Mobile standard ideal facingMode
        if (!mediaStream) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: facing },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch (idealErr) {
            console.warn("Ideal facingMode acquisition failed:", idealErr);
          }
        }

        // Strategy 4: Permissive fallback to any available video stream
        if (!mediaStream) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        // Critical Safeguard: Verify actual stream facingMode on mobile.
        // Some Android Chrome devices may satisfy an ideal or direct constraint using the front camera (camera 0).
        // Now that camera permissions are definitely granted, enumerateDevices() has real labels!
        if (mediaStream && facing === "environment") {
          const track = mediaStream.getVideoTracks()[0];
          const settings = track?.getSettings ? track.getSettings() : {};
          const trackLabel = track?.label || "";
          const isWronglyFront =
            settings.facingMode === "user" ||
            /front|user|selfie|facing\s*front/i.test(trackLabel);

          if (isWronglyFront && navigator.mediaDevices.enumerateDevices) {
            console.warn("Acquired camera is front-facing despite environment request. Auto-switching to rear camera...");
            try {
              const allDevices = await navigator.mediaDevices.enumerateDevices();
              const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
              const rearCamera =
                videoInputs.find((d) =>
                  /back|rear|environment|facing\s*back|camera2\s*0|main/i.test(d.label)
                ) ||
                videoInputs.find((d) => d.deviceId !== settings.deviceId);

              if (rearCamera && rearCamera.deviceId !== settings.deviceId) {
                track.stop();
                mediaStream = await navigator.mediaDevices.getUserMedia({
                  video: {
                    deviceId: { exact: rearCamera.deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  },
                  audio: false,
                });
              }
            } catch (correctErr) {
              console.warn("Rear camera auto-correction fallback encountered error:", correctErr);
            }
          }
        }

        streamRef.current = mediaStream;

        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : undefined;
        setHasTorch(Boolean(capabilities?.torch));

        // Attempt continuous autofocus if supported on mobile
        try {
          const trackWithApply = track as MediaStreamTrack & {
            applyConstraints: (c: MediaTrackConstraints) => Promise<void>;
          };
          if (trackWithApply?.applyConstraints) {
            await trackWithApply.applyConstraints({
              advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
            });
          }
        } catch {}

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Video play interrupted:", playErr);
          }
        }

        setIsCameraActive(true);
      } catch (err: unknown) {
        console.error("Camera start error:", err);
        const isNamedError = err && typeof err === "object" && "name" in err;
        const errName = isNamedError ? String((err as { name: unknown }).name) : "";
        const errMsg = err instanceof Error ? err.message : "Failed to initialize camera.";

        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          setCameraError("Camera permission was denied in browser settings.");
        } else if (errName === "NotFoundError") {
          setCameraError("No camera hardware found on this machine.");
        } else {
          setCameraError(errMsg);
        }
        setIsCameraActive(false);
      }
    },
    [cameraFacing]
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      if (!isCheckinActive) {
        triggerToast("Check-in is currently locked for this event. A Master Admin must enable check-in.");
        return;
      }
      startCamera();
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchActive;
      const trackWithConstraints = track as MediaStreamTrack & {
        applyConstraints: (c: MediaTrackConstraints) => Promise<void>;
      };
      await trackWithConstraints.applyConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchActive(nextTorch);
    } catch (err) {
      console.warn("Could not toggle flashlight:", err);
    }
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Clean up camera stream and timers on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (scanResultTimerRef.current) {
        clearTimeout(scanResultTimerRef.current);
      }
    };
  }, []);

  // Frame Scanning Loop
  useEffect(() => {
    let animId: number;

    const scanFrame = () => {
      if (
        isCameraActive &&
        !isProcessing &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement("canvas");
        if (!canvasRef.current) canvasRef.current = canvas;

        const w = video.videoWidth;
        const h = video.videoHeight;

        if (w > 0 && h > 0) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              handleCheckInCode(code.data);
              return;
            }
          }
        }
      }

      if (isCameraActive) {
        animId = requestAnimationFrame(scanFrame);
      }
    };

    if (isCameraActive && !isProcessing && !scanModal?.isOpen) {
      animId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCameraActive, isProcessing, scanModal?.isOpen, handleCheckInCode]);

  // -------------------------------------------------------------
  // Computed Stats (Only fully registered teams & participants, exclude forming)
  // -------------------------------------------------------------
  const totalRegistered = eligibleTeams.length;
  const checkedInCount = eligibleTeams.filter((t) => t.checkedIn).length;
  const remainingCount = totalRegistered - checkedInCount;
  const attendanceRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  const getParticipantCount = (t: RegisteredTeam) =>
    1 + (Array.isArray(t.members) ? t.members.length : 0);
  const totalParticipants = eligibleTeams.reduce((acc, t) => acc + getParticipantCount(t), 0);
  const checkedInParticipants = eligibleTeams
    .filter((t) => t.checkedIn)
    .reduce((acc, t) => acc + getParticipantCount(t), 0);
  const remainingParticipants = totalParticipants - checkedInParticipants;
  const participantRate =
    totalParticipants > 0 ? Math.round((checkedInParticipants / totalParticipants) * 100) : 0;

  const filteredTeams = teams.filter((t) => {
    const isSubmitted = isTeamSubmitted(t);
    if (rosterFilter === "checked_in" && (!t.checkedIn || !isSubmitted)) return false;
    if (rosterFilter === "not_checked_in" && (t.checkedIn || !isSubmitted)) return false;
    if (rosterFilter === "all" && !isSubmitted) return false;
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    return (
      t.teamName.toLowerCase().includes(q) ||
      t.teamCode.toLowerCase().includes(q) ||
      t.lead.name.toLowerCase().includes(q) ||
      t.lead.email.toLowerCase().includes(q) ||
      t.members.some((m) => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
    );
  });

  const filteredParticipants = useMemo(() => {
    return allFlattenedParticipants.filter((p) => {
      if (rosterFilter === "checked_in" && !p.checkedIn) return false;
      if (rosterFilter === "not_checked_in" && p.checkedIn) return false;
      if (!rosterSearch.trim()) return true;
      const q = rosterSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.teamCode.toLowerCase().includes(q) ||
        (p.roll && p.roll.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
      );
    });
  }, [allFlattenedParticipants, rosterFilter, rosterSearch]);

  const checkedInParticipantCount = allFlattenedParticipants.filter((p) => p.checkedIn).length;
  const remainingParticipantCount = allFlattenedParticipants.length - checkedInParticipantCount;

  return (
    <div className="space-y-6 font-[family-name:var(--font-google-sans)] pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-neutral-900 border border-white/20 px-5 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-fadeIn flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Console Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              Terminal Online • Real-Time Attendance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Participant QR Scanner
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Instant camera pass verification, duplicate attendance protection, and live roster syncing.
          </p>
        </div>

        {/* Event Selector Dropdown & Master Admin Switch */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {selectedEventId && (
            <OnSpotMasterSwitch
              eventId={selectedEventId}
              onSpotRegistrationEnabled={isOnSpotActive}
              isMasterAdmin={isMasterAdmin}
              onToggle={handleToggleOnSpot}
            />
          )}
          {selectedEventId && (
            <CheckinMasterSwitch
              eventId={selectedEventId}
              checkinEnabled={isCheckinActive}
              isMasterAdmin={isMasterAdmin}
              onToggle={handleToggleCheckin}
            />
          )}

          <div className="flex-1 sm:flex-initial flex items-center gap-2 rounded-2xl border border-white/15 bg-[#16161d] px-3 sm:px-3.5 py-2 text-xs min-w-0">
            <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={loadingEvents}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer w-full sm:max-w-xs truncate"
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id} className="bg-[#16161d] text-white">
                  {ev.title} ({ev.registrationStatus.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchTeams(selectedEventId)}
            disabled={loadingTeams || !selectedEventId}
            className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-[#16161d] hover:bg-[#202028] px-3 sm:px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer shrink-0"
            title="Refresh teams"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingTeams ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Check-in Locked Banner */}
      {!isCheckinActive && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 shadow-xl">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-red-300 text-sm">Check-in Locked for this Event</div>
            <div className="text-red-300/80 mt-0.5">
              Attendance recording and QR pass scanning are currently closed. {isMasterAdmin ? "Click the Check-in Switch above to start receiving participants." : "A Master Administrator must toggle the check-in switch to enable access."}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Stats HUD Cards (Only displayed when toggle button is active) */}
      {isCheckinActive && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-3.5 sm:p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="text-[11px] sm:text-xs">Total Registered</span>
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-white">{totalRegistered}</div>
            <p className="text-[10px] text-sky-400/80 font-mono truncate">{totalParticipants} participants</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 sm:p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-emerald-300 text-xs">
              <span className="text-[11px] sm:text-xs">Checked In</span>
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-emerald-300">{checkedInCount}</div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${participantRate}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-300/80 font-mono truncate">{checkedInParticipants} verified</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-3.5 sm:p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="text-[11px] sm:text-xs">Awaiting Arrival</span>
              <ScanLine className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-amber-300">{remainingCount}</div>
            <p className="text-[10px] text-amber-400/80 font-mono truncate">{remainingParticipants} pending ({participantRate}%)</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-3.5 sm:p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="text-[11px] sm:text-xs">Session Scans</span>
              <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-white">{sessionLogs.length}</div>
            <p className="text-[10px] text-neutral-400 font-mono truncate">This session</p>
          </div>
        </div>
      )}

      {/* Scanner & Live Session Feed Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column: Camera Scanner (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-4 sm:p-7 shadow-2xl space-y-4 sm:space-y-5">
            {/* Header with Camera Status & Action Controls */}
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-white/10 flex-wrap">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">Camera Scanner</h2>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">Position attendee pass in reticle</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Mode Switch: Confirm on Scan vs Direct */}
                <button
                  type="button"
                  onClick={() => setRequireConfirmation((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] font-mono border transition-all cursor-pointer ${
                    requireConfirmation
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
                  }`}
                  title="Toggle confirmation pop-up before check-in"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="hidden sm:inline">{requireConfirmation ? "Confirm Pop-up: ON" : "Instant Scan: ON"}</span>
                  <span className="sm:hidden">{requireConfirmation ? "Confirm: ON" : "Instant"}</span>
                </button>

                {/* Camera Toggle Button */}
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3.5 sm:px-5 py-2 text-xs font-bold text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Pause Camera"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`inline-flex rounded-full px-4 sm:px-5 py-2 text-xs font-bold text-white transition-all items-center gap-1.5 cursor-pointer shrink-0 ${
                      isCheckinActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/30 hover:scale-105"
                        : "bg-red-500/30 border border-red-500/50 text-red-200 hover:bg-red-500/40"
                    }`}
                  >
                    {isCheckinActive ? <Camera className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    <span>{isCheckinActive ? "Scan QR" : "Check-in Locked"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Viewfinder Canvas Stage */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-black min-h-[220px] sm:min-h-[380px] aspect-[3/4] sm:aspect-video flex items-center justify-center">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />

                  {/* Laser Reticle HUD */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.35)] flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-300 rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-300 rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-300 rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-300 rounded-br-xl" />
                    </div>
                  </div>

                  {/* On-Screen Status Badge */}
                  <div className="absolute bottom-3 left-3 pointer-events-none">
                    <div className="rounded-full bg-black/80 backdrop-blur-md px-3.5 py-1 text-[11px] font-mono font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <ScanLine className="h-3.5 w-3.5 animate-pulse" />
                      <span>{isProcessing ? "Verifying pass..." : "Align pass inside box"}</span>
                    </div>
                  </div>

                  {/* Top Right Camera Toolbar */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                          torchActive
                            ? "bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/50"
                            : "bg-black/70 text-white border-white/20 hover:bg-black/90"
                        }`}
                        title="Toggle Flashlight"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={switchCameraFacing}
                      className="h-8 w-8 rounded-full bg-black/70 border border-white/20 text-white hover:bg-black/90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                      title="Flip Camera (Front/Back)"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled((prev) => !prev)}
                      className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                        soundEnabled
                          ? "bg-black/70 text-emerald-300 border-white/20 hover:bg-black/90"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                      title={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
                    >
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 sm:p-8 text-center space-y-3 sm:space-y-4 max-w-xs sm:max-w-sm">
                  {cameraError ? (
                    <>
                      <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-rose-400 mx-auto" />
                      <h3 className="text-xs sm:text-sm font-bold text-white">Camera Access Error</h3>
                      <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry Camera</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center mx-auto ${
                        isCheckinActive
                          ? "bg-white/5 border border-white/15 text-neutral-400"
                          : "bg-red-500/10 border border-red-500/30 text-red-400"
                      }`}>
                        {isCheckinActive ? <Camera className="h-6 w-6 sm:h-7 sm:w-7" /> : <Lock className="h-6 w-6 sm:h-7 sm:w-7" />}
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white">
                          {isCheckinActive ? "Camera Viewfinder Paused" : "Check-in Currently Locked"}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                          {isCheckinActive
                            ? "Click below to start high-speed QR pass detector."
                            : isMasterAdmin
                              ? "Activate check-in using the switch in the top bar to start scanning passes."
                              : "Contact a Master Administrator to enable check-in for this event."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        disabled={!isCheckinActive}
                        className={`rounded-full px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold transition-all inline-flex items-center gap-2 font-[family-name:var(--font-google-sans)] ${
                          isCheckinActive
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 hover:scale-105 cursor-pointer"
                            : "bg-red-500/20 text-red-300 border border-red-500/30 cursor-not-allowed opacity-80"
                        }`}
                      >
                        {isCheckinActive ? <Camera className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        <span>{isCheckinActive ? "Scan Participant QR" : "Check-in Locked"}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Session Activity Feed ("The Side Thing") */}
        <div className="lg:col-span-5 space-y-4 order-first lg:order-none">
          <div className="rounded-3xl sm:rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-base font-bold text-white">Live Session Feed</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                  {sessionLogs.length} scans
                </span>
                {sessionLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSessionLogs([])}
                    className="text-[10px] font-mono text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Clear session feed"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {sessionLogs.length > 0 ? (
              <div className="space-y-2.5 max-h-[200px] sm:max-h-[460px] overflow-y-auto pr-1">
                {sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-2xl p-3 border transition-all text-xs flex items-center justify-between gap-3 ${
                      log.status === "success"
                        ? "bg-[#16161d] border-emerald-500/25"
                        : log.status === "duplicate"
                        ? "bg-[#16161d] border-amber-500/25"
                        : "bg-[#16161d] border-rose-500/25"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{log.teamName}</span>
                        <span className="font-mono text-[10px] text-rose-400 font-bold">
                          {log.teamCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2 flex-wrap">
                        {log.participantName ? (
                          <span className="text-white/90 font-medium">
                            {log.participantName} {log.participantRole ? `(${log.participantRole})` : ""}
                          </span>
                        ) : log.leadName ? (
                          <span>Lead: {log.leadName}</span>
                        ) : null}
                        <span>•</span>
                        <span className="font-mono">{log.timestamp}</span>
                        {log.checkedInCount && log.totalMembers ? (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-semibold">
                              {log.checkedInCount}/{log.totalMembers} Present
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {log.status === "success" && (
                      <button
                        type="button"
                        onClick={() => handleUndoCheckIn(log.teamCode)}
                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 px-2.5 py-1 text-[10px] font-mono font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        title="Revert check in"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-neutral-500 font-mono space-y-1">
                <ScanLine className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
                <p>No scans recorded this session yet.</p>
                <p className="text-[10px] text-neutral-600">
                  Scanned passes will appear here in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Roster Quick-Check Table (Only appears automatically when check-in is active) */}
      {isCheckinActive && (
        <div className="rounded-3xl sm:rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-4 sm:p-8 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Event Roster Quick-Check</h3>
              <p className="text-[11px] sm:text-xs text-neutral-400">
                Manual attendance toggle and backup lookup for attendees without passes.
              </p>
            </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Filter: By Teams vs By Participants */}
            <div className="flex items-center rounded-xl bg-[#16161d] p-1 border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("teams")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "teams"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>By Teams</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("participants")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "participants"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>By Participants</span>
              </button>
            </div>

            {/* Attendance Status Filters */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setRosterFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border flex items-center shrink-0 ${
                  rosterFilter === "all"
                    ? "bg-white text-black border-white shadow-md shadow-white/10"
                    : "bg-[#16161d] text-neutral-400 border-white/10 hover:text-white hover:bg-[#202028]"
                }`}
              >
                <span>All ({viewMode === "teams" ? totalRegistered : allFlattenedParticipants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRosterFilter("checked_in")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border flex items-center shrink-0 ${
                  rosterFilter === "checked_in"
                    ? "bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/20 font-bold"
                    : "bg-[#16161d] text-neutral-400 border-white/10 hover:text-white hover:bg-[#202028]"
                }`}
              >
                <span>Checked In ({viewMode === "teams" ? checkedInCount : checkedInParticipantCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setRosterFilter("not_checked_in")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border flex items-center shrink-0 ${
                  rosterFilter === "not_checked_in"
                    ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20 font-bold"
                    : "bg-[#16161d] text-neutral-400 border-white/10 hover:text-white hover:bg-[#202028]"
                }`}
              >
                <span>Pending ({viewMode === "teams" ? remainingCount : remainingParticipantCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder={
              viewMode === "teams"
                ? "Search by team name, leader name, email..."
                : "Search by participant name, team, email, roll, department..."
            }
            value={rosterSearch}
            onChange={(e) => setRosterSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#16161d] border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Conditional Table Display: By Teams or By Participants */}
        {viewMode === "teams" ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            {loadingTeams ? (
              <div className="py-16 text-center text-xs text-neutral-500 font-mono">
                Loading event roster...
              </div>
            ) : filteredTeams.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 bg-[#16161d]">
                    <th className="py-3 px-4 font-semibold">Team</th>
                    <th className="py-3 px-4 font-semibold">Leader</th>
                    <th className="py-3 px-4 font-semibold">Members</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Attendance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-[#16161d]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{team.teamName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{team.lead.name}</div>
                        <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[160px]">
                          {team.lead.email}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-400">
                        {1 + (team.members?.length || 0)} members
                      </td>

                      <td className="py-3 px-4">
                        {team.checkedIn ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Checked In</span>
                            </span>
                            {(() => {
                              const formatted = formatCheckInDateTime(team.checkedInAt || team.lead?.checkedInAt);
                              if (!formatted) return null;
                              return (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 whitespace-nowrap">
                                  <Clock className="h-2.5 w-2.5 opacity-70" />
                                  <span>{formatted.dateStr}, {formatted.timeStr}</span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#16161d] text-neutral-400 border border-white/10">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleRosterCheckIn(team)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all ${
                            team.checkedIn
                              ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                              : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          }`}
                        >
                          {team.checkedIn ? (
                            <>
                              <Undo2 className="h-3 w-3" />
                              <span>Undo Check-In</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Mark Present</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                No registered teams found matching filters.
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            {loadingTeams ? (
              <div className="py-16 text-center text-xs text-neutral-500 font-mono">
                Loading event roster...
              </div>
            ) : filteredParticipants.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-neutral-400 bg-[#16161d]">
                    <th className="py-3 px-4 font-semibold">Participant</th>
                    <th className="py-3 px-4 font-semibold">Team</th>
                    <th className="py-3 px-4 font-semibold">Department & Roll</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Attendance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredParticipants.map((p) => {
                    const isLoading = actionLoadingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-[#16161d]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{p.name}</span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                                p.role === "Team Leader"
                                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                                  : "bg-white/10 text-neutral-300 border border-white/10"
                              }`}
                            >
                            {p.role === "Team Leader" ? "Leader" : "Member"}
                            </span>
                            {p.isOnSpot && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                <Zap className="h-2.5 w-2.5 text-amber-400" />
                                <span>On-Spot</span>
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[200px]">
                            {p.email || "No email"}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-white font-medium">{p.teamName}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-neutral-300">{p.department || "General"}</div>
                          {p.roll && (
                            <div className="font-mono text-[10px] text-neutral-500 truncate">
                              {p.roll}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {p.checkedIn ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Checked In</span>
                              </span>
                              {(() => {
                                const formatted = formatCheckInDateTime(p.checkedInAt);
                                if (!formatted) return null;
                                return (
                                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 whitespace-nowrap">
                                    <Clock className="h-2.5 w-2.5 opacity-70" />
                                    <span>{formatted.dateStr}, {formatted.timeStr}</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#16161d] text-neutral-400 border border-white/10">
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleToggleParticipantCheckIn(p)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all ${
                              p.checkedIn
                                ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                                : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : p.checkedIn ? (
                              <>
                                <Undo2 className="h-3 w-3" />
                                <span>Undo</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Mark Present</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                No participants found matching filters.
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Check-In / Revert Confirmation Modal */}
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
            <button
              type="button"
              disabled={Boolean(actionLoadingId)}
              onClick={() => setCheckInConfirmTarget(null)}
              className="absolute right-5 top-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>

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
                    await executeToggleRosterCheckIn(target, nextState);
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

      {/* ========================================================================= */}
      {/* Dedicated Scan Confirmation & Check-In Pop-Up Modal (Global Fixed Dialog) */}
      {/* ========================================================================= */}
      {scanModal && scanModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !scanModal.isSubmitting) {
              closeScanModal();
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#0e0e12] p-5 sm:p-7 shadow-2xl overflow-hidden animate-scaleIn">
            {/* Close / Dismiss Button */}
            <button
              type="button"
              disabled={Boolean(scanModal.isSubmitting)}
              onClick={closeScanModal}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              title="Close modal (Scan Next)"
            >
              <X className="h-4 w-4" />
            </button>

            {/* STAGE 1: CONFIRM (Before Check-In) */}
            {scanModal.stage === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                      Pass Detected • Confirm Check-In
                    </span>
                    <h3 className="text-lg font-black text-white font-[family-name:var(--font-google-sans)] leading-snug">
                      Confirm Registration
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Verify attendee credentials before admitting to auditorium.
                    </p>
                  </div>
                </div>

                {/* Attendee Details Card */}
                <div className="rounded-2xl border border-white/10 bg-[#16161d] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block">
                        Participant
                      </span>
                      <span className="text-base font-bold text-white block truncate">
                        {scanModal.participantName || "Attendee"}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        scanModal.participantRole === "Team Leader"
                          ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                          : "bg-white/10 text-white/80 border-white/15"
                      }`}
                    >
                      {scanModal.participantRole || "Member"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Team</span>
                      <span className="text-white font-medium truncate block">
                        {scanModal.teamName || "Registered Team"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Team Code</span>
                      <span className="text-white font-mono font-bold text-rose-400 block">
                        {scanModal.teamCode}
                      </span>
                    </div>
                  </div>

                  {(scanModal.roll || scanModal.department) && (
                    <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-white/60 flex items-center justify-between">
                      <span>Roll: <strong className="text-white">{scanModal.roll || "Registered"}</strong></span>
                      <span>Dept: <strong className="text-white">{scanModal.department || "General"}</strong></span>
                    </div>
                  )}

                  {scanModal.totalMembers !== undefined && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-400">Current Team Attendance:</span>
                      <span className="text-emerald-400 font-bold">
                        {scanModal.checkedInCount || 0} of {scanModal.totalMembers} Present
                      </span>
                    </div>
                  )}
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={Boolean(scanModal.isSubmitting)}
                    onClick={closeScanModal}
                    className="rounded-xl border border-white/20 bg-white/[0.08] hover:bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(scanModal.isSubmitting)}
                    onClick={() => submitCheckIn(scanModal.rawCode, scanModal.participant)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black px-5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                  >
                    {scanModal.isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Confirming Check-In...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirm Registration & Check In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: DONE (Check-In Complete!) */}
            {scanModal.stage === "done" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div>
                  <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 bg-emerald-500/15 border-emerald-500/40 text-emerald-300">
                    Registration Verified • Check-In Done
                  </span>
                  <h3 className="text-xl font-black text-white font-[family-name:var(--font-google-sans)] mt-1">
                    Check-In Complete!
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    {scanModal.message || "Attendee marked present for HULT ASCEND."}
                  </p>
                </div>

                {/* Attendee Confirmation Card */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {scanModal.participantName || "Attendee"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {scanModal.participantRole || "Verified"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>Team: <strong className="text-white">{scanModal.teamName}</strong></span>
                    <span className="font-mono text-rose-300 font-bold">{scanModal.teamCode}</span>
                  </div>

                  {scanModal.totalMembers !== undefined && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-400">Team Attendance:</span>
                      <strong className="text-emerald-300 font-bold">
                        {scanModal.checkedInCount} of {scanModal.totalMembers} Present
                      </strong>
                    </div>
                  )}

                  {scanModal.allCheckedIn && (
                    <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 mt-1">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span>All Team Members Verified — Full Team Checked In!</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeScanModal}
                    className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 active:scale-98 text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Scan Next Pass</span>
                  </button>

                  {scanModal.teamCode && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUndoCheckIn(scanModal.teamCode!);
                        closeScanModal();
                      }}
                      className="py-3 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 border border-white/15 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      title="Undo check-in"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 3: DUPLICATE (Already Checked In) */}
            {scanModal.stage === "duplicate" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                  <AlertCircle className="h-7 w-7" />
                </div>

                <div>
                  <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 bg-amber-500/15 border-amber-500/30 text-amber-300">
                    Already Checked In
                  </span>
                  <h3 className="text-lg font-black text-white font-[family-name:var(--font-google-sans)] mt-0.5">
                    Duplicate Pass Detected
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    {scanModal.message || "This attendee was already checked in earlier."}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-[#16161d] p-4 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {scanModal.participantName || "Attendee"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Checked In
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>Team: <strong className="text-white">{scanModal.teamName}</strong></span>
                    <span className="font-mono text-rose-300 font-bold">{scanModal.teamCode}</span>
                  </div>
                  {scanModal.checkedInAt && (
                    <div className="text-[11px] font-mono text-neutral-400">
                      Verified at: <span className="text-amber-300 font-bold">{scanModal.checkedInAt}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeScanModal}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Scan Next Pass</span>
                  </button>
                  {scanModal.teamCode && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUndoCheckIn(scanModal.teamCode!);
                        closeScanModal();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 4: ERROR (Blocked or Invalid) */}
            {scanModal.stage === "error" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
                  <AlertCircle className="h-7 w-7" />
                </div>

                <div>
                  <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 bg-rose-500/15 border-rose-500/30 text-rose-300">
                    Check-In Blocked
                  </span>
                  <h3 className="text-lg font-black text-white font-[family-name:var(--font-google-sans)] mt-0.5">
                    Verification Error
                  </h3>
                  <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                    {scanModal.message || "Invalid pass or attendee registration issue."}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeScanModal}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Dismiss & Resume Scanning</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Keyboard,
  RefreshCw,
  Search,
  Undo2,
  Calendar,
  Users,
  Check,
} from "lucide-react";

interface TeamMember {
  name: string;
  email?: string;
  department?: string;
  roll?: string;
}

interface TeamLead {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
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
  status: "confirmed" | "pending" | "waitlist" | "disqualified";
  checkedIn: boolean;
  checkedInAt?: string | null;
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
}

interface SessionScanLog {
  id: string;
  teamCode: string;
  teamName: string;
  leadName?: string;
  timestamp: string;
  status: "success" | "duplicate" | "error";
  message: string;
}

export default function ScannerConsole() {
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

  // -------------------------------------------------------------
  // Feedback & Session Logs
  // -------------------------------------------------------------
  const [lastScanResult, setLastScanResult] = useState<{
    status: "success" | "duplicate" | "error";
    message: string;
    teamCode: string;
    teamName?: string;
    leadName?: string;
    membersCount?: number;
  } | null>(null);

  const [manualCode, setManualCode] = useState<string>("");
  const [sessionLogs, setSessionLogs] = useState<SessionScanLog[]>([]);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "checked_in" | "pending">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      const res = await fetch("/api/admin/events");
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
      const res = await fetch(`/api/admin/teams?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setTeams(Array.isArray(data.teams) ? data.teams : []);
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

  // -------------------------------------------------------------
  // 3. Process Check-in Submission
  // -------------------------------------------------------------
  const handleCheckInCode = useCallback(
    async (rawCode: string) => {
      const code = parseTeamCode(rawCode);
      if (!code) return;

      setIsProcessing(true);

      const matchedTeam = teams.find(
        (t) => t.teamCode.toUpperCase() === code.toUpperCase()
      );

      // Check if already checked in
      if (matchedTeam && matchedTeam.checkedIn) {
        playAudioChime("duplicate");
        const logEntry: SessionScanLog = {
          id: `${code}_${Date.now()}`,
          teamCode: code,
          teamName: matchedTeam.teamName,
          leadName: matchedTeam.lead.name,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          status: "duplicate",
          message: `Already checked in at ${matchedTeam.checkedInAt ? new Date(matchedTeam.checkedInAt).toLocaleTimeString() : "earlier"}`,
        };

        setSessionLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
        setLastScanResult({
          status: "duplicate",
          message: logEntry.message,
          teamCode: code,
          teamName: matchedTeam.teamName,
          leadName: matchedTeam.lead.name,
          membersCount: matchedTeam.membersCount,
        });

        setTimeout(() => setIsProcessing(false), 1600);
        return;
      }

      try {
        const res = await fetch("/api/admin/teams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle_check_in",
            teamId: matchedTeam?.id,
            eventId: selectedEventId,
            teamCode: code,
            checkedIn: true,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          playAudioChime("success");
          const teamName = matchedTeam?.teamName || data.team?.teamName || code;
          const leadName = matchedTeam?.lead.name || data.team?.lead?.name || "Participant";
          const membersCount = matchedTeam?.membersCount || data.team?.membersCount || 4;

          // Optimistically update local teams list
          setTeams((prev) =>
            prev.map((t) =>
              t.teamCode.toUpperCase() === code.toUpperCase() || (matchedTeam && t.id === matchedTeam.id)
                ? { ...t, checkedIn: true, checkedInAt: new Date().toISOString() }
                : t
            )
          );

          const logEntry: SessionScanLog = {
            id: `${code}_${Date.now()}`,
            teamCode: code,
            teamName,
            leadName,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: "success",
            message: "Attendance confirmed",
          };

          setSessionLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
          setLastScanResult({
            status: "success",
            message: "Attendance confirmed",
            teamCode: code,
            teamName,
            leadName,
            membersCount,
          });
        } else {
          playAudioChime("error");
          const errorMsg = data.error || `Team not found (${code})`;

          const logEntry: SessionScanLog = {
            id: `${code}_${Date.now()}`,
            teamCode: code,
            teamName: "Unregistered / Unknown",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: "error",
            message: errorMsg,
          };

          setSessionLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
          setLastScanResult({
            status: "error",
            message: errorMsg,
            teamCode: code,
          });
        }
      } catch (err: unknown) {
        playAudioChime("error");
        const errMsg = err instanceof Error ? err.message : "Network error submitting check-in.";
        setLastScanResult({
          status: "error",
          message: errMsg,
          teamCode: code,
        });
      } finally {
        setTimeout(() => setIsProcessing(false), 1800);
      }
    },
    [teams, selectedEventId, playAudioChime]
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
  const handleToggleRosterCheckIn = async (team: RegisteredTeam) => {
    const nextCheckIn = !team.checkedIn;
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
  // 6. Camera Lifecycle & Frame Scanner
  // -------------------------------------------------------------
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported on this browser.");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;

      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : undefined;
      setHasTorch(Boolean(capabilities?.torch));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
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
  }, [cameraFacing]);

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
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Restart camera when facing changes if already active
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [cameraFacing]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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

    if (isCameraActive && !isProcessing) {
      animId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCameraActive, isProcessing, handleCheckInCode]);

  // -------------------------------------------------------------
  // Manual Code Form Submit
  // -------------------------------------------------------------
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isProcessing) return;
    handleCheckInCode(manualCode.trim());
    setManualCode("");
  };

  // -------------------------------------------------------------
  // Computed Stats
  // -------------------------------------------------------------
  const totalRegistered = teams.length;
  const checkedInCount = teams.filter((t) => t.checkedIn).length;
  const pendingCount = totalRegistered - checkedInCount;
  const attendanceRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  const filteredTeams = teams.filter((t) => {
    if (rosterFilter === "checked_in" && !t.checkedIn) return false;
    if (rosterFilter === "pending" && t.checkedIn) return false;
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

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#16161d] px-3.5 py-2 text-xs">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={loadingEvents}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer max-w-[220px] sm:max-w-xs truncate"
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
            className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-[#16161d] hover:bg-[#202028] px-3.5 py-2 text-xs font-medium text-white transition-all cursor-pointer"
            title="Refresh teams"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingTeams ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Attendance Stats HUD Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-4 sm:p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Registered</span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalRegistered}</div>
          <p className="text-[10px] text-neutral-400 font-mono">Teams enrolled for event</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 sm:p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span>Checked In</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">{checkedInCount}</div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-4 sm:p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Pending Arrival</span>
            <ScanLine className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">{pendingCount}</div>
          <p className="text-[10px] text-neutral-400 font-mono">{attendanceRate}% arrived</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e0e12] p-4 sm:p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Session Scans</span>
            <Camera className="h-4 w-4 text-pink-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{sessionLogs.length}</div>
          <p className="text-[10px] text-neutral-400 font-mono">Verified this session</p>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Viewfinder & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Header with Prominent Scan Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Camera Scanner</h2>
                  <p className="text-[11px] text-neutral-400">Position attendee pass in center reticle</p>
                </div>
              </div>

              {/* Exact Emerald Rounded Pill Button from user's request */}
              <button
                type="button"
                onClick={toggleCamera}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer font-[family-name:var(--font-google-sans)] shrink-0"
              >
                <Camera className="h-4 w-4" />
                <span>{isCameraActive ? "Pause Scanner" : "Scan Participant QR"}</span>
              </button>
            </div>

            {/* Viewfinder Canvas Stage */}
            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-black aspect-video flex items-center justify-center">
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
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.35)] flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-300 rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-300 rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-300 rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-300 rounded-br-xl" />

                      {/* Animated Bouncing Laser Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent animate-bounce shadow-[0_0_15px_#34d399]" />
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
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
                <div className="p-8 text-center space-y-4 max-w-sm">
                  {cameraError ? (
                    <>
                      <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
                      <h3 className="text-sm font-bold text-white">Camera Access Error</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry Camera</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-neutral-400 mx-auto">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Camera Viewfinder Paused</h3>
                        <p className="text-xs text-neutral-400 mt-1">
                          Click below to start the high-speed QR pass detector.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 inline-flex items-center gap-2 cursor-pointer font-[family-name:var(--font-google-sans)]"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Scan Participant QR</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Instant Scan Feedback Overlay */}
              {lastScanResult && (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl animate-fadeIn ${
                    lastScanResult.status === "success"
                      ? "bg-emerald-950/90 text-emerald-200"
                      : lastScanResult.status === "duplicate"
                      ? "bg-amber-950/90 text-amber-200"
                      : "bg-rose-950/90 text-rose-200"
                  }`}
                >
                  <div
                    className={`h-16 w-16 rounded-full border-2 flex items-center justify-center mb-3 shadow-xl ${
                      lastScanResult.status === "success"
                        ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        : lastScanResult.status === "duplicate"
                        ? "bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                        : "bg-rose-500/30 border-rose-400 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.5)]"
                    }`}
                  >
                    {lastScanResult.status === "success" ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <AlertCircle className="h-8 w-8" />
                    )}
                  </div>

                  <h3 className="text-xl font-black font-[family-name:var(--font-google-sans)] mb-1">
                    {lastScanResult.status === "success"
                      ? "Check-In Confirmed!"
                      : lastScanResult.status === "duplicate"
                      ? "Already Checked In"
                      : "Check-In Error"}
                  </h3>

                  {lastScanResult.teamName && (
                    <p className="text-sm font-bold text-white mb-0.5">
                      {lastScanResult.teamName}
                    </p>
                  )}

                  {lastScanResult.leadName && (
                    <p className="text-xs text-white/80 mb-1">
                      Lead: {lastScanResult.leadName}
                    </p>
                  )}

                  <p className="text-xs font-mono font-bold tracking-wider opacity-90 mb-2">
                    Code: {lastScanResult.teamCode}
                  </p>

                  <p className="text-xs opacity-80 max-w-sm">{lastScanResult.message}</p>
                </div>
              )}
            </div>

            {/* Manual Code Input & USB Gun Scanner Support */}
            <form onSubmit={handleManualSubmit} className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Keyboard className="h-3.5 w-3.5 text-pink-400" />
                  <span>Manual Entry or USB Gun Scanner:</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Press ENTER to submit</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. HULT-2026-X9K2 or scan barcode..."
                  disabled={isProcessing}
                  className="flex-1 rounded-2xl border border-white/15 bg-[#16161d] hover:bg-[#202028] px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono tracking-wider transition-all"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualCode.trim()}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5 font-mono shrink-0"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Check In</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Session Activity Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-base font-bold text-white">Live Session Feed</h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                {sessionLogs.length} verified
              </span>
            </div>

            {sessionLogs.length > 0 ? (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
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
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                        {log.leadName && <span>Lead: {log.leadName}</span>}
                        <span>•</span>
                        <span className="font-mono">{log.timestamp}</span>
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

      {/* Event Roster Fast-Check Table */}
      <div className="rounded-[2.5rem] border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Event Roster Quick-Check</h3>
            <p className="text-xs text-neutral-400">
              Manual attendance toggle and backup lookup for participants without passes.
            </p>
          </div>

          {/* Roster Filter Buttons */}
          <div className="flex items-center gap-2">
            {(["all", "checked_in", "pending"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setRosterFilter(filter)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer border ${
                  rosterFilter === filter
                    ? "bg-white text-black border-white shadow-md shadow-white/10"
                    : "bg-[#16161d] text-neutral-400 border-white/10 hover:text-white hover:bg-[#202028]"
                }`}
              >
                {filter === "checked_in" ? "Checked In" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by team name, team code, leader name, email..."
            value={rosterSearch}
            onChange={(e) => setRosterSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#16161d] border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Teams Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          {loadingTeams ? (
            <div className="py-16 text-center text-xs text-neutral-500 font-mono">
              Loading event roster...
            </div>
          ) : filteredTeams.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 bg-[#16161d]">
                  <th className="py-3 px-4 font-semibold">Team & Code</th>
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
                      <div className="font-mono text-[10px] text-rose-400 font-bold">
                        {team.teamCode}
                      </div>
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Checked In</span>
                        </span>
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
      </div>
    </div>
  );
}

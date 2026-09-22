"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  X,
  SwitchCamera,
  Keyboard,
  Zap,
  Check,
  RefreshCw,
} from "lucide-react";

interface LiveCameraScannerModalProps {
  eventId: string;
  eventTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onCheckInTeam: (teamCode: string) => Promise<{ success: boolean; message: string; teamName?: string }>;
}

export default function LiveCameraScannerModal({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onCheckInTeam,
}: LiveCameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanningActive, setScanningActive] = useState<boolean>(true);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  // Manual fallback input
  const [manualCode, setManualCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    message: string;
    teamCode: string;
    teamName?: string;
  } | null>(null);

  // Play audio chime on scan success
  const playScanBeep = useCallback((isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio not permitted or not supported
    }
  }, []);

  // Parse QR content into a clean teamCode
  const parseTeamCodeFromQr = (raw: string): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();

    // 1. Check if it is a full URL containing teamCode
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const codeParam = url.searchParams.get("teamCode");
        if (codeParam) return codeParam.trim().toUpperCase();
      }
    } catch {}

    // 2. Check query string format: "eventId=...&teamCode=..."
    if (trimmed.includes("teamCode=")) {
      const match = trimmed.match(/teamCode=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1].trim().toUpperCase();
    }

    // 3. JSON payload: {"teamCode": "XYZ", "eventId": "..."}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.teamCode) return String(parsed.teamCode).trim().toUpperCase();
      } catch {}
    }

    // 4. Plain team code or alphanumeric string
    if (/^[A-Za-z0-9_-]{4,32}$/.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    return trimmed;
  };

  // Process a detected team code
  const handleProcessCode = useCallback(
    async (rawCode: string) => {
      const code = parseTeamCodeFromQr(rawCode);
      if (!code) return;

      setIsProcessing(true);
      setScanningActive(false);

      try {
        const res = await onCheckInTeam(code);
        playScanBeep(res.success);

        setLastScanResult({
          success: res.success,
          message: res.message,
          teamCode: code,
          teamName: res.teamName,
        });

        // Auto-resume scanner after 2.2 seconds
        setTimeout(() => {
          setScanningActive(true);
          setLastScanResult(null);
        }, 2200);
      } catch (err: any) {
        playScanBeep(false);
        setLastScanResult({
          success: false,
          message: err?.message || "Failed to process check-in.",
          teamCode: code,
        });
        setTimeout(() => {
          setScanningActive(true);
          setLastScanResult(null);
        }, 2500);
      } finally {
        setIsProcessing(false);
      }
    },
    [onCheckInTeam, playScanBeep]
  );

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access not supported on this browser or device.");
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      // Check for torch capability
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setHasTorch(Boolean(capabilities?.torch));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera permissions in your browser bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on this system.");
      } else {
        setCameraError(`Camera error: ${err.message || "Failed to start camera."}`);
      }
    }
  }, [cameraFacing]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !torchActive;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchActive(nextTorch);
    } catch (err) {
      console.warn("Could not toggle torch:", err);
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Start / stop camera on modal visibility changes
  useEffect(() => {
    if (isOpen) {
      startCamera();
      setScanningActive(true);
      setLastScanResult(null);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  // Continuous frame scanning loop
  useEffect(() => {
    let animationFrameId: number;

    const scanFrame = () => {
      if (
        isOpen &&
        scanningActive &&
        !isProcessing &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement("canvas");
        if (!canvasRef.current) canvasRef.current = canvas;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              handleProcessCode(code.data);
              return; // Pause scanning while processing
            }
          }
        }
      }

      if (isOpen) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    if (isOpen && scanningActive && !isProcessing) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, scanningActive, isProcessing, handleProcessCode]);

  // Manual Form Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim());
    setManualCode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-emerald-500/40 bg-gradient-to-b from-neutral-900/95 via-black/95 to-black p-6 sm:p-8 backdrop-blur-3xl shadow-[0_25px_70px_rgba(16,185,129,0.25)] flex flex-col justify-between max-h-[95vh] overflow-y-auto">
        {/* Top Iridescent Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300">
                  Live Camera Scanner
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-google-sans)] tracking-tight">
                Scan Participant QR Pass
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Scanner"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Camera Viewfinder Section */}
        <div className="relative my-5 rounded-3xl overflow-hidden border border-white/15 bg-black aspect-video sm:aspect-[16/10] flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center max-w-sm space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Camera Access Error</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          ) : (
            <>
              {/* Active Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Holographic Aiming Target Box */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.35)] flex items-center justify-center">
                  {/* Corner Accent Brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-300 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-300 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-300 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-300 rounded-br-xl" />

                  {/* Laser Scan Line Bar */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent animate-bounce shadow-[0_0_15px_#34d399]" />

                  {/* Center Crosshair Dot */}
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>

              {/* Status Overlay Banner */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
                <div className="rounded-full bg-black/70 backdrop-blur-md px-3.5 py-1 text-[11px] font-mono font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <ScanLine className="h-3.5 w-3.5 animate-pulse" />
                  <span>{isProcessing ? "Verifying pass..." : "Align Participant QR within box"}</span>
                </div>

                {/* Camera Control Actions */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                        torchActive
                          ? "bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/50"
                          : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                      }`}
                      title="Toggle Camera Light"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={switchCamera}
                    className="h-8 w-8 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                    title="Flip Camera (Front/Back)"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Instant Scan Feedback Toast (Inside Viewfinder) */}
          {lastScanResult && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl animate-fadeIn ${
                lastScanResult.success
                  ? "bg-emerald-950/85 text-emerald-200"
                  : "bg-rose-950/85 text-rose-200"
              }`}
            >
              {lastScanResult.success ? (
                <div className="h-16 w-16 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-rose-500/30 border-2 border-rose-400 flex items-center justify-center text-rose-300 mb-3 shadow-[0_0_30px_rgba(244,63,94,0.5)]">
                  <AlertCircle className="h-8 w-8" />
                </div>
              )}

              <h3 className="text-xl font-black font-[family-name:var(--font-google-sans)] mb-1">
                {lastScanResult.success ? "Check-In Confirmed!" : "Check-In Error"}
              </h3>

              {lastScanResult.teamName && (
                <p className="text-sm font-bold text-white mb-1">
                  Team: {lastScanResult.teamName}
                </p>
              )}

              <p className="text-xs font-mono opacity-90 mb-2">Code: {lastScanResult.teamCode}</p>

              <p className="text-xs opacity-80 max-w-sm">{lastScanResult.message}</p>
            </div>
          )}
        </div>

        {/* Manual Barcode / Team Code Fallback */}
        <div className="pt-2">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                <Keyboard className="h-3.5 w-3.5 text-pink-400" />
                <span>Or Enter Code / Use Handheld Gun Scanner:</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. HULT-2026-X9K2 or paste participant QR string..."
                disabled={isProcessing}
                className="flex-1 rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono tracking-wider transition-all"
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
    </div>
  );
}

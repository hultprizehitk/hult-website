"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, Unlock, ShieldAlert, AlertTriangle } from "lucide-react";

interface CheckinMasterSwitchProps {
  eventId: string;
  checkinEnabled: boolean;
  isMasterAdmin: boolean;
  onToggle: (newState: boolean) => void;
  compact?: boolean;
}

/**
 * Master Admin-only toggle to globally enable/disable check-in for an event.
 * Non-master admins see a read-only status badge.
 * Toggle OFF triggers a confirmation dialog.
 * Synchronizes simultaneously across all tabs and screens via BroadcastChannel + Storage events.
 */
export default function CheckinMasterSwitch({
  eventId,
  checkinEnabled,
  isMasterAdmin,
  onToggle,
  compact = false,
}: CheckinMasterSwitchProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmOff, setShowConfirmOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simultaneous multi-tab real-time sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("event_checkin_sync");
      channel.onmessage = (event) => {
        if (event.data?.eventId === eventId && typeof event.data?.checkinEnabled === "boolean") {
          onToggle(event.data.checkinEnabled);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "event_checkin_sync" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.eventId === eventId && typeof parsed?.checkinEnabled === "boolean") {
            onToggle(parsed.checkinEnabled);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [eventId, onToggle]);

  const handleToggle = useCallback(async (target: boolean) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ checkinEnabled: target }),
      });
      if (res.ok) {
        onToggle(target);
        if (typeof window !== "undefined") {
          // 1. BroadcastChannel for instant zero-latency sync across all open tabs
          if (typeof BroadcastChannel !== "undefined") {
            try {
              const channel = new BroadcastChannel("event_checkin_sync");
              channel.postMessage({ eventId, checkinEnabled: target, timestamp: Date.now() });
              setTimeout(() => {
                try {
                  channel.close();
                } catch {}
              }, 500);
            } catch {}
          }
          // 2. LocalStorage event for cross-window fallback
          try {
            localStorage.setItem(
              "event_checkin_sync",
              JSON.stringify({ eventId, checkinEnabled: target, timestamp: Date.now() })
            );
          } catch {}
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const errText = data.error || res.statusText || "Failed to update check-in status";
        console.error("Failed to toggle check-in:", errText);
        setErrorMessage(errText);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err: unknown) {
      console.error("Toggle check-in error:", err);
      setErrorMessage("Network error updating check-in");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
      setShowConfirmOff(false);
    }
  }, [eventId, onToggle]);

  const handleSwitchClick = () => {
    if (loading) return;
    if (checkinEnabled) {
      // Turning OFF — confirm first
      setShowConfirmOff(true);
    } else {
      // Turning ON — immediate
      handleToggle(true);
    }
  };

  // ----- Read-only badge for non-master admins -----
  if (!isMasterAdmin) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold select-none ${
          checkinEnabled
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}
      >
        {checkinEnabled ? (
          <>
            <Unlock className="w-3.5 h-3.5" />
            Check-in Open
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            Check-in Locked
          </>
        )}
      </div>
    );
  }

  // ----- Master Admin: Interactive toggle -----
  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleSwitchClick}
        className={`group relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 select-none
          ${loading ? "opacity-60 cursor-wait" : "cursor-pointer"}
          ${
            checkinEnabled
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
              : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 shadow-[0_0_16px_rgba(239,68,68,0.12)]"
          }`}
      >
        {/* Toggle track */}
        <div
          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
            checkinEnabled ? "bg-emerald-500" : "bg-zinc-600"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
              checkinEnabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </div>

        {/* Label */}
        {!compact && (
          <span className="hidden sm:inline">
            {checkinEnabled ? "Check-in Active" : "Check-in Locked"}
          </span>
        )}

        {/* Icon */}
        {checkinEnabled ? (
          <Unlock className="w-3.5 h-3.5" />
        ) : (
          <Lock className="w-3.5 h-3.5" />
        )}

        {/* Pulse ring when active */}
        {checkinEnabled && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
      </button>

      {/* Confirmation Dialog for turning OFF */}
      {showConfirmOff && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-red-500/30 bg-zinc-900 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Disable Check-in?
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Master Admin Action
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                This will immediately block all check-in operations across all admin users (Scanner + Live Event). No one will be able to check in participants until you re-enable it.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmOff(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggle(false)}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? "Locking..." : "Lock Check-in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Error Notification */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-zinc-950/95 px-4 py-3 text-xs font-semibold text-red-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

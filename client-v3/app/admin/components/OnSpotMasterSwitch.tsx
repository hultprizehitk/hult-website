"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Zap, ZapOff, ShieldAlert, AlertTriangle } from "lucide-react";

interface OnSpotMasterSwitchProps {
  eventId: string;
  onSpotRegistrationEnabled: boolean;
  isMasterAdmin: boolean;
  onToggle: (newState: boolean) => void;
  compact?: boolean;
}

/**
 * Master Admin switch to globally activate/deactivate On-Spot Registration for an event.
 * When enabled, the main website opens live walk-in registration at the venue.
 * Synchronizes simultaneously across all admin tabs via BroadcastChannel + Storage events.
 */
export default function OnSpotMasterSwitch({
  eventId,
  onSpotRegistrationEnabled,
  isMasterAdmin,
  onToggle,
  compact = false,
}: OnSpotMasterSwitchProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<"on" | "off" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-tab real-time synchronization
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("event_onspot_sync");
      channel.onmessage = (event) => {
        if (
          event.data?.eventId === eventId &&
          typeof event.data?.onSpotRegistrationEnabled === "boolean"
        ) {
          onToggle(event.data.onSpotRegistrationEnabled);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "event_onspot_sync" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (
            parsed?.eventId === eventId &&
            typeof parsed?.onSpotRegistrationEnabled === "boolean"
          ) {
            onToggle(parsed.onSpotRegistrationEnabled);
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

  const handleToggle = useCallback(
    async (target: boolean) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const payload: Record<string, unknown> = { onSpotRegistrationEnabled: target };
        if (!target) {
          // When turning off On-Spot, guarantee registrationStatus is explicitly set to closed
          payload.registrationStatus = "closed";
        }

        const res = await fetch(`/api/admin/events/${eventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          onToggle(target);
          if (typeof window !== "undefined") {
            // Instant cross-tab broadcast
            if (typeof BroadcastChannel !== "undefined") {
              try {
                const channel = new BroadcastChannel("event_onspot_sync");
                channel.postMessage({
                  eventId,
                  onSpotRegistrationEnabled: target,
                  registrationStatus: target ? undefined : "closed",
                  timestamp: Date.now(),
                });
                setTimeout(() => {
                  try {
                    channel.close();
                  } catch {}
                }, 500);
              } catch {}
            }
            // LocalStorage event fallback
            try {
              localStorage.setItem(
                "event_onspot_sync",
                JSON.stringify({
                  eventId,
                  onSpotRegistrationEnabled: target,
                  registrationStatus: target ? undefined : "closed",
                  timestamp: Date.now(),
                })
              );
            } catch {}
          }
        } else {
          const data = await res.json().catch(() => ({}));
          const errText =
            data.error || res.statusText || "Failed to update on-spot registration status";
          console.error("Failed to toggle on-spot registration:", errText);
          setErrorMessage(errText);
          setTimeout(() => setErrorMessage(null), 5000);
        }
      } catch (err: unknown) {
        console.error("Toggle on-spot error:", err);
        setErrorMessage("Network error updating on-spot registration");
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setLoading(false);
        setConfirmDialog(null);
      }
    },
    [eventId, onToggle]
  );

  const handleSwitchClick = () => {
    if (loading) return;
    if (onSpotRegistrationEnabled) {
      setConfirmDialog("off");
    } else {
      setConfirmDialog("on");
    }
  };

  // Read-only badge for non-master admins
  if (!isMasterAdmin) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold select-none ${
          onSpotRegistrationEnabled
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-zinc-700 bg-zinc-800/40 text-zinc-400"
        }`}
      >
        {onSpotRegistrationEnabled ? (
          <>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>On-Spot Live</span>
          </>
        ) : (
          <>
            <ZapOff className="w-3.5 h-3.5 text-zinc-500" />
            <span>On-Spot Off</span>
          </>
        )}
      </div>
    );
  }

  // Master Admin Interactive Switch
  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleSwitchClick}
        className={`group relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 select-none ${
          loading ? "opacity-60 cursor-wait" : "cursor-pointer"
        } ${
          onSpotRegistrationEnabled
            ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.15)]"
            : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600 shadow-sm"
        }`}
      >
        {/* Toggle Track */}
        <div
          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
            onSpotRegistrationEnabled ? "bg-amber-500" : "bg-zinc-600"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
              onSpotRegistrationEnabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </div>

        {/* Label */}
        {!compact && (
          <span className="hidden sm:inline">
            {onSpotRegistrationEnabled ? "On-Spot Live" : "On-Spot Off"}
          </span>
        )}

        {/* Icon */}
        {onSpotRegistrationEnabled ? (
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <ZapOff className="w-3.5 h-3.5 text-zinc-500" />
        )}

        {/* Pulsing indicator when active */}
        {onSpotRegistrationEnabled && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        )}
      </button>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-white/15 bg-zinc-900 p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmDialog === "on" ? "bg-amber-500/15" : "bg-zinc-800"
                }`}
              >
                {confirmDialog === "on" ? (
                  <Zap className="w-5 h-5 text-amber-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {confirmDialog === "on"
                    ? "Activate On-Spot Registration?"
                    : "Close On-Spot Registration?"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Master Admin Control</p>
              </div>
            </div>

            {/* Micro Context */}
            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                {confirmDialog === "on"
                  ? "This opens live registration on the public website. Attendees at the venue will be able to self-register and create teams on mobile."
                  : "This will close walk-in registrations on the website immediately. Attendees will no longer be able to create new on-spot teams."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggle(confirmDialog === "on")}
                disabled={loading}
                className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold text-black transition-colors disabled:opacity-50 cursor-pointer ${
                  confirmDialog === "on"
                    ? "bg-amber-400 hover:bg-amber-300"
                    : "bg-zinc-200 hover:bg-white text-zinc-950"
                }`}
              >
                {loading
                  ? "Updating..."
                  : confirmDialog === "on"
                  ? "Enable On-Spot"
                  : "Close On-Spot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
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

"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/client/api";
import type { SessionStatus } from "@/lib/quiz/types";

export const AUTO_SYNC_MS = 20_000;

/**
 * Keeps the Firestore roster fresh from MongoDB while the console is open during setup and check-in
 * (spec U10). One sync = 2 MongoDB queries; the server skips it if another sync ran in the last 15s
 * and writes only teams that changed. Stops at Start, and while the tab is hidden.
 */
export function useAutoSync(code: string, status: SessionStatus | null, lastSyncAtMs: number | null): void {
  const last = useRef(lastSyncAtMs);
  useEffect(() => {
    last.current = lastSyncAtMs;
  }, [lastSyncAtMs]);
  const active = status === "draft" || status === "lobby";

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (last.current !== null && Date.now() - last.current < AUTO_SYNC_MS - 5_000) return;
      void api(`/api/admin/sessions/${code}/sync`, { body: { auto: true } }).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [active, code]);
}

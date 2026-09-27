"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/client/api";
import { computeOffset, OffsetEstimator } from "@/lib/quiz/clock";

const SYNC_MS = 30_000;

/** Offset-corrected server clock. Pings /api/time (no Firestore reads) on mount, then every 30 s. */
export function useServerClock(): () => number {
  const estimator = useRef(new OffsetEstimator());

  useEffect(() => {
    let stopped = false;
    const ping = async () => {
      const sentAt = Date.now();
      try {
        const { serverNow } = await api<{ serverNow: number }>("/api/time");
        if (!stopped) estimator.current.add(computeOffset(sentAt, Date.now(), serverNow));
      } catch {
        // keep the last good offset
      }
    };
    // three quick samples for a good first estimate, then a slow heartbeat
    void ping().then(ping).then(ping);
    const id = setInterval(ping, SYNC_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  return useCallback(() => Date.now() + estimator.current.offset, []);
}

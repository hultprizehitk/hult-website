"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { computeOffset, OffsetEstimator } from "@/lib/quiz/clock";
import { POLL_MS } from "@/lib/quiz/types";

export interface Polling<T> {
  data: T | null;
  error: ApiError | null;
  reconnecting: boolean;
  serverNow: () => number;
  refresh: () => Promise<void>;
}

/** Polls `url` while the tab is visible; exponential backoff (max 8s) on failure; tracks server clock offset. */
export function usePolling<T extends { serverNow: number }>(url: string | null, intervalMs: number = POLL_MS): Polling<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [failures, setFailures] = useState(0);
  const estimator = useRef(new OffsetEstimator());
  const failRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!url) return;
    const sentAt = Date.now();
    try {
      const next = await api<T>(url);
      estimator.current.add(computeOffset(sentAt, Date.now(), next.serverNow));
      failRef.current = 0;
      setFailures(0);
      setError(null);
      setData(next);
    } catch (e) {
      failRef.current += 1;
      setFailures(failRef.current);
      setError(e instanceof ApiError ? e : new ApiError("network", "Network error", 0));
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const loop = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible") await refresh();
      if (stopped) return;
      const delay = failRef.current === 0 ? intervalMs : Math.min(intervalMs * 2 ** failRef.current, 8000);
      timer = setTimeout(loop, delay);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      void loop();
    };
    void loop();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, intervalMs, refresh]);

  const serverNow = useCallback(() => Date.now() + estimator.current.offset, []);
  return { data, error, reconnecting: failures > 0 && data !== null, serverNow, refresh };
}

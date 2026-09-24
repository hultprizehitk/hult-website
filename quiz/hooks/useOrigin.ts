"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** window.location.origin on the client, "" during SSR (no hydration mismatch). */
export function useOrigin(): string {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => "");
}

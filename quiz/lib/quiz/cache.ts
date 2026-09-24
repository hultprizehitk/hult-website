import type { Types } from "mongoose";

export const SNAPSHOT_TTL_MS = 750;

export interface CacheEntry {
  at: number;
  promise: Promise<unknown>;
  value?: unknown;
  refreshing?: boolean;
}

/** Per-process snapshot cache keyed by session code. Values are typed in state.ts. */
export const snapshotCache = new Map<string, CacheEntry>();

/** code -> session _id. A session's id never changes, so snapshot/answer loads can query in parallel. */
export const sessionIdCache = new Map<string, Types.ObjectId>();

/** Hard invalidation: the next reader waits for fresh data (host actions, check-ins, taker changes). */
export function invalidateSnapshot(code: string): void {
  snapshotCache.delete(code);
}

/** Soft invalidation: readers keep getting the current snapshot while a refresh runs (answer bursts). */
export function markSnapshotStale(code: string): void {
  const entry = snapshotCache.get(code);
  if (entry) entry.at = 0;
}

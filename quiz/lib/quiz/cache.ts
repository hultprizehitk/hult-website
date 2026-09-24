export const SNAPSHOT_TTL_MS = 750;

/** Per-process snapshot cache keyed by session code. Values are typed in state.ts. */
export const snapshotCache = new Map<string, { at: number; promise: Promise<unknown> }>();

export function invalidateSnapshot(code: string): void {
  snapshotCache.delete(code);
}

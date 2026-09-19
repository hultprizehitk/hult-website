import { EventEmitter } from "events";

// Global singleton event emitter for broadcasting live stage events
class LiveBroadcaster extends EventEmitter {}

// Global declaration to prevent hot-reloading duplicate instances in Next.js dev
const globalForLive = globalThis as unknown as {
  liveBroadcaster: LiveBroadcaster | undefined;
};

export const liveBroadcaster =
  globalForLive.liveBroadcaster ?? new LiveBroadcaster();

if (process.env.NODE_ENV !== "production") {
  globalForLive.liveBroadcaster = liveBroadcaster;
}

export function broadcastLiveEvent(eventType: string, payload: any) {
  liveBroadcaster.emit("live_update", {
    type: eventType,
    payload,
    timestamp: Date.now(),
  });
}

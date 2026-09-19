import { NextResponse } from "next/server";
import { liveBroadcaster } from "@/lib/live-broadcaster";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  let isCleanedUp = false;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let onLiveUpdate: ((data: any) => void) | null = null;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (onLiveUpdate) {
      liveBroadcaster.off("live_update", onLiveUpdate);
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection handshake
      const handshake = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(handshake));

      // Listener for live stage updates
      onLiveUpdate = (data: any) => {
        try {
          const chunk = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          cleanup();
        }
      };

      liveBroadcaster.on("live_update", onLiveUpdate);

      // Heartbeat timer to keep connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          cleanup();
        }
      }, 15000);

      // Clean up listeners when request closes
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch (e) {}
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

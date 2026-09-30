import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionLog from "@/models/AuctionLog";
import { getAuctionRequestSession } from "@/lib/auth";

export interface Actor {
  name: string;
  email: string;
  role: string;
}

export function getActor(req: Request): Actor {
  try {
    const session = getAuctionRequestSession(req as NextRequest);
    if (session?.email) {
      return { name: session.name || "Administrator", email: session.email, role: session.role };
    }
  } catch {
    /* fall through */
  }
  return { name: "Unverified", email: "", role: "" };
}

export interface LogEntry {
  action: string;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  lotId?: string;
  lotName?: string;
  lotType?: string;
  amount?: number | null;
  detail: string;
}

/**
 * Writes an audit entry. Never throws and never blocks the auction action.
 */
export async function logAction(req: Request, entry: LogEntry): Promise<void> {
  try {
    const actor = getActor(req);
    await connectDB();
    await AuctionLog.create({
      sessionId: "live",
      action: entry.action,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      teamId: entry.teamId || "",
      teamName: entry.teamName || "",
      teamCode: entry.teamCode || "",
      lotId: entry.lotId || "",
      lotName: entry.lotName || "",
      lotType: entry.lotType || "",
      amount: entry.amount ?? null,
      detail: entry.detail,
    });
  } catch (err) {
    console.error("[Audit] log write failed:", err);
  }
}

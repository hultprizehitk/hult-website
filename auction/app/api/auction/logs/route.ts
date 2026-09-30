import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionLog from "@/models/AuctionLog";
import { getAuctionRequestSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    if (!getAuctionRequestSession(req)) {
      return NextResponse.json({ success: false, error: "Not authorised" }, { status: 401 });
    }

    await connectDB();

    const scope = new URL(req.url).searchParams.get("scope") || "all";
    const query: Record<string, unknown> = { sessionId: "live" };

    if (scope !== "all") {
      query.teamCode = scope.toUpperCase().trim();
    }

    const logs = await AuctionLog.find(query)
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}

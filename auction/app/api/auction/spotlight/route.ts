import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { lotId, stageMode, viewerMode } = await req.json();

    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction session not found" }, { status: 404 });
    }

    if (viewerMode && ["stage", "ledger", "matrix"].includes(viewerMode)) {
      session.viewerMode = viewerMode;
      if (viewerMode === "ledger") session.stageMode = "board";
      if (viewerMode === "matrix") session.stageMode = "matrix";
      if (viewerMode === "stage") {
        session.stageMode = "spotlight";
      }
    }

    if (lotId !== undefined) {
      session.activeLotId = lotId || null;
      if (lotId) {
        session.viewerMode = "stage";
        session.stageMode = "spotlight";
      } else {
        if (!session.viewerMode || session.viewerMode === "stage") {
          session.viewerMode = "stage";
          session.stageMode = "spotlight";
        }
      }
    }

    if (stageMode && ["auto", "spotlight", "sold", "board", "matrix"].includes(stageMode)) {
      session.stageMode = stageMode;
      if (stageMode === "board") session.viewerMode = "ledger";
      else if (stageMode === "matrix") session.viewerMode = "matrix";
      else if (stageMode === "spotlight" || stageMode === "sold") session.viewerMode = "stage";
    }

    await session.save();

    return NextResponse.json({
      success: true,
      message: lotId ? `Stage set to lot ${lotId}` : `Viewer mode: ${session.viewerMode}`,
      activeLotId: session.activeLotId,
      stageMode: session.stageMode,
      viewerMode: session.viewerMode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update viewer mode / spotlight" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { round, matrixRevealed } = await req.json();

    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction session not found" }, { status: 404 });
    }

    if (round) {
      if (!["setup", "round1", "intermission", "round2", "results"].includes(round)) {
        return NextResponse.json({ success: false, error: "Invalid round" }, { status: 400 });
      }
      session.currentRound = round;
      if (round === "intermission" || round === "round2" || round === "results") {
        session.matrixRevealed = true;
      }
    }

    if (typeof matrixRevealed === "boolean") {
      session.matrixRevealed = matrixRevealed;
    }

    await session.save();

    return NextResponse.json({
      success: true,
      message: `Auction phase updated to ${session.currentRound}`,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update round" },
      { status: 500 }
    );
  }
}

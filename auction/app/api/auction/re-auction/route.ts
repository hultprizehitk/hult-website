import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuctionSession from "@/models/AuctionSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { lotId, action, votingTeamId } = await req.json();

    if (!lotId || !action) {
      return NextResponse.json({ success: false, error: "lotId and action are required" }, { status: 400 });
    }

    const session = await AuctionSession.findOne({ sessionId: "live" });
    if (!session) {
      return NextResponse.json({ success: false, error: "Auction session not found" }, { status: 404 });
    }

    const currentVotes = (session.reAuctionVotes as any)?.get?.(lotId) || [];

    if (action === "vote" && votingTeamId) {
      if (!currentVotes.includes(votingTeamId)) {
        currentVotes.push(votingTeamId);
        (session.reAuctionVotes as any).set(lotId, currentVotes);
      }
    } else if (action === "unvote" && votingTeamId) {
      const filtered = currentVotes.filter((id: string) => id !== votingTeamId);
      (session.reAuctionVotes as any).set(lotId, filtered);
    } else if (action === "reopen") {
      // Re-open item only if minimum 3 teams voted
      if (currentVotes.length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: `Rule requirement: Minimum of 3 teams must vote to re-open a disqualified asset (Current: ${currentVotes.length} votes).`,
          },
          { status: 400 }
        );
      }

      const lot = session.lots.find((l) => l.lotId === lotId);
      if (lot) {
        lot.status = "unsold";
        lot.winningTeamId = null;
        lot.winningTeamName = null;
        lot.soldPrice = null;
        lot.soldAt = null;
      }

      // Clear votes for this lot
      (session.reAuctionVotes as any).delete(lotId);
    }

    session.markModified("lots");
    session.markModified("reAuctionVotes");
    await session.save();

    return NextResponse.json({
      success: true,
      message: `Re-auction action '${action}' completed for lot ${lotId}`,
      votes: (session.reAuctionVotes as any)?.get?.(lotId) || [],
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process re-auction action" },
      { status: 500 }
    );
  }
}

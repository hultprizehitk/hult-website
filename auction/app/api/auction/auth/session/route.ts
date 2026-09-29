import { NextResponse } from "next/server";
import { getAuctionServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuctionServerSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch (err: any) {
    console.error("Session check error:", err);
    return NextResponse.json({ authenticated: false, user: null });
  }
}

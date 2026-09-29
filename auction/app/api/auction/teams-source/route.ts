import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
    }

    const registeredTeams = await db
      .collection("teams")
      .find({})
      .sort({ registeredAt: 1 })
      .project({
        _id: 1,
        teamName: 1,
        teamCode: 1,
        ventureName: 1,
        status: 1,
        submissionStatus: 1,
      })
      .toArray();

    return NextResponse.json({
      success: true,
      teams: registeredTeams.map((t) => ({
        id: t._id.toString(),
        name: t.teamName,
        code: t.teamCode,
        venture: t.ventureName,
        status: t.status,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch registered teams" },
      { status: 500 }
    );
  }
}

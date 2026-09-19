import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { connectDB } from "@/lib/mongodb";
import EmailLog from "@/models/EmailLog";
import { getEmailStats } from "@/lib/mail-logger";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const recipientEmail = url.searchParams.get("recipientEmail")?.toLowerCase().trim();
    const eventId = url.searchParams.get("eventId")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const status = url.searchParams.get("status")?.trim();

    const query: Record<string, unknown> = {};

    if (recipientEmail) {
      query.recipientEmail = recipientEmail;
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.eventId = new mongoose.Types.ObjectId(eventId);
    }

    if (category) {
      query.category = category;
    }

    if (status && ["sent", "failed", "skipped_duplicate"].includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [logs, totalCount, stats] = await Promise.all([
      EmailLog.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("eventId", "title tag date")
        .lean(),
      EmailLog.countDocuments(query),
      getEmailStats({
        eventId: eventId && mongoose.Types.ObjectId.isValid(eventId) ? eventId : undefined,
        category: category || undefined,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
        logs,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/admin/emails error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch email logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

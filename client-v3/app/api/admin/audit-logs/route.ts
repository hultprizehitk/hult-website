import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import AuditLog from "@/models/AuditLog";

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const targetType = searchParams.get("type");

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (targetType && targetType !== "all") {
      filter.targetType = targetType;
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Admin audit-logs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

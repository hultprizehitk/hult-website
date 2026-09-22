import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import User from "@/models/User";
import Event from "@/models/Event";
import Team from "@/models/Team";
import AuditLog from "@/models/AuditLog";
import SiteContent from "@/models/SiteContent";

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();

    const [
      totalStudents,
      totalAdmins,
      totalEvents,
      publishedEvents,
      totalTeams,
      confirmedTeams,
      activeAnnouncements,
      departmentStats,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: { $in: ["junior_admin", "lead_admin", "master_admin"] } }),
      Event.countDocuments(),
      Event.countDocuments({ isPublished: true }),
      Team.countDocuments(),
      Team.countDocuments({ status: "confirmed" }),
      SiteContent.countDocuments({ contentType: "announcement", isActive: true }),
      User.aggregate([
        { $match: { role: "user" } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AuditLog.find().sort({ timestamp: -1 }).limit(6).lean(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalAdmins,
        totalEvents,
        publishedEvents,
        totalTeams,
        confirmedTeams,
        activeAnnouncements,
        departmentStats: departmentStats.map((d) => ({
          department: d._id || "Unknown",
          count: d.count,
        })),
        recentAuditLogs,
      },
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching admin statistics" },
      { status: 500 }
    );
  }
}

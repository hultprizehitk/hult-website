import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";
    const year = searchParams.get("year")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const isExport = searchParams.get("export") === "csv";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = isExport ? 5000 : Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (department && department !== "all") {
      query.department = department;
    }

    if (year && year !== "all") {
      query.year = year;
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (isExport) {
      const allStudents = await User.find(query)
        .sort({ createdAt: -1 })
        .lean();

      const headers = ["Name", "Email", "Department", "Academic Year", "Role", "Registered At"];
      const rows = allStudents.map((s) => [
        `"${(s.name || "").replace(/"/g, '""')}"`,
        `"${(s.email || "").replace(/"/g, '""')}"`,
        `"${(s.department || "").replace(/"/g, '""')}"`,
        `"${(s.year || "").replace(/"/g, '""')}"`,
        `"${(s.role || "user")}"`,
        `"${new Date(s.createdAt).toISOString()}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hult-hitk-students-${Date.now()}.csv"`,
        },
      });
    }

    const totalCount = await User.countDocuments(query);
    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Admin students GET API error:", error);
    return NextResponse.json({ error: "Failed to fetch students directory" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { isAuthorizedAdmin } from "@/lib/admin-check";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// GET: Fetch registered student participants with optional search and pagination
export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limitParam = url.searchParams.get("limit");

    await connectDB();

    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);

    let query = User.find(filter, { password: 0 }).sort({ createdAt: -1 });

    if (limitParam) {
      const limit = Math.max(1, Math.min(200, parseInt(limitParam, 10)));
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const students = await query.lean();

    return NextResponse.json(
      {
        participants: students,
        total,
        page,
        totalPages: limitParam ? Math.ceil(total / Math.max(1, parseInt(limitParam, 10))) : 1,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Admin GET participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}

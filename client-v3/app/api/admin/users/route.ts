import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterAdminsOnly = searchParams.get("adminsOnly") === "true";

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (filterAdminsOnly) {
      query.role = { $in: ["junior_admin", "lead_admin", "master_admin"] };
    }

    const users = await User.find(query)
      .select("name email department year role image createdAt")
      .sort({ role: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const isSuper = await isAuthorizedSuperAdmin(req);
    if (!isSuper) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin (Master Admin) clearance required to modify administrative roles" },
        { status: 403 }
      );
    }

    const session = await auth();
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    if (!["user", "junior_admin", "lead_admin", "master_admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "super_admin",
      action: `Modified role for ${user.email} from "${oldRole}" to "${role}"`,
      targetType: "user",
      targetId: userId,
      details: { email: user.email, oldRole, newRole: role },
      req,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

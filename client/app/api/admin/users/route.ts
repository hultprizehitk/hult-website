import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { isAuthorizedSuperAdmin, isSuperAdminEmail, ADMIN_ROLES } from "@/lib/admin-check";
import type { UserRole } from "@/types";

function getRoleLabel(role: string): string {
  switch (role) {
    case "master_admin":
      return "Master Administrator";
    case "lead_admin":
      return "Lead Administrator";
    case "junior_admin":
      return "Junior Administrator";
    default:
      return "Student";
  }
}

// GET: List all administrators and registered students
export async function GET(req: Request) {
  try {
    const isSuper = await isAuthorizedSuperAdmin(req);
    if (!isSuper) {
      return NextResponse.json(
        { error: "Unauthorized: Master Administrator clearance required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Fetch all admins across all 3 tier roles
    const admins = await User.find({
      role: { $in: Array.from(ADMIN_ROLES) },
    })
      .sort({ role: -1, createdAt: -1 })
      .lean();

    // Fetch all registered students for quick appointment
    const allStudents = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      admins: JSON.parse(JSON.stringify(admins)),
      students: JSON.parse(JSON.stringify(allStudents)),
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch administrator records" },
      { status: 500 }
    );
  }
}

// POST: Appoint or update admin role
export async function POST(req: Request) {
  try {
    const isSuper = await isAuthorizedSuperAdmin(req);
    if (!isSuper) {
      return NextResponse.json(
        { error: "Unauthorized: Only Master Administrators can grant or revoke admin privileges" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawEmail = (body.email || "").toLowerCase().trim();
    const action = body.action || "promote"; // "promote" | "demote"
    const requestedRole = (body.role || "lead_admin") as UserRole;

    if (!rawEmail) {
      return NextResponse.json(
        { error: "Please provide a valid college email address" },
        { status: 400 }
      );
    }

    if (!rawEmail.endsWith("@heritageit.edu.in")) {
      return NextResponse.json(
        { error: "Only official @heritageit.edu.in college email addresses are permitted" },
        { status: 400 }
      );
    }

    // Safety: Master Admins in env cannot be demoted
    if (isSuperAdminEmail(rawEmail) && action === "demote") {
      return NextResponse.json(
        { error: "Master Administrator executive accounts are permanent and cannot be demoted" },
        { status: 400 }
      );
    }

    await connectDB();

    const validRoles: UserRole[] = [
      "master_admin",
      "lead_admin",
      "junior_admin",
    ];

    const targetRole: UserRole =
      action === "demote"
        ? "user"
        : validRoles.includes(requestedRole)
        ? requestedRole
        : "lead_admin";

    let user = await User.findOne({ email: rawEmail });

    if (user) {
      // User already registered in DB -> update role directly
      user.role = targetRole;
      await user.save();
    } else {
      // User has not logged in yet -> pre-authorize by creating their account in DB with selected admin role!
      const parsed = parseHeritageEmail(rawEmail);
      user = await User.create({
        name: parsed.fullName || "HITK Appointed Admin",
        email: rawEmail,
        department: parsed.branchName,
        year: parsed.academicYear,
        role: targetRole,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "demote"
          ? `Revoked admin privileges for ${rawEmail}. Role is now user.`
          : `Successfully granted ${getRoleLabel(targetRole)} privileges to ${rawEmail}.`,
      user: JSON.parse(JSON.stringify(user)),
    });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to update administrator role" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { isAuthorizedSuperAdmin, isSuperAdminEmail, ADMIN_ROLES } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import type { UserRole } from "@/types/user";
import { sendAdminInvitationEmail } from "@/lib/email-templates";

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

    const admins = await User.find({
      role: { $in: Array.from(ADMIN_ROLES) },
    })
      .sort({ role: -1, createdAt: -1 })
      .lean();

    const allStudents = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      admins: JSON.parse(JSON.stringify(admins)),
      students: JSON.parse(JSON.stringify(allStudents)),
      users: JSON.parse(JSON.stringify(admins)),
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

    const session = await auth();
    const body = await req.json();
    const rawEmail = (body.email || "").toLowerCase().trim();
    const action = body.action || "promote";
    const requestedRole = (body.role || "lead_admin") as UserRole;
    const isRevoke = action === "demote" || action === "revoke";

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

    if (isSuperAdminEmail(rawEmail) && isRevoke) {
      return NextResponse.json(
        { error: "Master Administrator executive accounts are permanent and cannot be revoked" },
        { status: 400 }
      );
    }

    await connectDB();

    const validRoles: UserRole[] = [
      "master_admin",
      "lead_admin",
      "junior_admin",
    ];

    let user = await User.findOne({ email: rawEmail });

    // Handle RESEND INVITATION
    if (action === "resend_invite") {
      if (!user || user.role === "user") {
        return NextResponse.json(
          { error: "Administrator account not found for this email address" },
          { status: 404 }
        );
      }

      const adminHost = req.headers.get("host") || "";
      const isLocal = adminHost.includes("localhost") || adminHost.includes("127.0.0.1");
      const protocol = isLocal ? "http" : "https";
      const dashboardUrl = isLocal
        ? `${protocol}://${adminHost}`
        : "https://admin.hultprizehitk.live";

      const mailRes = await sendAdminInvitationEmail({
        name: user.name || "Administrator",
        email: rawEmail,
        role: user.role,
        appointedByName: session?.user?.name || "Master Administrator",
        dashboardUrl,
      });

      user.invitedAt = new Date();
      await user.save();

      return NextResponse.json({
        success: true,
        message: mailRes.success
          ? `Resent invitation email to ${rawEmail}.`
          : `Failed to deliver email to ${rawEmail}. Please try again later.`,
        emailSent: mailRes.success,
      });
    }

    const targetRole: UserRole = isRevoke
      ? "user"
      : validRoles.includes(requestedRole)
      ? requestedRole
      : "lead_admin";

    if (user) {
      user.role = targetRole;
      if (!isRevoke) {
        user.invitedAt = new Date();
      }
      await user.save();
    } else {
      if (isRevoke) {
        return NextResponse.json(
          { error: "No administrator found with this email" },
          { status: 404 }
        );
      }
      const parsed = parseHeritageEmail(rawEmail);
      user = await User.create({
        name: parsed.fullName || "HITK Appointed Admin",
        email: rawEmail,
        department: parsed.branchName,
        year: parsed.academicYear,
        role: targetRole,
        invitedAt: new Date(),
      });
    }

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: "master_admin",
      action: `${isRevoke ? "Revoked" : "Granted"} ${getRoleLabel(targetRole)} for ${rawEmail}`,
      targetType: "user",
      targetId: user._id.toString(),
      details: { email: rawEmail, role: targetRole, action },
      req,
    });

    let emailSent = false;
    if (!isRevoke && targetRole !== "user") {
      try {
        const adminHost = req.headers.get("host") || "";
        const isLocal = adminHost.includes("localhost") || adminHost.includes("127.0.0.1");
        const protocol = isLocal ? "http" : "https";
        const dashboardUrl = isLocal
          ? `${protocol}://${adminHost}`
          : "https://admin.hultprizehitk.live";

        const mailRes = await sendAdminInvitationEmail({
          name: user.name || "Administrator",
          email: rawEmail,
          role: targetRole,
          appointedByName: session?.user?.name || "Master Administrator",
          dashboardUrl,
        });
        emailSent = mailRes.success;
      } catch (mailErr) {
        console.error("Failed to send admin invitation email:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: isRevoke
        ? `Successfully revoked administrator access for ${rawEmail}.`
        : `Successfully granted ${getRoleLabel(targetRole)} privileges to ${rawEmail}${
            emailSent ? " and sent onboarding email." : "."
          }`,
      user: JSON.parse(JSON.stringify(user)),
      emailSent,
    });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to update administrator role" },
      { status: 500 }
    );
  }
}

// DELETE: Revoke admin privileges directly
export async function DELETE(req: Request) {
  try {
    const isSuper = await isAuthorizedSuperAdmin(req);
    if (!isSuper) {
      return NextResponse.json(
        { error: "Unauthorized: Master Administrator clearance required to revoke accounts" },
        { status: 403 }
      );
    }

    const session = await auth();
    let rawEmail = "";
    try {
      const body = await req.json();
      rawEmail = (body.email || "").toLowerCase().trim();
    } catch {
      const url = new URL(req.url);
      rawEmail = (url.searchParams.get("email") || "").toLowerCase().trim();
    }

    if (!rawEmail) {
      return NextResponse.json(
        { error: "Please provide the email address to revoke" },
        { status: 400 }
      );
    }

    if (isSuperAdminEmail(rawEmail)) {
      return NextResponse.json(
        { error: "Master Administrator executive accounts are permanent and cannot be revoked" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: rawEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Administrator account not found" },
        { status: 404 }
      );
    }

    const previousRole = user.role;
    user.role = "user";
    await user.save();

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: "master_admin",
      action: `Revoked ${getRoleLabel(previousRole)} privileges for ${rawEmail}`,
      targetType: "user",
      targetId: user._id.toString(),
      details: { email: rawEmail, previousRole, newRole: "user" },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully revoked administrator access for ${rawEmail}.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to revoke administrator role" },
      { status: 500 }
    );
  }
}

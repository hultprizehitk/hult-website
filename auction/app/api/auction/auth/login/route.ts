import { NextRequest, NextResponse } from "next/server";
import { verifyAdminClearance, signAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, accessKey } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your Heritage admin email." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const submittedPassword = (password || accessKey || "").trim();
    const requiredPassword = (process.env.ADMIN_PASSWORD || process.env.ADMIN_ACCESS_KEY || "HULT2026_AUCTION_LEAD").trim();

    if (!submittedPassword) {
      return NextResponse.json(
        { success: false, error: "Please enter the unified admin password." },
        { status: 400 }
      );
    }

    if (submittedPassword !== requiredPassword) {
      return NextResponse.json(
        { success: false, error: "Incorrect admin password." },
        { status: 401 }
      );
    }

    // Live MongoDB + Env Clearance Verification
    const clearance = await verifyAdminClearance(cleanEmail);

    if (!clearance.authorized || !clearance.role) {
      return NextResponse.json(
        {
          success: false,
          error:
            clearance.reason ||
            "Access Denied: Only Lead Administrators and Master Administrators can enter.",
        },
        { status: 403 }
      );
    }

    // Sign 7-day JWT
    const token = signAdminToken({
      email: cleanEmail,
      name: clearance.name,
      role: clearance.role,
    });

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      user: {
        email: cleanEmail,
        name: clearance.name,
        role: clearance.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Authentication error." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { getAuditHistory } from "@/lib/audit-logger";
import { AuditTargetType } from "@/models/AuditLog";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const adminEmail = url.searchParams.get("adminEmail") || undefined;
    const action = url.searchParams.get("action") || undefined;
    const targetType = (url.searchParams.get("targetType") as AuditTargetType) || undefined;
    const targetId = url.searchParams.get("targetId") || undefined;

    const history = await getAuditHistory({
      page,
      limit,
      adminEmail,
      action,
      targetType,
      targetId,
    });

    return NextResponse.json(
      {
        success: true,
        ...history,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/admin/audit-logs error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

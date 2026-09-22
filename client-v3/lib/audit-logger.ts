import { connectDB } from "@/lib/mongodb";
import AuditLog, { AuditTargetType } from "@/models/AuditLog";

export interface LogAuditOptions {
  adminEmail: string;
  adminName?: string;
  adminRole?: string;
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  details?: Record<string, unknown>;
  req?: Request;
}

export async function logAdminAction(options: LogAuditOptions): Promise<void> {
  try {
    await connectDB();

    let ipAddress = "";
    let userAgent = "";

    if (options.req) {
      const forwarded = options.req.headers.get("x-forwarded-for");
      ipAddress = forwarded ? forwarded.split(",")[0].trim() : "";
      userAgent = options.req.headers.get("user-agent") || "";
    }

    await AuditLog.create({
      adminEmail: options.adminEmail.toLowerCase().trim(),
      adminName: options.adminName || "Administrator",
      adminRole: options.adminRole || "admin",
      action: options.action,
      targetType: options.targetType,
      targetId: options.targetId || "",
      details: options.details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to persist admin audit log:", err);
  }
}

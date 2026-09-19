import { connectDB } from "@/lib/mongodb";
import AuditLog, { AuditTargetType, IAuditLog } from "@/models/AuditLog";
import { getClientIp } from "@/lib/rate-limit";
import { auth } from "@/auth";

export interface LogAdminActionOptions {
  req?: Request;
  adminEmail?: string;
  adminName?: string;
  adminRole?: string;
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  details?: Record<string, unknown>;
}

export interface AuditHistoryFilter {
  adminEmail?: string;
  action?: string;
  targetType?: AuditTargetType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Asynchronously logs administrative activities, modifications, and overrides to MongoDB.
 * Non-blocking: will never disrupt primary business logic if database logging encounters an issue.
 */
export async function logAdminAction(options: LogAdminActionOptions): Promise<IAuditLog | null> {
  try {
    let email = options.adminEmail;
    let name = options.adminName || "";
    let role = options.adminRole || "admin";

    // Auto-resolve caller from NextAuth session if not explicitly provided
    if (!email) {
      try {
        const session = await auth();
        if (session?.user?.email) {
          email = session.user.email.toLowerCase().trim();
          name = session.user.name || name;
          role = (session.user as { role?: string }).role || role;
        }
      } catch {
        // Session resolution fallback
      }
    }

    if (!email) {
      email = "system@hultprizehitk.live";
    }

    let ipAddress = "";
    let userAgent = "";

    if (options.req) {
      try {
        ipAddress = getClientIp(options.req);
        userAgent = options.req.headers.get("user-agent") || "";
      } catch {
        // Headers parsing fallback
      }
    }

    await connectDB();

    const entry = await AuditLog.create({
      adminEmail: email.toLowerCase().trim(),
      adminName: name.trim(),
      adminRole: role,
      action: options.action.trim(),
      targetType: options.targetType,
      targetId: options.targetId || "",
      details: options.details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    return entry;
  } catch (err) {
    console.warn("[AuditLogger Warning] Failed to persist admin audit log:", err);
    return null;
  }
}

/**
 * Queries administrative audit logs with pagination and filters.
 */
export async function getAuditHistory(filter: AuditHistoryFilter = {}) {
  await connectDB();

  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(100, Math.max(1, filter.limit || 50));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filter.adminEmail) {
    query.adminEmail = filter.adminEmail.toLowerCase().trim();
  }
  if (filter.action) {
    query.action = filter.action.trim();
  }
  if (filter.targetType) {
    query.targetType = filter.targetType;
  }
  if (filter.targetId) {
    query.targetId = filter.targetId.trim();
  }
  if (filter.startDate || filter.endDate) {
    query.timestamp = {};
    if (filter.startDate) {
      (query.timestamp as Record<string, unknown>)["$gte"] = filter.startDate;
    }
    if (filter.endDate) {
      (query.timestamp as Record<string, unknown>)["$lte"] = filter.endDate;
    }
  }

  const [logs, totalCount] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

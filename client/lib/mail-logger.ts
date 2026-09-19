import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import EmailLog, { EmailCategory, EmailDeliveryStatus, IEmailLog } from "@/models/EmailLog";

export interface LogEmailOptions {
  recipientEmail: string;
  recipientName?: string;
  category: EmailCategory;
  eventId?: string | mongoose.Types.ObjectId;
  subject: string;
  status: EmailDeliveryStatus;
  messageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  sentAt?: Date;
}

export interface DuplicateCheckOptions {
  recipientEmail: string;
  category: EmailCategory;
  eventId?: string | mongoose.Types.ObjectId;
}

/**
 * Persists an email transmission attempt to the EmailLog collection.
 * Catches internal database errors silently with warnings to prevent disrupting callers.
 */
export async function logEmailDispatch(data: LogEmailOptions): Promise<IEmailLog | null> {
  try {
    await connectDB();

    const normalizedEmail = data.recipientEmail.toLowerCase().trim();
    let validEventId: mongoose.Types.ObjectId | undefined = undefined;

    if (data.eventId) {
      if (typeof data.eventId === "string" && mongoose.Types.ObjectId.isValid(data.eventId)) {
        validEventId = new mongoose.Types.ObjectId(data.eventId);
      } else if (data.eventId instanceof mongoose.Types.ObjectId) {
        validEventId = data.eventId;
      }
    }

    const logEntry = await EmailLog.create({
      recipientEmail: normalizedEmail,
      recipientName: data.recipientName ? data.recipientName.trim() : "",
      category: data.category,
      eventId: validEventId,
      subject: data.subject.trim(),
      status: data.status,
      messageId: data.messageId,
      error: data.error,
      metadata: data.metadata || {},
      sentAt: data.sentAt || new Date(),
    });

    return logEntry;
  } catch (err) {
    console.warn("[MailLogger Error] Failed to persist email log:", err);
    return null;
  }
}

/**
 * Checks if a successfully sent email matching the given recipient, category, and event exists.
 * Used for preventing duplicate accidental transmissions.
 */
export async function hasEmailBeenSent(options: DuplicateCheckOptions): Promise<boolean> {
  try {
    await connectDB();

    const normalizedEmail = options.recipientEmail.toLowerCase().trim();
    const query: Record<string, unknown> = {
      recipientEmail: normalizedEmail,
      category: options.category,
      status: "sent",
    };

    if (options.eventId) {
      if (typeof options.eventId === "string" && mongoose.Types.ObjectId.isValid(options.eventId)) {
        query.eventId = new mongoose.Types.ObjectId(options.eventId);
      } else if (options.eventId instanceof mongoose.Types.ObjectId) {
        query.eventId = options.eventId;
      }
    }

    const count = await EmailLog.countDocuments(query);
    return count > 0;
  } catch (err) {
    console.warn("[MailLogger Error] Failed to check duplicate email status:", err);
    return false;
  }
}

/**
 * Retrieves delivery stats and aggregated totals.
 */
export async function getEmailStats(filter?: {
  eventId?: string;
  category?: string;
}) {
  await connectDB();

  const matchQuery: Record<string, unknown> = {};
  if (filter?.eventId && mongoose.Types.ObjectId.isValid(filter.eventId)) {
    matchQuery.eventId = new mongoose.Types.ObjectId(filter.eventId);
  }
  if (filter?.category) {
    matchQuery.category = filter.category;
  }

  const [stats] = await EmailLog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        skipped: { $sum: { $cond: [{ $eq: ["$status", "skipped_duplicate"] }, 1, 0] } },
      },
    },
  ]);

  return {
    total: stats?.total || 0,
    sent: stats?.sent || 0,
    failed: stats?.failed || 0,
    skipped: stats?.skipped || 0,
  };
}

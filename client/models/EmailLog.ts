import mongoose, { Schema, Document, Model } from "mongoose";

export type EmailCategory =
  | "welcome"
  | "registration"
  | "broadcast"
  | "event_update"
  | "reminder"
  | "general";

export type EmailDeliveryStatus = "sent" | "failed" | "skipped_duplicate";

export interface IEmailLog extends Document {
  _id: mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientName?: string;
  category: EmailCategory;
  eventId?: mongoose.Types.ObjectId;
  subject: string;
  status: EmailDeliveryStatus;
  messageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipientEmail: {
      type: String,
      required: [true, "Recipient email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientName: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: ["welcome", "registration", "broadcast", "event_update", "reminder", "general"],
      default: "general",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped_duplicate"],
      required: true,
      index: true,
    },
    messageId: {
      type: String,
      trim: true,
    },
    error: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for deduplication and audit lookups
EmailLogSchema.index({ recipientEmail: 1, category: 1, eventId: 1, status: 1 });
EmailLogSchema.index({ eventId: 1, category: 1, sentAt: -1 });
EmailLogSchema.index({ recipientEmail: 1, sentAt: -1 });

const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);

export default EmailLog;

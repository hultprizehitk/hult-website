import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditTargetType =
  | "content"
  | "team"
  | "event"
  | "rsvp"
  | "broadcast"
  | "user"
  | "general";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminEmail: {
      type: String,
      required: [true, "Admin email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    adminName: {
      type: String,
      trim: true,
      default: "",
    },
    adminRole: {
      type: String,
      trim: true,
      default: "admin",
    },
    action: {
      type: String,
      required: [true, "Action description is required"],
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["content", "team", "event", "rsvp", "broadcast", "user", "general"],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      trim: true,
      default: "",
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ adminEmail: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuctionLog extends Document {
  sessionId: string;
  action: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  lotId: string;
  lotName: string;
  lotType: string;
  amount: number | null;
  detail: string;
}

const AuctionLogSchema = new Schema<IAuctionLog>(
  {
    sessionId: { type: String, default: "live" },
    action: { type: String, required: true },
    actorName: { type: String, default: "Unverified" },
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    teamId: { type: String, default: "" },
    teamName: { type: String, default: "" },
    teamCode: { type: String, default: "" },
    lotId: { type: String, default: "" },
    lotName: { type: String, default: "" },
    lotType: { type: String, default: "" },
    amount: { type: Number, default: null },
    detail: { type: String, default: "" },
  },
  { timestamps: true }
);

AuctionLogSchema.index({ sessionId: 1, createdAt: -1 });
AuctionLogSchema.index({ sessionId: 1, teamCode: 1, createdAt: -1 });

const AuctionLog: Model<IAuctionLog> =
  mongoose.models.AuctionLog ||
  mongoose.model<IAuctionLog>("AuctionLog", AuctionLogSchema);

export default AuctionLog;

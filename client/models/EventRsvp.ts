import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICheckedInMember {
  email: string;
  name: string;
  scannedAt: Date;
}

export interface IEventRsvp extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  teamCode: string;
  teamName: string;
  leadEmail: string;
  rsvpAt: Date;
  rsvpByEmail: string;
  checkedInMembers: ICheckedInMember[];
  checkInStatus: "rsvpd" | "partial" | "fully_checked_in" | "grace_approved" | "absent";
  graceApprovedAt?: Date;
  graceApprovedBy?: string;
  graceNote?: string;
  rsvpDeadline?: Date;
  checkInDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckedInMemberSchema = new Schema<ICheckedInMember>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    scannedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EventRsvpSchema = new Schema<IEventRsvp>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      index: true,
    },
    teamCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    leadEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    rsvpAt: {
      type: Date,
      default: Date.now,
    },
    rsvpByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    checkedInMembers: {
      type: [CheckedInMemberSchema],
      default: [],
    },
    checkInStatus: {
      type: String,
      enum: ["rsvpd", "partial", "fully_checked_in", "grace_approved", "absent"],
      default: "rsvpd",
      index: true,
    },
    graceApprovedAt: {
      type: Date,
    },
    graceApprovedBy: {
      type: String,
      lowercase: true,
      trim: true,
    },
    graceNote: {
      type: String,
      default: "",
    },
    rsvpDeadline: {
      type: Date,
    },
    checkInDeadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so a team can only RSVP once per event
EventRsvpSchema.index({ eventId: 1, teamCode: 1 }, { unique: true });
EventRsvpSchema.index({ eventId: 1, "checkedInMembers.email": 1 });

const EventRsvp: Model<IEventRsvp> =
  mongoose.models.EventRsvp || mongoose.model<IEventRsvp>("EventRsvp", EventRsvpSchema);

export default EventRsvp;

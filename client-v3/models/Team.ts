import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
  joinedAt: Date;
}

export interface ITeamLead {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  roll?: string;
}

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  teamCode: string;
  teamName: string;
  ventureName: string;
  ventureDescription?: string;
  pitchDeckUrl?: string;
  submissionStatus: "forming" | "ready" | "submitted";
  submittedAt?: Date;
  lead: ITeamLead;
  leadEmail: string;
  membersCount: number;
  department: string;
  members: ITeamMember[];
  status: "confirmed" | "disqualified";
  checkedIn: boolean;
  checkedInAt?: Date;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    department: { type: String, default: "General", trim: true },
    roll: { type: String, default: "", trim: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TeamLeadSchema = new Schema<ITeamLead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    department: { type: String, default: "General", trim: true },
    roll: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const TeamSchema = new Schema<ITeam>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Associated event ID is required"],
      index: true,
    },
    teamCode: {
      type: String,
      required: [true, "Team invite code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },
    ventureName: {
      type: String,
      default: "",
      trim: true,
    },
    lead: {
      type: TeamLeadSchema,
      required: true,
    },
    leadEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    membersCount: {
      type: Number,
      default: 4,
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    members: {
      type: [TeamMemberSchema],
      default: [],
    },
    ventureDescription: {
      type: String,
      default: "",
      trim: true,
    },
    pitchDeckUrl: {
      type: String,
      default: "",
      trim: true,
    },
    submissionStatus: {
      type: String,
      enum: ["forming", "ready", "submitted"],
      default: "forming",
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "waitlist", "disqualified"],
      default: "confirmed",
      index: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkedInAt: {
      type: Date,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ eventId: 1, "members.email": 1 });
TeamSchema.index({ eventId: 1, leadEmail: 1 });
TeamSchema.index({ eventId: 1, teamName: 1 });

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export default Team;

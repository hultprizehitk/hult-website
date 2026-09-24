import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember {
  name: string;
  email?: string;
  department?: string;
  phone?: string;
  roll?: string;
  joinedAt?: Date;
  checkedIn?: boolean;
  checkedInAt?: Date;
}

export interface IRegisteredTeam {
  id: string;
  teamCode?: string;
  teamName: string;
  ventureName?: string;
  ventureDescription?: string;
  pitchDeckUrl?: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  membersCount: number;
  department: string;
  members?: ITeamMember[];
  registeredAt: Date;
  status: "confirmed" | "disqualified";
  submissionStatus?: "forming" | "ready" | "submitted";
  submittedAt?: Date;
  leadCheckedIn?: boolean;
  leadCheckedInAt?: Date;
  checkedIn?: boolean;
  checkedInAt?: Date;
}

export interface IEventRound {
  roundNumber: number;
  title: string;
  type: string;
  description: string;
  details?: string[];
}

export interface IEventRuleCategory {
  title: string;
  items: string[];
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  tag: string;
  date: string;
  startDate?: string;
  endDate?: string;
  venue: string;
  description: string;
  link?: string;
  isPublished: boolean;
  order: number;
  registrationStatus: "open" | "closed" | "extended" | "upcoming";
  registrationDeadline?: string;
  maxTeams: number;
  minTeamMembers: number;
  maxTeamMembers: number;
  registeredTeamsCount: number;
  registeredTeams: IRegisteredTeam[];
  rounds?: IEventRound[];
  rules?: IEventRuleCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    tag: {
      type: String,
      default: "Flagship",
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Event date and time is required"],
      trim: true,
    },
    startDate: {
      type: String,
      default: "",
      trim: true,
    },
    endDate: {
      type: String,
      default: "",
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    registrationStatus: {
      type: String,
      enum: ["open", "closed", "extended", "upcoming"],
      default: "open",
    },
    registrationDeadline: {
      type: String,
      default: "",
    },
    maxTeams: {
      type: Number,
      default: 40,
    },
    minTeamMembers: {
      type: Number,
      default: 3,
    },
    maxTeamMembers: {
      type: Number,
      default: 5,
    },
    registeredTeamsCount: {
      type: Number,
      default: 0,
    },
    registeredTeams: [
      {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        teamCode: { type: String, default: "" },
        teamName: { type: String, required: true },
        ventureName: { type: String, default: "" },
        leadName: { type: String, required: true },
        leadEmail: { type: String, required: true },
        leadPhone: { type: String, default: "" },
        membersCount: { type: Number, default: 4 },
        department: { type: String, default: "General" },
        members: [
          {
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            department: { type: String, default: "" },
            phone: { type: String, default: "" },
            roll: { type: String, default: "" },
            joinedAt: { type: Date, default: Date.now },
            checkedIn: { type: Boolean, default: false },
            checkedInAt: { type: Date },
          },
        ],
        registeredAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["confirmed", "pending", "waitlist", "disqualified"], default: "confirmed" },
        ventureDescription: { type: String, default: "" },
        pitchDeckUrl: { type: String, default: "" },
        submissionStatus: { type: String, enum: ["forming", "ready", "submitted"], default: "forming" },
        submittedAt: { type: Date },
        leadCheckedIn: { type: Boolean, default: false },
        leadCheckedInAt: { type: Date },
        checkedIn: { type: Boolean, default: false },
        checkedInAt: { type: Date },
      },
    ],
    rounds: [
      {
        roundNumber: { type: Number },
        title: { type: String, trim: true },
        type: { type: String, trim: true },
        description: { type: String, trim: true },
        details: [{ type: String, trim: true }],
      },
    ],
    rules: [
      {
        title: { type: String, trim: true },
        items: [{ type: String, trim: true }],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;

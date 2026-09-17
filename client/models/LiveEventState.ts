import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchedulePhase {
  id: string;
  time: string;
  title: string;
  location: string;
  status: "completed" | "active" | "upcoming";
}

export interface IPitchTeam {
  id: string;
  order: number;
  name: string;
  venture: string;
  department: string;
  lead: string;
  membersCount: number;
  status: "completed" | "on_stage" | "on_deck" | "pending";
  juryScoreStatus: string;
}

export interface ILiveAttendee {
  id: string;
  name: string;
  email: string;
  department: string;
  roll: string;
  checkedIn: boolean;
  checkInTime?: string;
}

export interface ILiveEventState extends Document {
  eventId: string;
  timerSeconds: number;
  timerRunning: boolean;
  activePreset: "pitch" | "qa" | "transition";
  phases: ISchedulePhase[];
  teams: IPitchTeam[];
  attendees: ILiveAttendee[];
  updatedAt: Date;
}

const LiveEventStateSchema = new Schema<ILiveEventState>(
  {
    eventId: {
      type: String,
      default: "flagship_live",
      unique: true,
      index: true,
    },
    timerSeconds: {
      type: Number,
      default: 360,
    },
    timerRunning: {
      type: Boolean,
      default: false,
    },
    activePreset: {
      type: String,
      enum: ["pitch", "qa", "transition"],
      default: "pitch",
    },
    phases: {
      type: [
        {
          id: String,
          time: String,
          title: String,
          location: String,
          status: {
            type: String,
            enum: ["completed", "active", "upcoming"],
            default: "upcoming",
          },
        },
      ],
      default: [],
    },
    teams: {
      type: [
        {
          id: String,
          order: Number,
          name: String,
          venture: String,
          department: String,
          lead: String,
          membersCount: Number,
          status: {
            type: String,
            enum: ["completed", "on_stage", "on_deck", "pending"],
            default: "pending",
          },
          juryScoreStatus: {
            type: String,
            default: "Pending Review",
          },
        },
      ],
      default: [],
    },
    attendees: {
      type: [
        {
          id: String,
          name: String,
          email: String,
          department: String,
          roll: String,
          checkedIn: Boolean,
          checkInTime: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const LiveEventState: Model<ILiveEventState> =
  mongoose.models.LiveEventState ||
  mongoose.model<ILiveEventState>("LiveEventState", LiveEventStateSchema);

export default LiveEventState;

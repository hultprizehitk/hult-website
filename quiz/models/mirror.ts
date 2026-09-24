import mongoose, { Schema, type Model, type Types } from "mongoose";

// READ-ONLY mirrors of client-v3 collections. Only scripts/seed-dev.ts may write through these.
// Field names must match client-v3/models/{User,Team,Event}.ts.

export interface MirrorUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: "user" | "junior_admin" | "lead_admin" | "master_admin";
}

export interface MirrorPerson {
  name: string;
  email: string;
}

export interface MirrorTeam {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  teamCode: string;
  teamName: string;
  lead: MirrorPerson;
  leadEmail: string;
  members: MirrorPerson[];
  status: "confirmed" | "disqualified";
  submissionStatus?: "forming" | "ready" | "submitted";
}

export interface MirrorEvent {
  _id: Types.ObjectId;
  title: string;
  date: string;
  venue: string;
}

const person = new Schema<MirrorPerson>({ name: String, email: String }, { _id: false });

const UserSchema = new Schema<MirrorUser>(
  { name: String, email: { type: String, lowercase: true }, role: String },
  { collection: "users", strict: false, timestamps: true },
);

const TeamSchema = new Schema<MirrorTeam>(
  {
    eventId: { type: Schema.Types.ObjectId, index: true },
    teamCode: String,
    teamName: String,
    lead: person,
    leadEmail: { type: String, lowercase: true },
    members: [person],
    status: String,
    submissionStatus: String,
  },
  { collection: "teams", strict: false, timestamps: true },
);

const EventSchema = new Schema<MirrorEvent>(
  { title: String, date: String, venue: String },
  { collection: "events", strict: false, timestamps: true },
);

export const User: Model<MirrorUser> = mongoose.models.User ?? mongoose.model<MirrorUser>("User", UserSchema);
export const Team: Model<MirrorTeam> = mongoose.models.Team ?? mongoose.model<MirrorTeam>("Team", TeamSchema);
export const Event: Model<MirrorEvent> = mongoose.models.Event ?? mongoose.model<MirrorEvent>("Event", EventSchema);

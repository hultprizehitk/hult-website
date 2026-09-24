import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface QuizSessionDoc {
  _id: Types.ObjectId;
  code: string;
  title: string;
  eventId: Types.ObjectId;
  status: "draft" | "lobby" | "live" | "ended";
  checkinOpen: boolean;
  requireSubmitted: boolean;
  currentIndex: number;
  phase: "idle" | "question" | "reveal" | "leaderboard";
  questionOpenedAt: Date | null;
  questionClosesAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  stateVersion: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestionDoc {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  order: number;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  timeLimitSec: number;
}

export interface QuizTeamDoc {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  teamId: Types.ObjectId;
  teamName: string;
  teamCode: string;
  leadEmail: string;
  members: { name: string; email: string }[];
  memberEmails: string[];
  checkedInAt: Date;
  checkedInBy: string;
  takerEmail: string;
  deviceId: string | null;
  deviceBoundAt: Date | null;
}

export interface QuizAnswerDoc {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  teamId: Types.ObjectId;
  questionId: Types.ObjectId;
  questionIndex: number;
  takerEmail: string;
  optionIndex: number;
  isCorrect: boolean;
  pointsAwarded: number;
  responseMs: number;
  answeredAt: Date;
}

const QuizSessionSchema = new Schema<QuizSessionDoc>(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    eventId: { type: Schema.Types.ObjectId, required: true, index: true },
    status: { type: String, enum: ["draft", "lobby", "live", "ended"], default: "draft" },
    checkinOpen: { type: Boolean, default: false },
    requireSubmitted: { type: Boolean, default: true },
    currentIndex: { type: Number, default: -1 },
    phase: { type: String, enum: ["idle", "question", "reveal", "leaderboard"], default: "idle" },
    questionOpenedAt: { type: Date, default: null },
    questionClosesAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    stateVersion: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
  },
  { collection: "quizsessions", timestamps: true },
);

const QuizQuestionSchema = new Schema<QuizQuestionDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, required: true },
    order: { type: Number, required: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    points: { type: Number, default: 100 },
    timeLimitSec: { type: Number, default: 20 },
  },
  { collection: "quizquestions", timestamps: true },
);
QuizQuestionSchema.index({ sessionId: 1, order: 1 });

const QuizTeamSchema = new Schema<QuizTeamDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, required: true },
    teamId: { type: Schema.Types.ObjectId, required: true },
    teamName: String,
    teamCode: String,
    leadEmail: { type: String, lowercase: true },
    members: [{ _id: false, name: String, email: String }],
    memberEmails: { type: [String], index: true },
    checkedInAt: Date,
    checkedInBy: String,
    takerEmail: { type: String, lowercase: true },
    deviceId: { type: String, default: null },
    deviceBoundAt: { type: Date, default: null },
  },
  { collection: "quizteams", timestamps: true },
);
QuizTeamSchema.index({ sessionId: 1, teamId: 1 }, { unique: true });

const QuizAnswerSchema = new Schema<QuizAnswerDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, required: true },
    teamId: { type: Schema.Types.ObjectId, required: true },
    questionId: { type: Schema.Types.ObjectId, required: true },
    questionIndex: Number,
    takerEmail: String,
    optionIndex: Number,
    isCorrect: Boolean,
    pointsAwarded: Number,
    responseMs: Number,
    answeredAt: Date,
  },
  { collection: "quizanswers", timestamps: true },
);
QuizAnswerSchema.index({ sessionId: 1, teamId: 1, questionId: 1 }, { unique: true });
QuizAnswerSchema.index({ sessionId: 1, questionId: 1 });

export const QuizSession: Model<QuizSessionDoc> =
  mongoose.models.QuizSession ?? mongoose.model<QuizSessionDoc>("QuizSession", QuizSessionSchema);
export const QuizQuestion: Model<QuizQuestionDoc> =
  mongoose.models.QuizQuestion ?? mongoose.model<QuizQuestionDoc>("QuizQuestion", QuizQuestionSchema);
export const QuizTeam: Model<QuizTeamDoc> =
  mongoose.models.QuizTeam ?? mongoose.model<QuizTeamDoc>("QuizTeam", QuizTeamSchema);
export const QuizAnswer: Model<QuizAnswerDoc> =
  mongoose.models.QuizAnswer ?? mongoose.model<QuizAnswerDoc>("QuizAnswer", QuizAnswerSchema);

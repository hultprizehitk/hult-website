import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuctionTeam {
  teamId: string;
  teamName: string;
  teamCode: string;
  quizRank: number;
  startingBudget: number;
  currentBalance: number;
  ownedIndustries: string[];
  ownedState: string | null;
  status: "active" | "disqualified";
  disqualificationReason?: string;
}

export interface IAuctionLot {
  lotId: string;
  name: string;
  type: "industry" | "state";
  basePrice: number;
  status: "unsold" | "sold";
  winningTeamId?: string | null;
  winningTeamName?: string | null;
  soldPrice?: number | null;
  soldAt?: Date | null;
}

export interface IAuctionHistory {
  lotId: string;
  lotName: string;
  type: "industry" | "state";
  teamId: string;
  teamName: string;
  price: number;
  timestamp: Date;
}

export interface ILastSoldLot {
  lotId: string;
  name: string;
  type: "industry" | "state";
  winningTeamId: string;
  winningTeamName: string;
  price: number;
  soldAt: Date;
}

export interface IAuctionSession extends Document {
  sessionId: string;
  currentRound: "setup" | "round1" | "intermission" | "round2" | "results";
  activeLotId: string | null;
  stageMode: "auto" | "spotlight" | "sold" | "board" | "matrix" | "stage";
  viewerMode: "stage" | "ledger" | "matrix";
  lastSoldLot?: ILastSoldLot | null;
  matrixRevealed: boolean;
  teams: IAuctionTeam[];
  lots: IAuctionLot[];
  history: IAuctionHistory[];
  reAuctionVotes: Map<string, string[]>;
  updatedAt: Date;
  createdAt: Date;
}

const AuctionTeamSchema = new Schema<IAuctionTeam>(
  {
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    teamCode: { type: String, required: true },
    quizRank: { type: Number, required: true, default: 1 },
    startingBudget: { type: Number, default: 200 },
    currentBalance: { type: Number, default: 200 },
    ownedIndustries: { type: [String], default: [] },
    ownedState: { type: String, default: null },
    status: { type: String, enum: ["active", "disqualified"], default: "active" },
    disqualificationReason: { type: String, default: "" },
  },
  { _id: false }
);

const AuctionLotSchema = new Schema<IAuctionLot>(
  {
    lotId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["industry", "state"], required: true },
    basePrice: { type: Number, required: true },
    status: { type: String, enum: ["unsold", "sold"], default: "unsold" },
    winningTeamId: { type: String, default: null },
    winningTeamName: { type: String, default: null },
    soldPrice: { type: Number, default: null },
    soldAt: { type: Date, default: null },
  },
  { _id: false }
);

const AuctionHistorySchema = new Schema<IAuctionHistory>(
  {
    lotId: { type: String, required: true },
    lotName: { type: String, required: true },
    type: { type: String, enum: ["industry", "state"], required: true },
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    price: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LastSoldLotSchema = new Schema<ILastSoldLot>(
  {
    lotId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["industry", "state"], required: true },
    winningTeamId: { type: String, required: true },
    winningTeamName: { type: String, required: true },
    price: { type: Number, required: true },
    soldAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AuctionSessionSchema = new Schema<IAuctionSession>(
  {
    sessionId: { type: String, required: true, unique: true, default: "live" },
    currentRound: {
      type: String,
      enum: ["setup", "round1", "intermission", "round2", "results"],
      default: "setup",
    },
    activeLotId: { type: String, default: null },
    stageMode: {
      type: String,
      enum: ["auto", "spotlight", "sold", "board", "matrix"],
      default: "auto",
    },
    viewerMode: {
      type: String,
      enum: ["stage", "ledger", "matrix"],
      default: "stage",
    },
    lastSoldLot: { type: LastSoldLotSchema, default: null },
    matrixRevealed: { type: Boolean, default: false },
    teams: { type: [AuctionTeamSchema], default: [] },
    lots: { type: [AuctionLotSchema], default: [] },
    history: { type: [AuctionHistorySchema], default: [] },
    reAuctionVotes: {
      type: Map,
      of: [String],
      default: {},
    },
  },
  { timestamps: true }
);

const AuctionSession: Model<IAuctionSession> =
  mongoose.models.AuctionSession ||
  mongoose.model<IAuctionSession>("AuctionSession", AuctionSessionSchema);

export default AuctionSession;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  avatarId?: string;
  archetype?: string;
  xp?: number;
  level?: number;
  lookingForTeam?: boolean;
  desiredRole?: string;
  bio?: string;
  department: string;
  year: string;
  role:
    | "user"
    | "junior_admin"
    | "lead_admin"
    | "master_admin";
  welcomeEmailSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      default: "",
    },
    avatarId: {
      type: String,
      default: "visionary-ceo",
    },
    archetype: {
      type: String,
      default: "Visionary Leader",
    },
    xp: {
      type: Number,
      default: 150,
    },
    level: {
      type: Number,
      default: 1,
    },
    lookingForTeam: {
      type: Boolean,
      default: false,
    },
    desiredRole: {
      type: String,
      default: "Co-Founder",
    },
    bio: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    year: {
      type: String,
      default: "1st Year",
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "user",
        "junior_admin",
        "lead_admin",
        "master_admin",
      ],
      default: "user",
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compiling model in Next.js hot-reloads
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

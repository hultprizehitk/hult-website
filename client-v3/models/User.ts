import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/types/user";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  department: string;
  year: string;
  phone?: string;
  roll?: string;
  role: UserRole;
  welcomeEmailSent?: boolean;
  whatsappInviteSent?: boolean;
  whatsappInviteSentAt?: Date;
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
    image: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "General Engineering",
      trim: true,
    },
    year: {
      type: String,
      default: "1st Year",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    roll: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "junior_admin", "lead_admin", "master_admin"],
      default: "user",
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    whatsappInviteSent: {
      type: Boolean,
      default: false,
    },
    whatsappInviteSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compiling model in Next.js hot-reloads
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

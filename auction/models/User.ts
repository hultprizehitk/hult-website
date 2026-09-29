import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  department?: string;
  year?: string;
  role: "user" | "junior_admin" | "lead_admin" | "master_admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "General Engineering",
    },
    year: {
      type: String,
      default: "1st Year",
    },
    role: {
      type: String,
      enum: ["user", "junior_admin", "lead_admin", "master_admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    collection: "users", // explicitly map to existing users collection
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

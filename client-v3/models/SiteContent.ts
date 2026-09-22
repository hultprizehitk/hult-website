import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteContent extends Document {
  _id: mongoose.Types.ObjectId;
  contentType: "committee" | "announcement" | "sponsor" | "faq";
  title: string;
  subtitle?: string;
  category: string;
  description?: string;
  image?: string;
  links?: {
    linkedin?: string;
    github?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  badge?: string;
  accentColor?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SiteContentSchema = new Schema<ISiteContent>(
  {
    contentType: {
      type: String,
      enum: ["committee", "announcement", "sponsor", "faq"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    links: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    badge: {
      type: String,
      default: "",
      trim: true,
    },
    accentColor: {
      type: String,
      default: "#f20089",
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SiteContentSchema.index({ contentType: 1, isActive: 1, order: 1 });

const SiteContent: Model<ISiteContent> =
  mongoose.models.SiteContent ||
  mongoose.model<ISiteContent>("SiteContent", SiteContentSchema);

export default SiteContent;

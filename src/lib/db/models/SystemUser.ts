import mongoose, { Schema, Document } from "mongoose";

export interface ISystemUser extends Document {
  name: string;
  email: string;
  password: string;
  isSuperAdmin: boolean;
  permissions: {
    section: string;
    permission: "none" | "readonly" | "full";
  }[];
  sessions: {
    _id: mongoose.Types.ObjectId;
    device: string;
    browser: string;
    lastActivity: Date;
    createdAt: Date;
  }[];
  lastLogin?: Date;
  createdAt: Date;
}

const SECTIONS = [
  "employees","storage","history","points",
  "customers","problems","finance","documents","settings","fieldwork",
];

const SystemUserSchema = new Schema<ISystemUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isSuperAdmin: { type: Boolean, default: false },
    permissions: [
      {
        section: { type: String, enum: SECTIONS },
        permission: {
          type: String,
          enum: ["none", "readonly", "full"],
          default: "none",
        },
      },
    ],
    sessions: [
      {
        device: String,
        browser: String,
        lastActivity: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastLogin: Date,
  },
  { timestamps: true }
);

export default mongoose.models.SystemUser ||
  mongoose.model<ISystemUser>("SystemUser", SystemUserSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface ISystemUser extends Document {
  name: string;
  username: string;
  email?: string;
  password: string;
  isSuperAdmin: boolean;
  permissions: {
    section: string;
    permission: "none" | "readonly" | "full";
    /** Fine-grained overrides: action name → allowed. When set for an action,
     *  it beats the section level; missing actions fall back to the level. */
    actions?: Map<string, boolean>;
  }[];
  /** Per-user sidebar customization: order + label overrides, keyed by href */
  sidebarPrefs: {
    key: string;
    order: number;
    label?: string;
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
    // Login identifier. sparse so pre-username users don't collide on null.
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email: { type: String, unique: true, sparse: true },
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
        actions: { type: Map, of: Boolean, default: undefined },
      },
    ],
    sidebarPrefs: [
      {
        key: { type: String, required: true },
        order: { type: Number, default: 0 },
        label: String,
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

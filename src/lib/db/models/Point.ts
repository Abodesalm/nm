import mongoose, { Schema, Document } from "mongoose";

export interface IPoint extends Document {
  point_number: number;
  name: string;
  mainRegion: string;
  region: string;
  location: { address: string; lat: number; lng: number };
  providerPoint?: mongoose.Types.ObjectId | null;
  childPoints: mongoose.Types.ObjectId[];
  employees: mongoose.Types.ObjectId[];
  equipment: { itemId: mongoose.Types.ObjectId; quantity: number }[];
  switches: number;
  totalPorts: number;
  usedPorts: number;
  freePorts: number;
  captivePortal: { hasRouter: boolean };
  status: "online" | "offline" | "maintenance";
  notes?: string;
}

const PointSchema = new Schema<IPoint>(
  {
    point_number: { type: Number, required: true },
    name: { type: String, required: true },
    mainRegion: { type: String, required: true },
    region: { type: String, required: true },
    location: {
      address: { type: String, default: "" },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    providerPoint: { type: Schema.Types.ObjectId, ref: "Point", default: null },
    childPoints: [{ type: Schema.Types.ObjectId, ref: "Point" }],
    employees: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    equipment: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "StorageItem" },
        quantity: { type: Number, default: 0 },
      },
    ],
    switches: { type: Number, default: 1 },
    totalPorts: { type: Number, default: 6 },
    usedPorts: { type: Number, default: 0 },
    freePorts: { type: Number, default: 6 },
    captivePortal: { hasRouter: { type: Boolean, default: false } },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "offline",
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Point ||
  mongoose.model<IPoint>("Point", PointSchema);

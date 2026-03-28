import mongoose, { Schema, Document } from "mongoose";

export type FieldWorkStatus = "not_arrived" | "free" | "working" | "finished";

export interface IFieldWorkLog extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  status: FieldWorkStatus;
  arrivedAt: string | null; // "HH:MM" format
  currentNote: string;
  statusHistory: {
    _id?: mongoose.Types.ObjectId;
    status: FieldWorkStatus;
    note: string;
    changedAt: Date;
    changedBy: string;
  }[];
}

const FieldWorkLogSchema = new Schema<IFieldWorkLog>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["not_arrived", "free", "working", "finished"],
      default: "not_arrived",
    },
    arrivedAt: { type: String, default: null },
    currentNote: { type: String, default: "" },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["not_arrived", "free", "working", "finished"],
          required: true,
        },
        note: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

FieldWorkLogSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.models.FieldWorkLog ||
  mongoose.model<IFieldWorkLog>("FieldWorkLog", FieldWorkLogSchema);

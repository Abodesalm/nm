import mongoose, { Schema, Document } from "mongoose";

export interface IHistory extends Document {
  section: string;
  type: string;
  performedBy: mongoose.Types.ObjectId;
  employee?: mongoose.Types.ObjectId | null;
  item?: mongoose.Types.ObjectId | null;
  point?: mongoose.Types.ObjectId | null;
  customer?: mongoose.Types.ObjectId | null;
  relatedId?: mongoose.Types.ObjectId | null;
  quantity?: number | null;
  goal_model?: string | null;
  goal_id?: mongoose.Types.ObjectId | null;
  notes?: string | null;
  date: Date;
}

const HistorySchema = new Schema<IHistory>({
  section: {
    type: String,
    enum: ["employees","storage","points","customers","problems","finance","documents"],
    required: true,
  },
  type: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: "SystemUser", required: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  item: { type: Schema.Types.ObjectId, ref: "StorageItem", default: null },
  point: { type: Schema.Types.ObjectId, ref: "Point", default: null },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  relatedId: { type: Schema.Types.ObjectId, default: null },
  quantity: { type: Number, default: null },
  goal_model: { type: String, default: null },
  goal_id: { type: Schema.Types.ObjectId, default: null },
  notes: { type: String, default: null },
  date: { type: Date, default: Date.now },
});

export default mongoose.models.History ||
  mongoose.model<IHistory>("History", HistorySchema);

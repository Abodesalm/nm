import mongoose, { Schema, Document } from "mongoose";

export interface IStorageItem extends Document {
  name: string;
  category: string;
  unit: string;
  minQuantity: number;
  cost: { USD: number; SP: number; exchange: number };
  notes?: string;
  isHidden: boolean;
  status: "in-stock" | "low-stock" | "out-of-stock";
  currentQuantity: number;
  borrowedQuantity: number;
  actions: {
    _id: mongoose.Types.ObjectId;
    type: "stock_in" | "stock_out" | "consume" | "borrow" | "return";
    quantity: number;
    employee?: mongoose.Types.ObjectId;
    goal_model?: "customers" | "points" | "employees" | null;
    goal_id?: mongoose.Types.ObjectId | null;
    notes?: string;
    date: Date;
  }[];
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const StorageItemSchema = new Schema<IStorageItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    minQuantity: { type: Number, default: 0 },
    cost: MoneySchema,
    notes: String,
    isHidden: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "out-of-stock",
    },
    currentQuantity: { type: Number, default: 0 },
    borrowedQuantity: { type: Number, default: 0 },
    actions: [
      {
        type: {
          type: String,
          enum: ["stock_in", "stock_out", "consume", "borrow", "return"],
          required: true,
        },
        quantity: { type: Number, required: true },
        employee: { type: Schema.Types.ObjectId, ref: "Employee" },
        goal_model: {
          type: String,
          enum: ["customers", "points", "employees", null],
          default: null,
        },
        goal_id: { type: Schema.Types.ObjectId, default: null },
        notes: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.StorageItem ||
  mongoose.model<IStorageItem>("StorageItem", StorageItemSchema);

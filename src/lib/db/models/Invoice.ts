import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  invoiceNumber: number;
  type: "salary" | "subscription" | "storage_action";
  category: "cost" | "earn";
  employee?: mongoose.Types.ObjectId | null;
  customer?: mongoose.Types.ObjectId | null;
  storageItem?: mongoose.Types.ObjectId | null;
  relatedId: mongoose.Types.ObjectId;
  amount: { USD: number; SP: number; exchange: number };
  description: string;
  notes?: string;
  date: Date;
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: Number, required: true, unique: true },
    type: {
      type: String,
      enum: ["salary", "subscription", "storage_action"],
      required: true,
    },
    category: {
      type: String,
      enum: ["cost", "earn"],
      required: true,
    },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    storageItem: { type: Schema.Types.ObjectId, ref: "StorageItem", default: null },
    relatedId: { type: Schema.Types.ObjectId, required: true },
    amount: MoneySchema,
    description: { type: String, required: true },
    notes: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

try { mongoose.deleteModel("Invoice"); } catch {}
export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);

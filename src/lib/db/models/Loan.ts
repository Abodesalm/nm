import mongoose, { Schema, Document } from "mongoose";

/**
 * قرض/دين على مستوى الشركة (ليس سلف الموظفين):
 * - direction "on_us"  = دين علينا (نحن مدينون لطرف خارجي)
 * - direction "for_us" = دين لنا (طرف خارجي مدين لنا)
 * Payments settle the loan gradually; remaining = amount − Σ payments.
 * affectsTreasury marks whether the loan origin itself moved real cash
 * (a cash loan) or not (e.g. buying storage items on credit).
 */
export interface ILoan extends Document {
  direction: "on_us" | "for_us";
  party: string;
  amount: { USD: number; SP: number; exchange: number };
  payments: {
    _id: mongoose.Types.ObjectId;
    amount: { USD: number; SP: number; exchange: number };
    notes?: string;
    date: Date;
  }[];
  status: "open" | "paid";
  affectsTreasury: boolean;
  relatedStorageItem?: mongoose.Types.ObjectId | null;
  relatedActionId?: mongoose.Types.ObjectId | null;
  notes?: string;
  date: Date;
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const LoanSchema = new Schema<ILoan>(
  {
    direction: { type: String, enum: ["on_us", "for_us"], required: true },
    party: { type: String, required: true },
    amount: MoneySchema,
    payments: [
      {
        amount: MoneySchema,
        notes: String,
        date: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["open", "paid"], default: "open" },
    affectsTreasury: { type: Boolean, default: false },
    relatedStorageItem: {
      type: Schema.Types.ObjectId,
      ref: "StorageItem",
      default: null,
    },
    relatedActionId: { type: Schema.Types.ObjectId, default: null },
    notes: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LoanSchema.index({ direction: 1, status: 1 });
LoanSchema.index({ relatedActionId: 1 });

// Delete cached model so schema changes are picked up on hot reload
try { mongoose.deleteModel("Loan"); } catch {}
export default mongoose.model<ILoan>("Loan", LoanSchema);

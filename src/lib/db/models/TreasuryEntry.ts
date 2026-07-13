import mongoose, { Schema, Document } from "mongoose";

/**
 * حركة خزينة — a single real-money movement in/out of the company box.
 * The treasury balance is NEVER stored; it is always derived by summing
 * all entries (deposits − withdrawals) per currency, MyMoney-style.
 */
export interface ITreasuryEntry extends Document {
  type: "deposit" | "withdraw";
  source: "manual" | "invoice" | "loan";
  amount: { USD: number; SP: number; exchange: number };
  description: string;
  notes?: string;
  relatedInvoice?: mongoose.Types.ObjectId | null;
  relatedLoan?: mongoose.Types.ObjectId | null;
  date: Date;
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const TreasuryEntrySchema = new Schema<ITreasuryEntry>(
  {
    type: { type: String, enum: ["deposit", "withdraw"], required: true },
    source: {
      type: String,
      enum: ["manual", "invoice", "loan"],
      default: "manual",
    },
    amount: MoneySchema,
    description: { type: String, required: true },
    notes: String,
    relatedInvoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    relatedLoan: { type: Schema.Types.ObjectId, ref: "Loan", default: null },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TreasuryEntrySchema.index({ date: -1 });
TreasuryEntrySchema.index({ relatedInvoice: 1 });
TreasuryEntrySchema.index({ relatedLoan: 1 });

// Delete cached model so schema changes are picked up on hot reload
try { mongoose.deleteModel("TreasuryEntry"); } catch {}
export default mongoose.model<ITreasuryEntry>(
  "TreasuryEntry",
  TreasuryEntrySchema
);

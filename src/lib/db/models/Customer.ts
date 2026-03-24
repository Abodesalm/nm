import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  customer_number: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  point: mongoose.Types.ObjectId;
  pppoe: { username: string; password: string };
  currentPack: {
    isCustom: boolean;
    packId?: mongoose.Types.ObjectId | null;
    downloadSpeed: number;
    uploadSpeed: number;
    price: { USD: number; SP: number; exchange: number };
  };
  status: "active" | "waiting" | "suspended" | "inactive";
  notes?: string;
  joinDate: Date;
  isDeleted: boolean;
  subscriptions: {
    _id: mongoose.Types.ObjectId;
    month: number;
    year: number;
    pack: {
      isCustom: boolean;
      packId?: mongoose.Types.ObjectId | null;
      downloadSpeed: number;
      uploadSpeed: number;
      price: { USD: number; SP: number; exchange: number };
    };
    amount: { USD: number; SP: number; exchange: number };
    discount: {
      enabled: boolean;
      amount: { USD: number; SP: number; exchange: number };
    };
    finalAmount: { USD: number; SP: number; exchange: number };
    paidAt: Date;
    notes?: string;
  }[];
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const PackInfoSchema = new Schema({
  isCustom: { type: Boolean, default: false },
  packId: { type: Schema.Types.ObjectId, default: null },
  downloadSpeed: { type: Number, default: 0 },
  uploadSpeed: { type: Number, default: 0 },
  price: MoneySchema,
});

const CustomerSchema = new Schema<ICustomer>(
  {
    customer_number: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: { type: String, default: "" },
    point: { type: Schema.Types.ObjectId, ref: "Point", required: true },
    pppoe: {
      username: { type: String, required: true },
      password: { type: String, required: true },
    },
    currentPack: PackInfoSchema,
    status: {
      type: String,
      enum: ["active", "waiting", "suspended", "inactive"],
      default: "waiting",
    },
    notes: String,
    joinDate: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    subscriptions: [
      {
        month: Number,
        year: Number,
        pack: PackInfoSchema,
        amount: MoneySchema,
        discount: {
          enabled: { type: Boolean, default: false },
          amount: MoneySchema,
        },
        finalAmount: MoneySchema,
        paidAt: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

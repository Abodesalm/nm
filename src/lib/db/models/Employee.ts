import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  id_num: number;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  photo?: string;
  cv?: string;
  role: string;
  department: string;
  salary: { USD: number; SP: number; exchange: number };
  state: "active" | "inactive" | "on-leave";
  notes?: string;
  absents: {
    _id: mongoose.Types.ObjectId;
    date: Date;
    isAbsent: boolean;
    excused: boolean;
    reason?: string;
    note?: string;
    createdAt: Date;
  }[];
  salaries: {
    _id: mongoose.Types.ObjectId;
    month: number;
    year: number;
    amount: { USD: number; SP: number; exchange: number };
    reward: { USD: number; SP: number; exchange: number };
    notes?: string;
    paidAt: Date;
  }[];
  loans: {
    _id: mongoose.Types.ObjectId;
    amount: { USD: number; SP: number; exchange: number };
    state: "paid" | "unpaid";
    notes?: string;
    createdAt: Date;
  }[];
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const EmployeeSchema = new Schema<IEmployee>(
  {
    id_num: { type: Number, required: true, unique: true },
    fullName: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
    photo: String,
    cv: String,
    role: { type: String, required: true },
    department: { type: String, required: true },
    salary: MoneySchema,
    state: {
      type: String,
      enum: ["active", "inactive", "on-leave"],
      default: "active",
    },
    notes: String,
    absents: [
      {
        date: Date,
        isAbsent: { type: Boolean, default: true },
        excused: { type: Boolean, default: false },
        reason: String,
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    salaries: [
      {
        month: Number,
        year: Number,
        amount: MoneySchema,
        reward: MoneySchema,
        notes: String,
        paidAt: { type: Date, default: Date.now },
      },
    ],
    loans: [
      {
        amount: MoneySchema,
        state: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
        notes: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Employee ||
  mongoose.model<IEmployee>("Employee", EmployeeSchema);

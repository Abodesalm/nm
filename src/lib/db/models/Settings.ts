import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  defaultExchangeRate: number;
  autoSuspendDay: number;
  systemName: string;
  /** ساعات الدوام القياسية — a fieldwork day longer than this is flagged overtime */
  standardWorkHours: number;
  /** Weekend days (JS getDay(): 0=Sunday … 5=Friday, 6=Saturday) — skipped by auto absence detection */
  weekendDays: number[];
  departments: { _id: mongoose.Types.ObjectId; name: string }[];
  roles: { _id: mongoose.Types.ObjectId; name: string }[];
  funds: { _id: mongoose.Types.ObjectId; name: string }[];
  mainRegions: { _id: mongoose.Types.ObjectId; name: string }[];
  regions: {
    _id: mongoose.Types.ObjectId;
    name: string;
    mainRegion: string;
    mikrotik: { ip: string; port: number; username: string; password: string };
  }[];
  packs: {
    _id: mongoose.Types.ObjectId;
    name: string;
    downloadSpeed: number;
    uploadSpeed: number;
    price: { USD: number; SP: number; exchange: number };
  }[];
}

const MoneySchema = new Schema({
  USD: { type: Number, default: 0 },
  SP: { type: Number, default: 0 },
  exchange: { type: Number, default: 0 },
});

const SettingsSchema = new Schema<ISettings>({
  defaultExchangeRate: { type: Number, default: 15000 },
  autoSuspendDay: { type: Number, default: 7 },
  systemName: { type: String, default: "NM System" },
  standardWorkHours: { type: Number, default: 8 },
  weekendDays: { type: [Number], default: [5] },
  departments: [{ name: String }],
  roles: [{ name: String }],
  funds: [{ name: String }],
  mainRegions: [{ name: String }],
  regions: [
    {
      name: String,
      mainRegion: String,
      mikrotik: {
        ip: String,
        port: { type: Number, default: 8728 },
        username: String,
        password: String,
      },
    },
  ],
  packs: [
    {
      name: String,
      downloadSpeed: Number,
      uploadSpeed: Number,
      price: MoneySchema,
    },
  ],
});

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

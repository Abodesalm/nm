import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import TreasuryEntry from "@/lib/db/models/TreasuryEntry";
import Settings from "@/lib/db/models/Settings";
import { permissionGuard, ok, err } from "@/lib/api-factory";

interface Sums {
  depositSP: number;
  depositUSD: number;
  withdrawSP: number;
  withdrawUSD: number;
  count: number;
}

const emptySums = (): Sums => ({
  depositSP: 0,
  depositUSD: 0,
  withdrawSP: 0,
  withdrawUSD: 0,
  count: 0,
});

function foldRows(rows: any[]): Map<string, Sums> {
  const map = new Map<string, Sums>();
  for (const r of rows) {
    const key = r._id.category ? String(r._id.category) : "none";
    const sums = map.get(key) ?? emptySums();
    if (r._id.type === "deposit") {
      sums.depositSP += r.SP;
      sums.depositUSD += r.USD;
    } else {
      sums.withdrawSP += r.SP;
      sums.withdrawUSD += r.USD;
    }
    sums.count += r.count;
    map.set(key, sums);
  }
  return map;
}

// GET — صناديق stats: lifetime + selected-month sums and records per category
export async function GET(req: NextRequest) {
  const denied = await permissionGuard("finance", "readonly", "view");
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const groupStage = {
      $group: {
        _id: { category: "$category", type: "$type" },
        SP: { $sum: "$amount.SP" },
        USD: { $sum: "$amount.USD" },
        count: { $sum: 1 },
      },
    };

    const [settings, lifetimeRows, monthlyRows, monthEntries] =
      await Promise.all([
        Settings.findOne().lean<any>(),
        TreasuryEntry.aggregate([groupStage]),
        TreasuryEntry.aggregate([
          { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
          groupStage,
        ]),
        TreasuryEntry.find({ date: { $gte: monthStart, $lt: monthEnd } })
          .sort({ date: -1, createdAt: -1 })
          .lean(),
      ]);

    const funds: { _id: any; name: string }[] = settings?.funds ?? [];
    const lifetime = foldRows(lifetimeRows);
    const monthly = foldRows(monthlyRows);

    const categories = [
      ...funds.map((f) => ({ id: String(f._id), name: f.name })),
      { id: "none", name: "بدون صندوق" },
    ].map((c) => ({
      category: c.id,
      name: c.name,
      lifetime: lifetime.get(c.id) ?? emptySums(),
      monthly: monthly.get(c.id) ?? emptySums(),
      entries: monthEntries.filter((e: any) =>
        c.id === "none" ? !e.category : String(e.category) === c.id,
      ),
    }));

    return ok({ month, year, funds, categories });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

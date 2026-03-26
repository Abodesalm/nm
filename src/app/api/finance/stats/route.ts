import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Invoice from "@/lib/db/models/Invoice";
import { permissionGuard, ok, err } from "@/lib/api-factory";

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);
  return { $gte: start, $lt: end };
}

function emptyMoney() { return { USD: 0, SP: 0 }; }

function sumByCategory(docs: any[]) {
  const result: Record<string, { USD: number; SP: number }> = {
    costs: emptyMoney(),
    earns: emptyMoney(),
  };
  for (const doc of docs) {
    const key = doc.category === "earn" ? "earns" : "costs";
    result[key].USD += doc.amount?.USD ?? 0;
    result[key].SP  += doc.amount?.SP  ?? 0;
  }
  return result;
}

function sumByType(docs: any[]) {
  const result: Record<string, { USD: number; SP: number }> = {
    salary:         emptyMoney(),
    subscription:   emptyMoney(),
    storage_action: emptyMoney(),
  };
  for (const doc of docs) {
    const t = doc.type as string;
    if (result[t]) {
      result[t].USD += doc.amount?.USD ?? 0;
      result[t].SP  += doc.amount?.SP  ?? 0;
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("finance", "readonly");
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const now   = new Date();
    const year  = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
    const month = now.getMonth() + 1; // 1-based

    // Previous month (wrap to December of previous year if needed)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    // Current & previous month invoices
    const [currentDocs, prevDocs] = await Promise.all([
      Invoice.find({ date: monthRange(year, month) }).lean(),
      Invoice.find({ date: monthRange(prevYear, prevMonth) }).lean(),
    ]);

    const currentSummary = sumByCategory(currentDocs);
    const prevSummary    = sumByCategory(prevDocs);
    const currentByType  = sumByType(currentDocs);
    const prevByType     = sumByType(prevDocs);

    // Chart: 12 monthly totals for the requested year
    const yearDocs = await Invoice.find({
      date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
    }).lean();

    const chart = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthDocs = yearDocs.filter((d: any) => {
        const d2 = new Date(d.date);
        return d2.getFullYear() === year && d2.getMonth() + 1 === m;
      });
      const costs = monthDocs
        .filter((d: any) => d.category === "cost")
        .reduce((s: number, d: any) => s + (d.amount?.USD ?? 0), 0);
      const earns = monthDocs
        .filter((d: any) => d.category === "earn")
        .reduce((s: number, d: any) => s + (d.amount?.USD ?? 0), 0);
      return { month: m, label: ARABIC_MONTHS[i], costs, earns };
    });

    return ok({
      currentMonth: currentSummary,
      prevMonth:    prevSummary,
      byType: { current: currentByType, prev: prevByType },
      chart,
      meta: { year, month },
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

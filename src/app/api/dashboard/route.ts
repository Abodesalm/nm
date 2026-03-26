import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import Customer from "@/lib/db/models/Customer";
import Point from "@/lib/db/models/Point";
import StorageItem from "@/lib/db/models/StorageItem";
import History from "@/lib/db/models/History";
import { ok, err } from "@/lib/api-factory";

export async function GET() {
  try {
    await connectDB();

    const [empStats, custStats, pointStats, storStats, recentLogs] =
      await Promise.all([
        Employee.aggregate([{ $group: { _id: "$state", count: { $sum: 1 } } }]),
        Customer.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Point.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        StorageItem.aggregate([
          { $match: { isHidden: false } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        History.find()
          .sort({ date: -1 })
          .limit(8)
          .populate("performedBy", "name")
          .lean(),
      ]);

    const toMap = (arr: { _id: string | null; count: number }[]) =>
      Object.fromEntries(arr.map(({ _id, count }) => [_id ?? "unknown", count]));
    const sum = (obj: Record<string, number>) =>
      Object.values(obj).reduce((a, b) => a + b, 0);

    const emp  = toMap(empStats);
    const cust = toMap(custStats);
    const pts  = toMap(pointStats);
    const stor = toMap(storStats);

    return ok({
      employees: {
        total:   sum(emp),
        active:  emp.active   ?? 0,
        inactive: emp.inactive ?? 0,
        onLeave: emp["on-leave"] ?? 0,
      },
      customers: {
        total:     sum(cust),
        active:    cust.active    ?? 0,
        waiting:   cust.waiting   ?? 0,
        suspended: cust.suspended ?? 0,
        inactive:  cust.inactive  ?? 0,
      },
      points: {
        total:       sum(pts),
        online:      pts.online      ?? 0,
        offline:     pts.offline     ?? 0,
        maintenance: pts.maintenance ?? 0,
      },
      storage: {
        total:       sum(stor),
        inStock:     stor["in-stock"]    ?? 0,
        lowStock:    stor["low-stock"]   ?? 0,
        outOfStock:  stor["out-of-stock"] ?? 0,
      },
      recentLogs,
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Invoice from "@/lib/db/models/Invoice";
import "@/lib/db/models/Employee";
import "@/lib/db/models/Customer";
import "@/lib/db/models/StorageItem";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("finance", "readonly");
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = parseInt(searchParams.get("page")     ?? "1");
    const limit    = parseInt(searchParams.get("limit")    ?? "10");
    const type     = searchParams.get("type")     ?? "";
    const category = searchParams.get("category") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo   = searchParams.get("dateTo")   ?? "";
    const search   = searchParams.get("search")   ?? "";
    const sortField  = searchParams.get("sortField")  ?? "date";
    const sortOrder  = searchParams.get("sortOrder")  ?? "desc";

    const query: Record<string, any> = {};
    if (type)     query.type     = type;
    if (category) query.category = category;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo)   query.date.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
    }
    if (search) {
      const num = parseInt(search);
      if (!isNaN(num)) {
        query.$or = [
          { invoiceNumber: num },
          { description: { $regex: search, $options: "i" } },
        ];
      } else {
        query.description = { $regex: search, $options: "i" };
      }
    }

    const sortDir = sortOrder === "asc" ? 1 : -1;
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate("employee",    "fullName id_num")
      .populate("customer",    "name customer_number")
      .populate("storageItem", "name")
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return ok({ invoices, total, page, limit });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

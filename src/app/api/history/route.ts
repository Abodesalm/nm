import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import History from "@/lib/db/models/History";
// Import all models so Mongoose registers them before populate
import "@/lib/db/models/Employee";
import "@/lib/db/models/StorageItem";
import "@/lib/db/models/Point";
import "@/lib/db/models/Customer";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("history", "readonly", "view");
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") ?? "";
    const type = searchParams.get("type") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const employeeId = searchParams.get("employee") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const query: Record<string, any> = {};
    if (section) query.section = section;
    if (type) query.type = type;
    if (employeeId) query.employee = employeeId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo)
        query.date.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
    }

    const total = await History.countDocuments(query);
    const logs = await History.find(query)
      .populate("performedBy", "name email")
      .populate("employee", "fullName id_num")
      .populate("item", "name")
      .populate("point", "name point_number")
      .populate("customer", "name customer_number")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return ok({ logs, total, page, limit });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// History is a read-only audit trail — logs are never deletable. Deleting
// the SOURCE record (a salary, a storage action, ...) still cascades its own
// log entry via that record's own delete route; there is no manual "delete
// log" feature here on purpose.

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import History from "@/lib/db/models/History";
import Employee from "@/lib/db/models/Employee";
import StorageItem from "@/lib/db/models/StorageItem";
// Import all models so Mongoose registers them before populate
import "@/lib/db/models/Point";
import "@/lib/db/models/Customer";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("history", "readonly");
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

export async function DELETE(req: NextRequest) {
  const denied = await permissionGuard("history", "full");
  if (denied) return denied;
  try {
    await connectDB();
    const { id } = await req.json();

    const log = await History.findById(id);
    if (!log) return err("السجل غير موجود", 404);

    if (log.type === "salary_added" && log.employee && log.relatedId) {
      await Employee.findByIdAndUpdate(log.employee, {
        $pull: { salaries: { _id: log.relatedId } },
      });
    }

    if (log.type === "loan_added" && log.employee && log.relatedId) {
      await Employee.findByIdAndUpdate(log.employee, {
        $pull: { loans: { _id: log.relatedId } },
      });
    }

    if (
      ["stock_in", "stock_out", "consume", "borrow", "return"].includes(
        log.type,
      ) &&
      log.item &&
      log.relatedId
    ) {
      const item = await StorageItem.findById(log.item);
      if (item) {
        item.actions = item.actions.filter(
          (a: any) => a._id.toString() !== log.relatedId.toString(),
        );
        let current = 0,
          borrowed = 0;
        for (const a of item.actions) {
          if (a.type === "stock_in" || a.type === "return")
            current += a.quantity;
          if (
            a.type === "stock_out" ||
            a.type === "consume" ||
            a.type === "borrow"
          )
            current -= a.quantity;
          if (a.type === "borrow") borrowed += a.quantity;
          if (a.type === "return") borrowed -= a.quantity;
        }
        item.currentQuantity = Math.max(0, current);
        item.borrowedQuantity = Math.max(0, borrowed);
        item.status =
          item.currentQuantity === 0
            ? "out-of-stock"
            : item.currentQuantity <= item.minQuantity
              ? "low-stock"
              : "in-stock";
        await item.save();
      }
    }

    await History.findByIdAndDelete(id);
    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

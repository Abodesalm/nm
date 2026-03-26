import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Customer from "@/lib/db/models/Customer";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("customers", "readonly");
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const point = searchParams.get("point") ?? "";
    const status = searchParams.get("status") ?? "";
    const search = searchParams.get("search") ?? "";
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");

    const query: Record<string, any> = { isDeleted: { $ne: true } };
    if (point) query.point = point;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const total = await Customer.countDocuments(query);
    const docs = await Customer.find(query)
      .sort({ customer_number: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("point", "point_number name");

    return ok({ docs, total, page, limit });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

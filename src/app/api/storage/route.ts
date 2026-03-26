import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("storage", "readonly");
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const status = searchParams.get("status") ?? "";
    const showHidden = searchParams.get("hidden") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const sortBy = searchParams.get("sortBy") ?? "name";
    const sortDir = searchParams.get("sortDir") ?? "asc";

    const query: Record<string, any> = {};
    if (!showHidden) query.isHidden = { $ne: true };
    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (status) query.status = status;

    const sortMap: Record<string, string> = {
      name: "name",
      currentQuantity: "currentQuantity",
      status: "status",
    };
    const sortField = sortMap[sortBy] ?? "name";
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortDir === "asc" ? 1 : -1,
    };

    const total = await StorageItem.countDocuments(query);
    const items = await StorageItem.find(query)
      .select("-actions")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // Get distinct categories
    const categories = await StorageItem.distinct("category");

    return ok({ items, total, page, limit, categories });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await permissionGuard("storage", "full");
  if (denied) return denied;
  try {
    await connectDB();
    const body = await req.json();
    const item = await StorageItem.create({
      ...body,
      currentQuantity: 0,
      borrowedQuantity: 0,
      status: "out-of-stock",
    });
    return ok(item, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

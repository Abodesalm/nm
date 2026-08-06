import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import { ok, err } from "@/lib/api-factory";
import {
  addStorageActionToItem,
  deleteStorageActionFromItem,
  requireDirectionAccess,
  requireDeletableToday,
  isIncreasingAction,
  ApiError,
  INCREASING_TYPES,
  DECREASING_TYPES,
} from "@/lib/storageActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * سجل حركات المخزون — every action across every item, with filters.
 * Built with an aggregation pipeline since actions live as StorageItem
 * subdocuments, not their own collection.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawDirection = searchParams.get("direction");
  const direction: "in" | "out" | null =
    rawDirection === "in" || rawDirection === "out" ? rawDirection : null;

  const denied = await requireDirectionAccess(direction);
  if (denied) return denied;

  try {
    await connectDB();

    const itemId = searchParams.get("item") ?? "";
    const employeeId = searchParams.get("employee") ?? "";
    const typesParam = searchParams.get("types") ?? ""; // comma-separated
    const month = searchParams.get("month") ?? "";
    const year = searchParams.get("year") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const minQty = searchParams.get("minQty") ?? "";
    const maxQty = searchParams.get("maxQty") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const pipeline: any[] = [];

    if (itemId && mongoose.isValidObjectId(itemId)) {
      pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(itemId) } });
    }

    pipeline.push({ $unwind: "$actions" });

    // Every condition is ANDed via this array so the direction lock (when
    // present) always wins over any client-supplied type list — a دخل page
    // can never surface خرج actions no matter what `types` the client sends.
    const conditions: Record<string, any>[] = [];

    if (direction === "in") {
      conditions.push({
        $or: [
          { "actions.type": { $in: INCREASING_TYPES } },
          { "actions.type": "other", "actions.flowDirection": "in" },
        ],
      });
    } else if (direction === "out") {
      conditions.push({
        $or: [
          { "actions.type": { $in: DECREASING_TYPES } },
          { "actions.type": "other", "actions.flowDirection": "out" },
        ],
      });
    }

    const types = typesParam
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (types.length) conditions.push({ "actions.type": { $in: types } });

    if (employeeId && mongoose.isValidObjectId(employeeId)) {
      conditions.push({
        "actions.employee": new mongoose.Types.ObjectId(employeeId),
      });
    }

    const qty: Record<string, number> = {};
    if (minQty) qty.$gte = Number(minQty);
    if (maxQty) qty.$lte = Number(maxQty);
    if (Object.keys(qty).length) conditions.push({ "actions.quantity": qty });

    // A specific month wins over an explicit start/end range
    if (month && year) {
      const y = Number(year);
      const m = Number(month);
      conditions.push({
        "actions.date": { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) },
      });
    } else if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = new Date(dateFrom);
      if (dateTo) range.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
      conditions.push({ "actions.date": range });
    }

    if (conditions.length) pipeline.push({ $match: { $and: conditions } });

    pipeline.push(
      {
        $lookup: {
          from: "employees",
          localField: "actions.employee",
          foreignField: "_id",
          as: "employeeDoc",
        },
      },
      { $unwind: { path: "$employeeDoc", preserveNullAndEmptyArrays: true } },
      { $sort: { "actions.date": -1, "actions._id": -1 } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: "$actions._id",
                type: "$actions.type",
                quantity: "$actions.quantity",
                notes: "$actions.notes",
                cost: "$actions.cost",
                gain: "$actions.gain",
                flowDirection: "$actions.flowDirection",
                date: "$actions.date",
                goal_model: "$actions.goal_model",
                goal_id: "$actions.goal_id",
                employee: {
                  $cond: [
                    { $ifNull: ["$employeeDoc", false] },
                    {
                      _id: "$employeeDoc._id",
                      fullName: "$employeeDoc.fullName",
                      id_num: "$employeeDoc.id_num",
                    },
                    null,
                  ],
                },
                item: { _id: "$_id", name: "$name", unit: "$unit", category: "$category" },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    );

    const [result] = await StorageItem.aggregate(pipeline);
    const rows = result?.data ?? [];
    const total = result?.totalCount?.[0]?.count ?? 0;

    return ok({ actions: rows, total, page, limit });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// POST — add an action to any item (body.storageItem selects the target).
// body.direction, when present, means this came from a locked دخل/خرج page:
// it gates the permission AND is enforced server-side (never trusted blindly).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const direction: "in" | "out" | null =
    body.direction === "in" || body.direction === "out" ? body.direction : null;

  const denied = await requireDirectionAccess(direction);
  if (denied) return denied;
  try {
    await connectDB();
    if (!body.storageItem) return err("العنصر مطلوب");
    const session = await getServerSession(authOptions);

    const { item } = await addStorageActionToItem(
      body.storageItem,
      body,
      (session?.user as any)?.id,
      { enforceDirection: direction ?? undefined },
    );
    return ok(item);
  } catch (e: any) {
    return err(e.message, e instanceof ApiError ? e.status : 500);
  }
}

// DELETE — remove an action from its item (same cascade as the item profile).
// The permission check is based on the action's OWN, server-determined
// direction — never on whatever the client claims — so this can't be
// bypassed by simply omitting `direction` from the request body.
export async function DELETE(req: NextRequest) {
  const { storageItem, actionId } = await req.json();
  if (!storageItem || !actionId) return err("العنصر والحركة مطلوبان");

  try {
    await connectDB();
    const item = await StorageItem.findById(storageItem);
    if (!item) return err("العنصر غير موجود", 404);
    const action = item.actions.find((a: any) => a._id.toString() === actionId);
    if (!action) return err("الحركة غير موجودة", 404);

    const actualDirection: "in" | "out" = isIncreasingAction(action)
      ? "in"
      : "out";
    const denied = await requireDirectionAccess(actualDirection);
    if (denied) return denied;

    const tooOld = await requireDeletableToday(action);
    if (tooOld) return tooOld;

    const session = await getServerSession(authOptions);
    const { item: updated } = await deleteStorageActionFromItem(
      storageItem,
      actionId,
      (session?.user as any)?.id,
    );
    return ok(updated);
  } catch (e: any) {
    return err(e.message, e instanceof ApiError ? e.status : 500);
  }
}

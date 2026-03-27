import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import History from "@/lib/db/models/History";
import Point from "@/lib/db/models/Point";
import Invoice from "@/lib/db/models/Invoice";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function recalcQuantities(actions: any[]) {
  let current = 0;
  let borrowed = 0;
  for (const a of actions) {
    if (a.type === "stock_in" || a.type === "return") current += a.quantity;
    if (a.type === "stock_out" || a.type === "consume" || a.type === "borrow")
      current -= a.quantity;
    if (a.type === "borrow") borrowed += a.quantity;
    if (a.type === "return") borrowed -= a.quantity;
  }
  return { current: Math.max(0, current), borrowed: Math.max(0, borrowed) };
}

function calcStatus(current: number, min: number) {
  if (current === 0) return "out-of-stock";
  if (current <= min) return "low-stock";
  return "in-stock";
}

/** Upsert quantity for an item in a point's equipment array */
async function addToPointEquipment(pointId: string, itemId: string, quantity: number) {
  const result = await Point.updateOne(
    { _id: pointId, "equipment.itemId": itemId },
    { $inc: { "equipment.$.quantity": quantity } },
  );
  if (result.matchedCount === 0) {
    await Point.findByIdAndUpdate(pointId, {
      $push: { equipment: { itemId, quantity } },
    });
  }
}

/** Decrement quantity for an item in a point's equipment array, removing if ≤ 0 */
async function removeFromPointEquipment(pointId: string, itemId: string, quantity: number) {
  await Point.updateOne(
    { _id: pointId, "equipment.itemId": itemId },
    { $inc: { "equipment.$.quantity": -quantity } },
  );
  await Point.updateOne(
    { _id: pointId },
    { $pull: { equipment: { quantity: { $lte: 0 } } } },
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    const item = await StorageItem.findById(id);
    if (!item) return err("العنصر غير موجود", 404);

    item.actions.push(body);
    const { current, borrowed } = recalcQuantities(item.actions);
    item.currentQuantity = current;
    item.borrowedQuantity = borrowed;
    item.status = calcStatus(current, item.minQuantity);
    await item.save();

    const newAction = item.actions[item.actions.length - 1];

    // Sync to point equipment if this action targets a point
    if (body.goal_model === "points" && body.goal_id) {
      await addToPointEquipment(body.goal_id, id, body.quantity);
    }

    // History log
    await History.create({
      section: "storage",
      type: body.type,
      performedBy: (session?.user as any)?.id,
      item: id,
      point: body.goal_model === "points" ? body.goal_id : null,
      relatedId: newAction._id,
      quantity: body.quantity,
      goal_model: body.goal_model ?? null,
      goal_id: body.goal_id ?? null,
      notes: body.cost?.USD
        ? [body.notes, `التكلفة: $${body.cost.USD} / ${body.cost.SP?.toLocaleString("en")} ل.س`]
            .filter(Boolean)
            .join(" — ")
        : body.notes ?? null,
      date: body.date ?? new Date(),
    });

    // Create invoice if this action has a cost
    if (body.cost && (body.cost.USD || body.cost.SP)) {
      const lastInvoice = await Invoice.findOne({}, { invoiceNumber: 1 }).sort({ invoiceNumber: -1 }).lean();
      await Invoice.create({
        invoiceNumber: (lastInvoice?.invoiceNumber ?? 0) + 1,
        type: "storage_action",
        category: "cost",
        storageItem: id,
        relatedId: newAction._id,
        amount: body.cost,
        description: `تكلفة ${item.name} — ${body.type}`,
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : new Date(),
      });
    }

    return ok(item);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const { actionId } = await req.json();

    const item = await StorageItem.findById(id);
    if (!item) return err("العنصر غير موجود", 404);

    // Find the action before removing it (need goal_model/goal_id/quantity)
    const action = item.actions.find((a: any) => a._id.toString() === actionId);

    item.actions = item.actions.filter(
      (a: any) => a._id.toString() !== actionId,
    );
    const { current, borrowed } = recalcQuantities(item.actions);
    item.currentQuantity = current;
    item.borrowedQuantity = borrowed;
    item.status = calcStatus(current, item.minQuantity);
    await item.save();

    // Reverse point equipment sync
    if (action?.goal_model === "points" && action?.goal_id) {
      await removeFromPointEquipment(String(action.goal_id), id, action.quantity);
    }

    // Delete history log and invoice
    await History.deleteOne({ relatedId: actionId });
    await Invoice.deleteOne({ relatedId: actionId });

    return ok(item);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

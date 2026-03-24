import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import History from "@/lib/db/models/History";
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

    // Add action
    item.actions.push(body);
    const { current, borrowed } = recalcQuantities(item.actions);
    item.currentQuantity = current;
    item.borrowedQuantity = borrowed;
    item.status = calcStatus(current, item.minQuantity);
    await item.save();

    const newAction = item.actions[item.actions.length - 1];

    // Create history log
    await History.create({
      section: "storage",
      type: body.type,
      performedBy: (session?.user as any)?.id,
      item: id,
      relatedId: newAction._id,
      quantity: body.quantity,
      goal_model: body.goal_model ?? null,
      goal_id: body.goal_id ?? null,
      notes: body.notes ?? null,
      date: body.date ?? new Date(),
    });

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

    item.actions = item.actions.filter(
      (a: any) => a._id.toString() !== actionId,
    );
    const { current, borrowed } = recalcQuantities(item.actions);
    item.currentQuantity = current;
    item.borrowedQuantity = borrowed;
    item.status = calcStatus(current, item.minQuantity);
    await item.save();

    // Delete history log
    await History.deleteOne({ relatedId: actionId });

    return ok(item);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

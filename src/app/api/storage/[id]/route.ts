import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "readonly");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const item = await StorageItem.findById(id)
      .populate("actions.employee", "fullName id_num")
      .populate("actions.goal_id");
    if (!item) return err("العنصر غير موجود", 404);
    return ok(item);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();
    const item = await StorageItem.findByIdAndUpdate(id, body, { new: true });
    if (!item) return err("العنصر غير موجود", 404);
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
    const item = await StorageItem.findByIdAndDelete(id);
    if (!item) return err("العنصر غير موجود", 404);
    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

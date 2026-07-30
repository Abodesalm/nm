import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import { ok, err } from "@/lib/api-factory";
import {
  deleteStorageActionFromItem,
  requireDirectionAccess,
  isIncreasingAction,
  ApiError,
} from "@/lib/storageActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Actions are added ONLY from the دخل/خرج pages (api/storage/actions POST,
// direction-gated). There is intentionally no POST here — adding an action
// per-item would bypass the income_access/outcome_access permission split.

// DELETE — the permission check is based on the action's OWN,
// server-determined direction (not a generic "can delete actions" flag),
// so deleting from the item profile respects the exact same دخل/خرج
// isolation as deleting from the log pages — a user granted only خرج
// access cannot delete a دخل action here either.
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await connectDB();
    const { actionId } = await req.json();

    const item = await StorageItem.findById(id);
    if (!item) return err("العنصر غير موجود", 404);
    const action = item.actions.find((a: any) => a._id.toString() === actionId);
    if (!action) return err("الحركة غير موجودة", 404);

    const actualDirection: "in" | "out" = isIncreasingAction(action)
      ? "in"
      : "out";
    const denied = await requireDirectionAccess(actualDirection);
    if (denied) return denied;

    const session = await getServerSession(authOptions);
    const { item: updated } = await deleteStorageActionFromItem(
      id,
      actionId,
      (session?.user as any)?.id,
    );
    return ok(updated);
  } catch (e: any) {
    return err(e.message, e instanceof ApiError ? e.status : 500);
  }
}

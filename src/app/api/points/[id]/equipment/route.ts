import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Point from "@/lib/db/models/Point";
import { permissionGuard, ok, err } from "@/lib/api-factory";

/**
 * DELETE /api/points/[id]/equipment
 * Body: { itemId: string }
 *
 * Removes an item from the point's equipment list ONLY.
 * Does NOT touch storage actions or history — use storage action DELETE for full cascade.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("points", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const { itemId } = await req.json();

    const point = await Point.findById(id);
    if (!point) return err("النقطة غير موجودة", 404);

    await Point.findByIdAndUpdate(id, {
      $pull: { equipment: { itemId } },
    });

    return ok({ removed: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

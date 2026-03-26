import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Point from "@/lib/db/models/Point";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("points", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const { status } = await req.json();

    if (!["online", "offline", "maintenance"].includes(status))
      return err("حالة غير صالحة", 400);

    const point = await Point.findByIdAndUpdate(id, { status }, { new: true });
    if (!point) return err("النقطة غير موجودة", 404);

    return ok(point);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

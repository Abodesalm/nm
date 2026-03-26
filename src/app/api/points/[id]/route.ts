import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Point from "@/lib/db/models/Point";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Customer from "@/lib/db/models/Customer";
import "@/lib/db/models/StorageItem";
import "@/lib/db/models/Employee";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("points", "readonly");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const point = await Point.findById(id)
      .populate("providerPoint", "point_number name status region mainRegion")
      .populate(
        "childPoints",
        "point_number name status switches totalPorts usedPorts freePorts",
      )
      .populate("employees", "fullName id_num phone")
      .populate("equipment.itemId", "name unit category");
    if (!point) return err("النقطة غير موجودة", 404);

    // Live port calculation (customers + childPoints + provider connection)
    const customersCount = await Customer.countDocuments({
      point: id,
      isDeleted: { $ne: true },
    });
    const obj       = point.toObject();
    const liveUsed  = (obj.childPoints?.length ?? 0) + customersCount + (obj.providerPoint ? 1 : 0);
    const liveFree  = Math.max(0, obj.totalPorts - liveUsed);

    // Persist corrected values if they drifted
    if (obj.usedPorts !== liveUsed || obj.freePorts !== liveFree) {
      await Point.findByIdAndUpdate(id, { usedPorts: liveUsed, freePorts: liveFree });
    }

    return ok({ ...obj, usedPorts: liveUsed, freePorts: liveFree, customersCount });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("points", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();

    const point = await Point.findById(id);
    if (!point) return err("النقطة غير موجودة", 404);

    // Handle provider point change
    if (
      body.providerPoint !== undefined &&
      String(body.providerPoint) !== String(point.providerPoint)
    ) {
      // Remove from old provider
      if (point.providerPoint) {
        await Point.findByIdAndUpdate(point.providerPoint, {
          $pull: { childPoints: point._id },
          $inc: { usedPorts: -1 },
        });
        const oldProvider = await Point.findById(point.providerPoint);
        if (oldProvider) {
          await Point.findByIdAndUpdate(point.providerPoint, {
            freePorts: oldProvider.totalPorts - oldProvider.usedPorts,
          });
        }
      }
      // Add to new provider
      if (body.providerPoint) {
        const newProvider = await Point.findById(body.providerPoint);
        if (!newProvider) return err("نقطة المزود الجديدة غير موجودة", 400);
        if (newProvider.childPoints.length >= 4)
          return err("نقطة المزود وصلت للحد الأقصى (4 نقاط فرعية)", 400);
        await Point.findByIdAndUpdate(body.providerPoint, {
          $push: { childPoints: point._id },
          $inc: { usedPorts: 1 },
        });
        const updatedProvider = await Point.findById(body.providerPoint);
        if (updatedProvider) {
          await Point.findByIdAndUpdate(body.providerPoint, {
            freePorts: updatedProvider.totalPorts - updatedProvider.usedPorts,
          });
        }
      }
    }

    // Recalculate ports if switches changed
    if (body.switches !== undefined && body.switches !== point.switches) {
      const sw = body.switches;
      body.totalPorts = sw > 1 ? sw * 8 - (sw - 1) * 2 : 8;
    }

    const updated = await Point.findByIdAndUpdate(id, body, { new: true })
      .populate("providerPoint", "point_number name status")
      .populate("childPoints", "point_number name status")
      .populate("employees", "fullName id_num");

    // Recalculate freePorts
    if (updated) {
      await Point.findByIdAndUpdate(id, {
        freePorts: updated.totalPorts - updated.usedPorts,
      });
    }

    return ok(updated);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("points", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const session = await getServerSession(authOptions);

    const point = await Point.findById(id);
    if (!point) return err("النقطة غير موجودة", 404);

    // Cannot delete if has children
    if (point.childPoints.length > 0)
      return err("لا يمكن حذف النقطة لأنها تحتوي على نقاط فرعية", 400);

    // Cannot delete if has customers
    const customersCount = await Customer.countDocuments({
      point: id,
      isDeleted: { $ne: true },
    });
    if (customersCount > 0)
      return err("لا يمكن حذف النقطة لأنها تحتوي على زبائن", 400);

    // Remove from provider's childPoints
    if (point.providerPoint) {
      await Point.findByIdAndUpdate(point.providerPoint, {
        $pull: { childPoints: point._id },
        $inc: { usedPorts: -1 },
      });
      const provider = await Point.findById(point.providerPoint);
      if (provider) {
        await Point.findByIdAndUpdate(point.providerPoint, {
          freePorts: provider.totalPorts - provider.usedPorts,
        });
      }
    }

    await Point.findByIdAndDelete(id);

    // History log (non-critical)
    const deletedBy = (session?.user as any)?.id ?? (session?.user as any)?._id;
    if (deletedBy) {
      await History.create({
        section: "points",
        type: "point_deleted",
        performedBy: deletedBy,
        notes: `تم حذف النقطة: ${point.name || `#${point.point_number}`}`,
        date: new Date(),
      });
    }

    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

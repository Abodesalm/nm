import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Point from "@/lib/db/models/Point";
import History from "@/lib/db/models/History";
import Customer from "@/lib/db/models/Customer";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "@/lib/db/models/Employee";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("points", "readonly");
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const mainRegion = searchParams.get("mainRegion") ?? "";
    const region = searchParams.get("region") ?? "";
    const status = searchParams.get("status") ?? "";
    const search = searchParams.get("search") ?? "";

    const query: Record<string, any> = {};
    if (mainRegion) query.mainRegion = mainRegion;
    if (region) query.region = region;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const points = await Point.find(query)
      .populate("providerPoint", "point_number name status")
      .populate("employees", "fullName id_num")
      .populate("childPoints", "point_number name status")
      .sort({ point_number: 1 });

    // Attach customer counts in a single aggregation
    const counts = await Customer.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$point", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      counts.map((c: any) => [String(c._id), c.count]),
    );
    const result = points.map((p) => ({
      ...p.toObject(),
      customersCount: countMap[String(p._id)] ?? 0,
    }));

    return ok(result);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await permissionGuard("points", "full");
  if (denied) return denied;
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json();

    // Validate unique point_number per mainRegion
    const existing = await Point.findOne({
      point_number: body.point_number,
      mainRegion: body.mainRegion,
    });
    if (existing)
      return err("رقم النقطة موجود مسبقاً في هذه المنطقة الرئيسية", 400);

    // Validate provider point child count
    if (body.providerPoint) {
      const provider = await Point.findById(body.providerPoint);
      if (!provider) return err("نقطة المزود غير موجودة", 400);
      if (provider.childPoints.length >= 4)
        return err("نقطة المزود وصلت للحد الأقصى من النقاط الفرعية (4)", 400);
    }

    // Calculate ports
    const switches = body.switches ?? 1;
    const totalPorts = switches > 1 ? switches * 8 - (switches - 1) * 2 : 8;
    const usedPorts = body.providerPoint ? 1 : 0; // +1 for provider connection (root has none)

    const point = await Point.create({
      ...body,
      totalPorts,
      usedPorts,
      freePorts: totalPorts - usedPorts,
    });

    // Add to provider's childPoints
    if (body.providerPoint) {
      await Point.findByIdAndUpdate(body.providerPoint, {
        $push: { childPoints: point._id },
        $inc: { usedPorts: 1 },
      });
      // Recalculate freePorts for provider
      const provider = await Point.findById(body.providerPoint);
      if (provider) {
        await Point.findByIdAndUpdate(body.providerPoint, {
          freePorts: provider.totalPorts - provider.usedPorts,
        });
      }
    }

    // History log (non-critical — skip if no authenticated user)
    const addedBy = (session?.user as any)?.id ?? (session?.user as any)?._id;
    if (addedBy) {
      await History.create({
        section: "points",
        type: "point_added",
        performedBy: addedBy,
        point: point._id,
        notes: `تمت إضافة النقطة: ${point.name || `#${point.point_number}`}`,
        date: new Date(),
      });
    }

    return ok(point, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

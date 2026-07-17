import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST — HR grants (or deducts, with a negative number) evaluation points
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full", "hr_points_add");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    const points = Number(body.points);
    if (!points || Number.isNaN(points)) return err("عدد النقاط مطلوب");

    const employee = await Employee.findById(id);
    if (!employee) return err("الموظف غير موجود", 404);

    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        $push: {
          hrPoints: {
            points,
            pricePerPoint:
              body.pricePerPoint &&
              (body.pricePerPoint.SP || body.pricePerPoint.USD)
                ? body.pricePerPoint
                : null,
            reason: body.reason ?? null,
            date: body.date ? new Date(body.date) : new Date(),
          },
        },
      },
      { new: true },
    );
    const newEntry = updated!.hrPoints[updated!.hrPoints.length - 1];

    await History.create({
      section: "employees",
      type: "hr_points_added",
      performedBy: (session?.user as any)?.id,
      employee: id,
      relatedId: newEntry._id,
      notes: `${points > 0 ? "+" : ""}${points} نقطة — ${employee.fullName}${body.reason ? ` (${body.reason})` : ""}`,
      date: new Date(),
    });

    return ok(updated!.hrPoints, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full", "hr_points_delete");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const { pointId } = await req.json();
    const session = await getServerSession(authOptions);

    const employee = await Employee.findById(id);
    if (!employee) return err("الموظف غير موجود", 404);
    const entry = employee.hrPoints.find(
      (p: any) => p._id.toString() === pointId,
    );

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $pull: { hrPoints: { _id: pointId } } },
      { new: true },
    );

    await History.deleteOne({ relatedId: pointId, type: "hr_points_added" });
    await History.create({
      section: "employees",
      type: "hr_points_deleted",
      performedBy: (session?.user as any)?.id,
      employee: id,
      notes: `حذف سجل نقاط (${entry ? `${entry.points > 0 ? "+" : ""}${entry.points} نقطة` : pointId}) — ${employee.fullName}`,
      date: new Date(),
    });

    return ok(updated!.hrPoints);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import FieldWorkLog from "@/lib/db/models/FieldWorkLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("fieldwork", "full");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const changedBy = (session?.user as any)?.name ?? "مجهول";

    await connectDB();
    const body = await req.json();
    const { status, note, arrivedAt } = body;

    if (!status) return err("الحالة مطلوبة");
    if (status === "working" && !note?.trim())
      return err("الملاحظة مطلوبة لحالة 'في العمل'");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let log = await FieldWorkLog.findOne({ employee: id, date: today });

    if (!log) {
      if (status === "free" && !arrivedAt)
        return err("وقت الحضور مطلوب عند تحديد الحالة إلى 'حر للعمل'");

      log = await FieldWorkLog.create({
        employee: id,
        date: today,
        status,
        arrivedAt: status === "free" ? arrivedAt : null,
        currentNote: note ?? "",
        statusHistory: [
          {
            status,
            note: note ?? "",
            changedAt: new Date(),
            changedBy,
          },
        ],
      });
    } else {
      if (status === "free" && !log.arrivedAt) {
        if (!arrivedAt)
          return err("وقت الحضور مطلوب عند تحديد الحالة إلى 'حر للعمل'");
        log.arrivedAt = arrivedAt;
      }
      log.status = status;
      log.currentNote = note ?? "";
      log.statusHistory.push({
        status,
        note: note ?? "",
        changedAt: new Date(),
        changedBy,
      });
      await log.save();
    }

    return ok(log.toObject());
  } catch (e: any) {
    return err(e.message, 500);
  }
}

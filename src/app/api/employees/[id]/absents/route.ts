import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function logAbsentChange(
  employeeId: string,
  type: string,
  note: string,
  relatedId?: string,
) {
  const session = await getServerSession(authOptions);
  await History.create({
    section: "employees",
    type,
    performedBy: (session?.user as any)?.id,
    employee: employeeId,
    relatedId: relatedId ?? null,
    notes: note,
    date: new Date(),
  });
}

function dayLabel(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full", "absents_add");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $push: { absents: body } },
      { new: true },
    );
    if (!employee) return err("الموظف غير موجود", 404);

    const added = employee.absents[employee.absents.length - 1];
    await logAbsentChange(
      id,
      "absent_marked",
      `تسجيل يدوي ليوم ${dayLabel(body.date)} — ${
        body.isAbsent === false
          ? "حاضر"
          : body.excused
            ? "غياب بعذر"
            : "غياب"
      }${body.overtime ? " + دوام إضافي" : ""} — ${employee.fullName}`,
      added?._id?.toString(),
    );

    return ok(employee.absents);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full", "absents_edit");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const { absentId, data } = await req.json();

    const set: Record<string, any> = {
      "absents.$.isAbsent": data.isAbsent,
      "absents.$.excused": data.excused,
      "absents.$.reason": data.reason,
      "absents.$.note": data.note,
    };
    // Only touch the overtime flag when the caller sends it (AbsentsDrawer doesn't)
    if (data.overtime !== undefined) set["absents.$.overtime"] = data.overtime;

    const employee = await Employee.findOneAndUpdate(
      { _id: id, "absents._id": absentId },
      { $set: set },
      { new: true },
    );
    if (!employee) return err("الموظف غير موجود", 404);

    const entry = employee.absents.find(
      (a: any) => a._id.toString() === absentId,
    );
    await logAbsentChange(
      id,
      "absent_edited",
      `تعديل سجل يوم ${entry ? dayLabel(entry.date) : ""} — ${
        data.isAbsent === false
          ? "حاضر"
          : data.excused
            ? "غياب بعذر"
            : "غياب"
      }${data.overtime ? " + دوام إضافي" : ""} — ${employee.fullName}`,
      absentId,
    );

    return ok(employee.absents);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full", "absents_delete");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const { absentId } = await req.json();

    const before = await Employee.findById(id);
    if (!before) return err("الموظف غير موجود", 404);
    const entry = before.absents.find(
      (a: any) => a._id.toString() === absentId,
    );

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $pull: { absents: { _id: absentId } } },
      { new: true },
    );

    await logAbsentChange(
      id,
      "absent_deleted",
      `حذف السجل اليدوي ليوم ${entry ? dayLabel(entry.date) : absentId} — ${before.fullName} (عاد اليوم للكشف التلقائي)`,
    );

    return ok(employee!.absents);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

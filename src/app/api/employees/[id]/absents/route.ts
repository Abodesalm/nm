import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full");
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
    return ok(employee.absents);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const { absentId, data } = await req.json();

    const employee = await Employee.findOneAndUpdate(
      { _id: id, "absents._id": absentId },
      {
        $set: {
          "absents.$.isAbsent": data.isAbsent,
          "absents.$.excused": data.excused,
          "absents.$.reason": data.reason,
          "absents.$.note": data.note,
        },
      },
      { new: true },
    );
    if (!employee) return err("الموظف غير موجود", 404);
    return ok(employee.absents);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const { absentId } = await req.json();

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $pull: { absents: { _id: absentId } } },
      { new: true },
    );
    if (!employee) return err("الموظف غير موجود", 404);
    return ok(employee.absents);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "readonly");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const employee = await Employee.findById(id);
    if (!employee) return err("الموظف غير موجود", 404);
    return ok(employee);
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
    const body = await req.json();
    const employee = await Employee.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return err("الموظف غير موجود", 404);
    return ok(employee);
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
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return err("الموظف غير موجود", 404);
    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

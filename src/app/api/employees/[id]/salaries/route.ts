import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import History from "@/lib/db/models/History";

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
    const session = await getServerSession(authOptions);

    // Check duplicate month/year
    const employee = await Employee.findById(id);
    if (!employee) return err("الموظف غير موجود", 404);

    const duplicate = employee.salaries.find(
      (s: any) => s.month === body.month && s.year === body.year,
    );
    if (duplicate) return err("تم إضافة راتب هذا الشهر مسبقاً");

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $push: { salaries: body } },
      { new: true },
    );

    // Get the new salary's _id
    const newSalary = updated!.salaries[updated!.salaries.length - 1];

    // Create history log
    await History.create({
      section: "employees",
      type: "salary_added",
      performedBy: (session?.user as any)?.id,
      employee: id,
      relatedId: newSalary._id,
      notes: `راتب ${body.month}/${body.year}`,
      date: new Date(),
    });

    return ok(updated!.salaries);
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
    const { salaryId } = await req.json();

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $pull: { salaries: { _id: salaryId } } },
      { new: true },
    );
    if (!updated) return err("الموظف غير موجود", 404);

    // Delete history log
    await History.deleteOne({ relatedId: salaryId, type: "salary_added" });

    return ok(updated.salaries);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

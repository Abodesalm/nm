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

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $push: { loans: body } },
      { new: true },
    );
    if (!updated) return err("الموظف غير موجود", 404);

    const newLoan = updated.loans[updated.loans.length - 1];

    // Create history log
    await History.create({
      section: "employees",
      type: "loan_added",
      performedBy: (session?.user as any)?.id,
      employee: id,
      relatedId: newLoan._id,
      notes: `سلفة بقيمة $${body.amount?.USD ?? 0}`,
      date: new Date(),
    });

    return ok(updated.loans);
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
    const { loanId, state } = await req.json();

    const updated = await Employee.findOneAndUpdate(
      { _id: id, "loans._id": loanId },
      { $set: { "loans.$.state": state } },
      { new: true },
    );
    if (!updated) return err("الموظف غير موجود", 404);
    return ok(updated.loans);
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
    const { loanId } = await req.json();

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $pull: { loans: { _id: loanId } } },
      { new: true },
    );
    if (!updated) return err("الموظف غير موجود", 404);

    // Delete history log
    await History.deleteOne({ relatedId: loanId, type: "loan_added" });

    return ok(updated.loans);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

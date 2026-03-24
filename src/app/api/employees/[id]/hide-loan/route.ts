import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const { loanId, hidden } = await req.json();
    const updated = await Employee.findOneAndUpdate(
      { _id: id, "loans._id": loanId },
      { $set: { "loans.$.hidden": hidden } },
      { new: true },
    );
    if (!updated) return err("Not found", 404);
    return ok(updated.loans);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

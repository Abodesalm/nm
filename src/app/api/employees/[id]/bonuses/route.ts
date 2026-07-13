import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import History from "@/lib/db/models/History";
import Invoice from "@/lib/db/models/Invoice";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import {
  addTreasuryEntry,
  deleteTreasuryEntriesByInvoice,
  nextInvoiceNumber,
} from "@/lib/treasury";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST — reward (مكافأة) or compensation (تعويض) outside the monthly salary
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

    if (!["reward", "compensation"].includes(body.type))
      return err("نوع المكافأة غير صالح");
    if (!body.amount || (!body.amount.SP && !body.amount.USD))
      return err("المبلغ مطلوب");

    const employee = await Employee.findById(id);
    if (!employee) return err("الموظف غير موجود", 404);

    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        $push: {
          bonuses: {
            type: body.type,
            amount: body.amount,
            reason: body.reason ?? null,
            date: body.date ? new Date(body.date) : new Date(),
          },
        },
      },
      { new: true },
    );
    const newBonus = updated!.bonuses[updated!.bonuses.length - 1];

    const typeLabel = body.type === "reward" ? "مكافأة" : "تعويض";

    await History.create({
      section: "employees",
      type: "bonus_added",
      performedBy: (session?.user as any)?.id,
      employee: id,
      relatedId: newBonus._id,
      notes: `${typeLabel} — ${employee.fullName}${body.reason ? ` (${body.reason})` : ""}`,
      date: new Date(),
    });

    const invoice = await Invoice.create({
      invoiceNumber: await nextInvoiceNumber(),
      type: "bonus",
      category: "cost",
      employee: id,
      relatedId: newBonus._id,
      amount: body.amount,
      description: `${typeLabel} ${employee.fullName}`,
      notes: body.reason ?? null,
      date: newBonus.date,
    });

    await addTreasuryEntry({
      type: "withdraw",
      source: "invoice",
      amount: body.amount,
      description: `دفع ${typeLabel} — ${employee.fullName}`,
      relatedInvoice: invoice._id.toString(),
      date: newBonus.date,
    });

    return ok(updated!.bonuses, 201);
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
    const { bonusId } = await req.json();

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $pull: { bonuses: { _id: bonusId } } },
      { new: true },
    );
    if (!updated) return err("الموظف غير موجود", 404);

    await History.deleteOne({ relatedId: bonusId, type: "bonus_added" });
    const invoice = await Invoice.findOne({ relatedId: bonusId });
    if (invoice) {
      await deleteTreasuryEntriesByInvoice(invoice._id.toString());
      await Invoice.deleteOne({ _id: invoice._id });
    }

    return ok(updated.bonuses);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

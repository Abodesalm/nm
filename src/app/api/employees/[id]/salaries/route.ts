import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import History from "@/lib/db/models/History";
import Invoice from "@/lib/db/models/Invoice";
import {
  addTreasuryEntry,
  deleteTreasuryEntriesByInvoice,
  nextInvoiceNumber,
} from "@/lib/treasury";

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

    // Create invoice — date is the first day of the salary's month/year
    const invoice = await Invoice.create({
      invoiceNumber: await nextInvoiceNumber(),
      type: "salary",
      category: "cost",
      employee: id,
      relatedId: newSalary._id,
      amount: body.amount,
      description: `راتب ${employee.fullName} — ${body.month}/${body.year}`,
      notes: body.notes ?? null,
      date: new Date(body.year, body.month - 1, 1),
    });

    // Real cash out of the box = salary + reward − deducted employee loans
    let deductSP = 0;
    let deductUSD = 0;
    if (body.deductLoans) {
      for (const l of employee.loans as any[]) {
        if (l.state === "unpaid" && !l.hidden) {
          deductSP += l.amount?.SP ?? 0;
          deductUSD += l.amount?.USD ?? 0;
        }
      }
    }
    const paidOut = {
      SP: Math.max(0, +(((body.amount?.SP ?? 0) + (body.reward?.SP ?? 0) - deductSP)).toFixed(1)),
      USD: Math.max(0, +(((body.amount?.USD ?? 0) + (body.reward?.USD ?? 0) - deductUSD)).toFixed(2)),
      exchange: body.amount?.exchange ?? 0,
    };
    await addTreasuryEntry({
      type: "withdraw",
      source: "invoice",
      amount: paidOut,
      description: `دفع راتب ${employee.fullName} — ${body.month}/${body.year}`,
      relatedInvoice: invoice._id.toString(),
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

    // Delete history log, invoice, and its box movement
    await History.deleteOne({ relatedId: salaryId, type: "salary_added" });
    const invoice = await Invoice.findOne({ relatedId: salaryId });
    if (invoice) {
      await deleteTreasuryEntriesByInvoice(invoice._id.toString());
      await Invoice.deleteOne({ _id: invoice._id });
    }

    return ok(updated.salaries);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

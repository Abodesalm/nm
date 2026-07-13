import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Loan from "@/lib/db/models/Loan";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import {
  addTreasuryEntry,
  deleteTreasuryEntriesByLoan,
} from "@/lib/treasury";
import { isLoanSettled } from "@/lib/loans";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TreasuryEntry from "@/lib/db/models/TreasuryEntry";

// GET — single loan
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("finance", "readonly");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const loan = await Loan.findById(id).populate("relatedStorageItem", "name");
    if (!loan) return err("الدين غير موجود", 404);
    return ok(loan);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// PATCH — { action: "addPayment" | "deletePayment" | "updateInfo", ... }
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("finance", "full");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    const loan = await Loan.findById(id);
    if (!loan) return err("الدين غير موجود", 404);

    if (body.action === "addPayment") {
      if (!body.amount || (!body.amount.SP && !body.amount.USD))
        return err("مبلغ الدفعة مطلوب");

      loan.payments.push({
        amount: body.amount,
        notes: body.notes ?? null,
        date: body.date ? new Date(body.date) : new Date(),
      } as any);
      loan.status = isLoanSettled(loan) ? "paid" : "open";
      await loan.save();

      const payment = loan.payments[loan.payments.length - 1];

      // Settling a debt on us pays cash out; collecting a debt for us brings cash in
      await addTreasuryEntry({
        type: loan.direction === "on_us" ? "withdraw" : "deposit",
        source: "loan",
        amount: body.amount,
        description:
          loan.direction === "on_us"
            ? `تسديد دفعة دين إلى ${loan.party}`
            : `استلام دفعة دين من ${loan.party}`,
        notes: body.notes ?? null,
        relatedLoan: loan._id.toString(),
        date: payment.date,
      });

      await History.create({
        section: "finance",
        type: "loan_payment",
        performedBy: (session?.user as any)?.id,
        relatedId: payment._id,
        notes: `دفعة دين — ${loan.party}`,
        date: new Date(),
      });

      return ok(loan);
    }

    if (body.action === "deletePayment") {
      const payment = loan.payments.find(
        (p: any) => p._id.toString() === body.paymentId,
      );
      if (!payment) return err("الدفعة غير موجودة", 404);

      loan.payments = loan.payments.filter(
        (p: any) => p._id.toString() !== body.paymentId,
      );
      loan.status = isLoanSettled(loan) ? "paid" : "open";
      await loan.save();

      // Remove the box movement recorded for this payment (match by loan+date+amount)
      await TreasuryEntry.deleteOne({
        relatedLoan: loan._id,
        "amount.SP": payment.amount?.SP ?? 0,
        "amount.USD": payment.amount?.USD ?? 0,
        type: loan.direction === "on_us" ? "withdraw" : "deposit",
      });

      await History.deleteOne({ relatedId: body.paymentId });
      return ok(loan);
    }

    if (body.action === "updateInfo") {
      if (body.party !== undefined) loan.party = String(body.party).trim();
      if (body.notes !== undefined) loan.notes = body.notes;
      if (body.date !== undefined) loan.date = new Date(body.date);
      await loan.save();
      return ok(loan);
    }

    return err("Invalid action");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// DELETE — loan + its box movements
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("finance", "full");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();

    const loan = await Loan.findById(id);
    if (!loan) return err("الدين غير موجود", 404);

    await deleteTreasuryEntriesByLoan(id);
    await History.deleteMany({ relatedId: id });
    await Loan.findByIdAndDelete(id);

    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

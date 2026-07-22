import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import TreasuryEntry from "@/lib/db/models/TreasuryEntry";
import Invoice from "@/lib/db/models/Invoice";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import {
  computeTreasuryBalance,
  addTreasuryEntry,
  nextInvoiceNumber,
} from "@/lib/treasury";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — balance + paginated movement list
export async function GET(req: NextRequest) {
  const denied = await permissionGuard("finance", "readonly", "view");
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const [balance, entries, total] = await Promise.all([
      computeTreasuryBalance(),
      TreasuryEntry.find()
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TreasuryEntry.countDocuments(),
    ]);

    return ok({ balance, entries, total });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// POST — manual deposit/withdraw (real-life money change mirrored into the box)
export async function POST(req: NextRequest) {
  const denied = await permissionGuard("finance", "full", "treasury_add");
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json();

    if (!["deposit", "withdraw"].includes(body.type))
      return err("نوع الحركة غير صالح");
    if (!body.amount || (!body.amount.SP && !body.amount.USD))
      return err("المبلغ مطلوب");

    const description =
      body.description ||
      (body.type === "deposit" ? "دخل يدوي" : "خرج يدوي");

    const entry = await addTreasuryEntry({
      type: body.type,
      source: "manual",
      amount: body.amount,
      description,
      notes: body.notes ?? null,
      category: body.category ?? null,
      date: body.date ?? null,
    });

    // Every manual movement is also an accrual invoice: دخل → earn, خرج → cost.
    // Linked to the entry so deleting the movement cascades the invoice.
    if (entry) {
      const invoice = await Invoice.create({
        invoiceNumber: await nextInvoiceNumber(),
        type: "treasury",
        category: body.type === "deposit" ? "earn" : "cost",
        relatedId: entry._id,
        amount: body.amount,
        description,
        notes: body.notes ?? null,
        date: body.date ? new Date(body.date) : new Date(),
      });
      entry.relatedInvoice = invoice._id;
      await entry.save();
    }

    const session = await getServerSession(authOptions);
    await History.create({
      section: "finance",
      type: body.type === "deposit" ? "treasury_deposit" : "treasury_withdraw",
      performedBy: (session?.user as any)?.id,
      relatedId: entry?._id ?? null,
      notes: `${body.type === "deposit" ? "دخل" : "خرج"} يدوي في الخزينة: ${body.amount.SP?.toLocaleString("en") ?? 0} ل.س${body.description ? ` — ${body.description}` : ""}`,
      date: new Date(),
    });

    return ok(entry, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// DELETE — remove a manual entry (invoice/loan entries are cascade-managed)
export async function DELETE(req: NextRequest) {
  const denied = await permissionGuard("finance", "full", "treasury_delete");
  if (denied) return denied;

  try {
    await connectDB();
    const { entryId } = await req.json();

    const entry = await TreasuryEntry.findById(entryId);
    if (!entry) return err("الحركة غير موجودة", 404);
    if (entry.source !== "manual")
      return err("لا يمكن حذف حركة مرتبطة بفاتورة أو دين — احذف المصدر نفسه");

    // Cascade: remove the accrual invoice created with this movement
    if (entry.relatedInvoice)
      await Invoice.findByIdAndDelete(entry.relatedInvoice);

    await TreasuryEntry.findByIdAndDelete(entryId);
    await History.deleteOne({ relatedId: entryId });

    const session = await getServerSession(authOptions);
    await History.create({
      section: "finance",
      type: "treasury_entry_deleted",
      performedBy: (session?.user as any)?.id,
      notes: `حذف حركة خزينة (${entry.type === "deposit" ? "دخل" : "خرج"}): ${entry.amount?.SP?.toLocaleString("en") ?? 0} ل.س — ${entry.description}`,
      date: new Date(),
    });

    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import TreasuryEntry from "@/lib/db/models/TreasuryEntry";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { computeTreasuryBalance, addTreasuryEntry } from "@/lib/treasury";

// GET — balance + paginated movement list
export async function GET(req: NextRequest) {
  const denied = await permissionGuard("finance", "readonly");
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
  const denied = await permissionGuard("finance", "full");
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json();

    if (!["deposit", "withdraw"].includes(body.type))
      return err("نوع الحركة غير صالح");
    if (!body.amount || (!body.amount.SP && !body.amount.USD))
      return err("المبلغ مطلوب");

    const entry = await addTreasuryEntry({
      type: body.type,
      source: "manual",
      amount: body.amount,
      description:
        body.description ||
        (body.type === "deposit" ? "إيداع يدوي" : "سحب يدوي"),
      notes: body.notes ?? null,
      date: body.date ?? null,
    });

    return ok(entry, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// DELETE — remove a manual entry (invoice/loan entries are cascade-managed)
export async function DELETE(req: NextRequest) {
  const denied = await permissionGuard("finance", "full");
  if (denied) return denied;

  try {
    await connectDB();
    const { entryId } = await req.json();

    const entry = await TreasuryEntry.findById(entryId);
    if (!entry) return err("الحركة غير موجودة", 404);
    if (entry.source !== "manual")
      return err("لا يمكن حذف حركة مرتبطة بفاتورة أو دين — احذف المصدر نفسه");

    await TreasuryEntry.findByIdAndDelete(entryId);
    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

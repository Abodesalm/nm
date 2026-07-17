import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import StorageItem from "@/lib/db/models/StorageItem";
import History from "@/lib/db/models/History";
import Invoice from "@/lib/db/models/Invoice";
import Loan from "@/lib/db/models/Loan";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import {
  deleteTreasuryEntriesByInvoice,
  deleteTreasuryEntriesByLoan,
} from "@/lib/treasury";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "readonly", "view");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const item = await StorageItem.findById(id)
      .populate("actions.employee", "fullName id_num")
      .populate("actions.goal_id");
    if (!item) return err("العنصر غير موجود", 404);
    return ok(item);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "full", "item_edit");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const body = await req.json();
    const item = await StorageItem.findByIdAndUpdate(id, body, { new: true });
    if (!item) return err("العنصر غير موجود", 404);

    const session = await getServerSession(authOptions);
    const onlyHiddenToggle =
      Object.keys(body).length === 1 && "isHidden" in body;
    await History.create({
      section: "storage",
      type: onlyHiddenToggle
        ? body.isHidden
          ? "item_hidden"
          : "item_unhidden"
        : "item_edited",
      performedBy: (session?.user as any)?.id,
      item: item._id,
      relatedId: item._id,
      notes: onlyHiddenToggle
        ? `${body.isHidden ? "إخفاء" : "إظهار"} العنصر: ${item.name}`
        : `تعديل بيانات العنصر: ${item.name}`,
      date: new Date(),
    });

    return ok(item);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "full", "item_delete");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const item = await StorageItem.findById(id);
    if (!item) return err("العنصر غير موجود", 404);

    // Cascade: every action's history log, invoice, loan and their box movements
    for (const action of item.actions) {
      const actionId = action._id.toString();
      await History.deleteOne({ relatedId: actionId });

      const invoice = await Invoice.findOne({ relatedId: actionId });
      if (invoice) {
        await deleteTreasuryEntriesByInvoice(invoice._id.toString());
        await Invoice.deleteOne({ _id: invoice._id });
      }

      const loan = await Loan.findOne({ relatedActionId: actionId });
      if (loan) {
        await deleteTreasuryEntriesByLoan(loan._id.toString());
        await Loan.deleteOne({ _id: loan._id });
      }
    }

    await StorageItem.deleteOne({ _id: item._id });

    const session = await getServerSession(authOptions);
    await History.create({
      section: "storage",
      type: "item_deleted",
      performedBy: (session?.user as any)?.id,
      notes: `حذف العنصر: ${item.name} (${item.actions.length} حركة مرتبطة حُذفت معه)`,
      date: new Date(),
    });

    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

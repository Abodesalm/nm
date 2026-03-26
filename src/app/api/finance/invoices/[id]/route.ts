import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Invoice from "@/lib/db/models/Invoice";
import "@/lib/db/models/Employee";
import "@/lib/db/models/Customer";
import "@/lib/db/models/StorageItem";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("finance", "readonly");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();

    const invoice = await Invoice.findById(id)
      .populate("employee",    "fullName id_num department role")
      .populate("customer",    "name customer_number phone pppoe")
      .populate("storageItem", "name category unit")
      .lean();

    if (!invoice) return err("الفاتورة غير موجودة", 404);

    return ok(invoice);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

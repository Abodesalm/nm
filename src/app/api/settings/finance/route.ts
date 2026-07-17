import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/lib/db/models/Settings";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function logFundChange(note: string) {
  const session = await getServerSession(authOptions);
  await History.create({
    section: "finance",
    type: "fund_changed",
    performedBy: (session?.user as any)?.id,
    notes: note,
    date: new Date(),
  });
}

export async function GET() {
  const denied = await permissionGuard("finance", "readonly", "view");
  if (denied) return denied;
  try {
    await connectDB();
    const settings = await Settings.findOne();
    return ok({ funds: settings?.funds ?? [] });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: Request) {
  const denied = await permissionGuard("finance", "full", "funds_manage");
  if (denied) return denied;
  try {
    await connectDB();
    const { type, data } = await req.json();
    if (type === "fund") {
      if (!data?.name?.trim()) return err("اسم الصندوق مطلوب");
      const settings = await Settings.findOneAndUpdate(
        {},
        { $push: { funds: { name: data.name.trim() } } },
        { new: true, upsert: true },
      );
      await logFundChange(`إضافة صندوق: ${data.name.trim()}`);
      return ok(settings);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: Request) {
  const denied = await permissionGuard("finance", "full", "funds_manage");
  if (denied) return denied;
  try {
    await connectDB();
    const { type, id, data } = await req.json();
    if (type === "fund") {
      if (!data?.name?.trim()) return err("اسم الصندوق مطلوب");
      const settings = await Settings.findOneAndUpdate(
        { "funds._id": id },
        { $set: { "funds.$.name": data.name.trim() } },
        { new: true },
      );
      await logFundChange(`تعديل اسم صندوق إلى: ${data.name.trim()}`);
      return ok(settings);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(req: Request) {
  const denied = await permissionGuard("finance", "full", "funds_manage");
  if (denied) return denied;
  try {
    await connectDB();
    const { type, id } = await req.json();
    if (type === "fund") {
      const settings = await Settings.findOne();
      const fund = settings?.funds?.find(
        (f: any) => f._id.toString() === id,
      );
      const updated = await Settings.findOneAndUpdate(
        {},
        { $pull: { funds: { _id: id } } },
        { new: true },
      );
      // Un-categorize the fund's treasury records instead of orphaning them
      const TreasuryEntry = (await import("@/lib/db/models/TreasuryEntry"))
        .default;
      await TreasuryEntry.updateMany({ category: id }, { category: null });
      await logFundChange(`حذف صندوق: ${fund?.name ?? id}`);
      return ok(updated);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

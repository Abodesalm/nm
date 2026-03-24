import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/lib/db/models/Settings";
import { guard, ok, err } from "@/lib/api-factory";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const settings = await Settings.findOne();
    return ok({ packs: settings?.packs ?? [] });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const { data } = await req.json();
    const settings = await Settings.findOneAndUpdate(
      {},
      { $push: { packs: data } },
      { new: true, upsert: true },
    );
    return ok(settings);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const { id, data } = await req.json();
    const settings = await Settings.findOneAndUpdate(
      { "packs._id": id },
      {
        $set: {
          "packs.$.name": data.name,
          "packs.$.downloadSpeed": data.downloadSpeed,
          "packs.$.uploadSpeed": data.uploadSpeed,
          "packs.$.price": data.price,
        },
      },
      { new: true },
    );
    return ok(settings);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const { id } = await req.json();
    const settings = await Settings.findOneAndUpdate(
      {},
      { $pull: { packs: { _id: id } } },
      { new: true },
    );
    return ok(settings);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

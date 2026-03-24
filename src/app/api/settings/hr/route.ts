import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/lib/db/models/Settings";
import { guard, ok, err } from "@/lib/api-factory";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const settings = await Settings.findOne();
    return ok({
      departments: settings?.departments ?? [],
      roles: settings?.roles ?? [],
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const { type, data } = await req.json();
    if (type === "department") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $push: { departments: { name: data.name } } },
        { new: true, upsert: true },
      );
      return ok(settings);
    }
    if (type === "role") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $push: { roles: { name: data.name } } },
        { new: true, upsert: true },
      );
      return ok(settings);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const { type, id, data } = await req.json();
    if (type === "department") {
      const settings = await Settings.findOneAndUpdate(
        { "departments._id": id },
        { $set: { "departments.$.name": data.name } },
        { new: true },
      );
      return ok(settings);
    }
    if (type === "role") {
      const settings = await Settings.findOneAndUpdate(
        { "roles._id": id },
        { $set: { "roles.$.name": data.name } },
        { new: true },
      );
      return ok(settings);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const { type, id } = await req.json();
    if (type === "department") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $pull: { departments: { _id: id } } },
        { new: true },
      );
      return ok(settings);
    }
    if (type === "role") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $pull: { roles: { _id: id } } },
        { new: true },
      );
      return ok(settings);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

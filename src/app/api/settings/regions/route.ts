import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/lib/db/models/Settings";
import { NextResponse } from "next/server";
import { guard, ok, err } from "@/lib/api-factory";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    const settings = await Settings.findOne();
    return ok({
      mainRegions: settings?.mainRegions ?? [],
      regions: settings?.regions ?? [],
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
    if (type === "mainRegion") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $push: { mainRegions: { name: data.name } } },
        { new: true, upsert: true },
      );
      return ok(settings);
    }
    if (type === "region") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $push: { regions: data } },
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
    if (type === "mainRegion") {
      const settings = await Settings.findOneAndUpdate(
        { "mainRegions._id": id },
        { $set: { "mainRegions.$.name": data.name } },
        { new: true },
      );
      return ok(settings);
    }
    if (type === "region") {
      const settings = await Settings.findOneAndUpdate(
        { "regions._id": id },
        {
          $set: {
            "regions.$.name": data.name,
            "regions.$.mainRegion": data.mainRegion,
            "regions.$.mikrotik": data.mikrotik,
          },
        },
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
    if (type === "mainRegion") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $pull: { mainRegions: { _id: id } } },
        { new: true },
      );
      return ok(settings);
    }
    if (type === "region") {
      const settings = await Settings.findOneAndUpdate(
        {},
        { $pull: { regions: { _id: id } } },
        { new: true },
      );
      return ok(settings);
    }
    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

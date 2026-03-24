import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/lib/db/models/Settings";
import { NextResponse } from "next/server";
import { guard, ok, err } from "@/lib/api-factory";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        defaultExchangeRate: 15000,
        autoSuspendDay: 7,
        systemName: "NM System",
      });
    }
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
    const body = await req.json();
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true },
    );
    return ok(settings);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

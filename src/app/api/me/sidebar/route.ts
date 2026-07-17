import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";
import { ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Each user manages ONLY their own sidebar preferences (order + label overrides)

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return err("Unauthorized", 401);
  try {
    await connectDB();
    const user = await SystemUser.findById(userId).select("sidebarPrefs");
    return ok({ sidebarPrefs: user?.sidebarPrefs ?? [] });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return err("Unauthorized", 401);
  try {
    await connectDB();
    const { sidebarPrefs } = await req.json();
    if (!Array.isArray(sidebarPrefs)) return err("صيغة غير صالحة");

    const clean = sidebarPrefs
      .filter((p: any) => p && typeof p.key === "string")
      .map((p: any, i: number) => ({
        key: p.key,
        order: Number.isFinite(p.order) ? p.order : i,
        label:
          typeof p.label === "string" && p.label.trim()
            ? p.label.trim().slice(0, 30)
            : undefined,
      }));

    await SystemUser.findByIdAndUpdate(userId, { sidebarPrefs: clean });
    return ok({ sidebarPrefs: clean });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

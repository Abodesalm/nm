import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";
import { superAdminGuard, ok, err } from "@/lib/api-factory";
import { NextRequest } from "next/server";

// GET sessions for a user
export async function GET(req: NextRequest) {
  const denied = await superAdminGuard();
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const user = await SystemUser.findById(userId, { sessions: 1, name: 1 });
    if (!user) return err("User not found", 404);
    return ok(user.sessions ?? []);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// DELETE — force logout session(s)
export async function DELETE(req: NextRequest) {
  const denied = await superAdminGuard();
  if (denied) return denied;
  try {
    await connectDB();
    const { userId, sessionId } = await req.json();

    if (sessionId === "all") {
      // Logout all sessions
      await SystemUser.findByIdAndUpdate(userId, { $set: { sessions: [] } });
    } else {
      // Logout specific session
      await SystemUser.findByIdAndUpdate(userId, {
        $pull: { sessions: { _id: sessionId } },
      });
    }
    return ok({ success: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

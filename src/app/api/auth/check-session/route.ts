import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId || !sessionId) {
      return NextResponse.json({ valid: false });
    }

    await connectDB();
    const user = await SystemUser.findById(userId, {
      sessions: 1,
      isSuperAdmin: 1,
    });

    // User deleted entirely
    if (!user) return NextResponse.json({ valid: false });

    // Super admin always valid
    if (user.isSuperAdmin) return NextResponse.json({ valid: true });

    // Check if specific session still exists
    const sessionExists = user.sessions?.some(
      (s: any) => s._id.toString() === sessionId,
    );

    return NextResponse.json({ valid: !!sessionExists });
  } catch (e) {
    // If DB fails don't log the user out
    return NextResponse.json({ valid: true });
  }
}

import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await SystemUser.findOne({ email });
    if (!user) return NextResponse.json({ error: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Wrong password" });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}

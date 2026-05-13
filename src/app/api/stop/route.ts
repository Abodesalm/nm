import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== "kill") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fs = await import("fs");
  fs.writeFileSync("/tmp/kill.flag", "1");
  return NextResponse.json({ success: true });
}

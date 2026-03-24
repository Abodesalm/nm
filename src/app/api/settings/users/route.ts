import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";
import { superAdminGuard, ok, err } from "@/lib/api-factory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const SECTIONS = [
  "employees",
  "storage",
  "history",
  "points",
  "customers",
  "problems",
  "finance",
  "documents",
  "settings",
];

export async function GET() {
  const denied = await superAdminGuard();
  if (denied) return denied;
  try {
    await connectDB();
    const users = await SystemUser.find({}, { password: 0 }).sort({
      createdAt: -1,
    });
    return ok(users);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await superAdminGuard();
  if (denied) return denied;
  try {
    await connectDB();
    const { name, email, password, permissions } = await req.json();

    if (!name || !email || !password)
      return err("الاسم والبريد وكلمة المرور مطلوبة");
    if (password.length < 8)
      return err("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password))
      return err("كلمة المرور يجب أن تحتوي على حروف وأرقام");

    const exists = await SystemUser.findOne({ email });
    if (exists) return err("البريد الإلكتروني مستخدم مسبقاً");

    const hashed = await bcrypt.hash(password, 10);
    const user = await SystemUser.create({
      name,
      email,
      password: hashed,
      isSuperAdmin: false,
      permissions:
        permissions ??
        SECTIONS.map((s) => ({ section: s, permission: "none" })),
    });

    const { password: _, ...userObj } = user.toObject();
    return ok(userObj, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await superAdminGuard();
  if (denied) return denied;
  try {
    await connectDB();
    const { id, type, data } = await req.json();

    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (type === "permissions") {
      const user = await SystemUser.findByIdAndUpdate(
        id,
        { permissions: data.permissions },
        { new: true, select: "-password" },
      );
      return ok(user);
    }

    if (type === "resetPassword") {
      if (data.password.length < 8)
        return err("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(data.password))
        return err("كلمة المرور يجب أن تحتوي على حروف وأرقام");
      const hashed = await bcrypt.hash(data.password, 10);
      await SystemUser.findByIdAndUpdate(id, { password: hashed });
      return ok({ success: true });
    }

    if (type === "info") {
      const user = await SystemUser.findByIdAndUpdate(
        id,
        { name: data.name, email: data.email },
        { new: true, select: "-password" },
      );
      return ok(user);
    }

    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await superAdminGuard();
  if (denied) return denied;
  try {
    await connectDB();
    const { id } = await req.json();

    const user = await SystemUser.findById(id);
    if (!user) return err("المستخدم غير موجود", 404);
    if (user.isSuperAdmin) return err("لا يمكن حذف السوبر أدمن", 403);

    await SystemUser.findByIdAndDelete(id);
    return ok({ deleted: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

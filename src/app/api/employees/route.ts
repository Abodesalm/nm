import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("employees", "readonly");
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";
    const department = searchParams.get("department") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const sortBy = searchParams.get("sortBy") ?? "id_num";
    const sortDir = searchParams.get("sortDir") ?? "asc";

    const query: Record<string, any> = {};
    if (search) query.fullName = { $regex: search, $options: "i" };
    if (role) query.role = role;
    if (department) query.department = department;

    // Build sort
    const sortMap: Record<string, string> = {
      id_num: "id_num",
      fullName: "fullName",
      department: "department",
      role: "role",
      salary: "salary.USD",
    };
    const sortField = sortMap[sortBy] ?? "id_num";
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortDir === "asc" ? 1 : -1,
    };

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .select("-absents -salaries -loans")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return ok({ employees, total, page, limit });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await permissionGuard("employees", "full");
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json();
    const exists = await Employee.findOne({ id_num: body.id_num });
    if (exists) return err("رقم الموظف مستخدم مسبقاً");
    const employee = await Employee.create(body);
    return ok(employee, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

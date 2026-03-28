import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import Employee from "@/lib/db/models/Employee";
import FieldWorkLog from "@/lib/db/models/FieldWorkLog";

export async function GET(req: NextRequest) {
  const denied = await permissionGuard("fieldwork", "readonly");
  if (denied) return denied;

  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const employees = await Employee.find({ state: "active" })
      .select("id_num fullName department role photo state")
      .sort({ id_num: 1 });

    const employeeIds = employees.map((e) => e._id);

    const logs = await FieldWorkLog.find({
      employee: { $in: employeeIds },
      date: { $gte: today, $lt: tomorrow },
    });

    const logMap = new Map(
      logs.map((l) => [l.employee.toString(), l.toObject()]),
    );

    const result = employees.map((emp) => ({
      employee: emp.toObject(),
      log: logMap.get(emp._id.toString()) ?? null,
    }));

    return ok(result);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

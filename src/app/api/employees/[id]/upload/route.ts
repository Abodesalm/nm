import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import { uploadFile } from "@/lib/cloudinary";
import { permissionGuard, ok, err } from "@/lib/api-factory";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("employees", "full");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();

    const formData = await req.formData();
    const type = formData.get("type") as string;
    const file = formData.get("file") as File;

    if (!file) return err("No file provided");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const employee = await Employee.findById(id);
    if (!employee) return err("Employee not found", 404);

    const filename = `emp_${employee.id_num}_${Date.now()}`;

    if (type === "photo") {
      if (file.size > 5 * 1024 * 1024)
        return err("الصورة يجب أن تكون أقل من 5MB");
      const url = await uploadFile(
        buffer,
        "nm-system/employees/photos",
        filename,
        "image",
      );
      await Employee.findByIdAndUpdate(id, { photo: url });
      return ok({ url });
    }

    if (type === "cv") {
      if (file.size > 10 * 1024 * 1024)
        return err("الـ CV يجب أن يكون أقل من 10MB");
      const url = await uploadFile(
        buffer,
        "nm-system/employees/cvs",
        filename,
        "raw",
      );
      await Employee.findByIdAndUpdate(id, { cv: url });
      return ok({ url });
    }

    return err("Invalid type");
  } catch (e: any) {
    return err(e.message, 500);
  }
}

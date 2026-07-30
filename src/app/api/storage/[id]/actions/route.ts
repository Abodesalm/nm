import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { deleteStorageActionFromItem, ApiError } from "@/lib/storageActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Actions are added ONLY from the دخل/خرج pages (api/storage/actions POST,
// direction-gated). There is intentionally no POST here — adding an action
// per-item would bypass the income_access/outcome_access permission split.

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("storage", "full", "action_delete");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await connectDB();
    const { actionId } = await req.json();
    const session = await getServerSession(authOptions);

    const { item } = await deleteStorageActionFromItem(
      id,
      actionId,
      (session?.user as any)?.id,
    );
    return ok(item);
  } catch (e: any) {
    return err(e.message, e instanceof ApiError ? e.status : 500);
  }
}

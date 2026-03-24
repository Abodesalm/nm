import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Model } from "mongoose";

// ── Response helpers ──────────────────────────────────────────────────────────

export function ok(data: any, status = 200) {
  return NextResponse.json({ status: "success", data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ status: "error", message }, { status });
}

// ── Auth guard ────────────────────────────────────────────────────────────────

export async function guard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }
  return null;
}

export async function superAdminGuard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }
  if (!(session.user as any).isSuperAdmin) {
    return NextResponse.json(
      { status: "error", message: "Forbidden — super admin only" },
      { status: 403 },
    );
  }
  return null;
}

// ── Permission guard ──────────────────────────────────────────────────────────

export async function permissionGuard(
  section: string,
  required: "readonly" | "full",
) {
  const session = await getServerSession(authOptions);
  if (!session) return err("Unauthorized", 401);

  const user = session.user as any;
  if (user.isSuperAdmin) return null;

  const perm = user.permissions?.find((p: any) => p.section === section);
  if (!perm || perm.permission === "none") return err("Forbidden", 403);
  if (required === "full" && perm.permission !== "full")
    return err("Forbidden — read only access", 403);

  return null;
}

// ── Collection handlers: GET all + POST new ───────────────────────────────────

export function makeCollectionHandlers(
  Model: Model<any>,
  section: string,
  options?: {
    populateFields?: string[];
    defaultSort?: Record<string, 1 | -1>;
    searchFields?: string[];
  },
) {
  const GET = async (req: NextRequest) => {
    const denied = await permissionGuard(section, "readonly");
    if (denied) return denied;

    try {
      await connectDB();
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search");
      const showHidden = searchParams.get("hidden") === "true";

      let query: Record<string, any> = {};

      if (!showHidden) query.isHidden = { $ne: true };

      if (search && options?.searchFields?.length) {
        query.$or = options.searchFields.map((field) => ({
          [field]: { $regex: search, $options: "i" },
        }));
      }

      let q = Model.find(query).sort(options?.defaultSort ?? { createdAt: -1 });

      if (options?.populateFields) {
        options.populateFields.forEach((f) => {
          q = q.populate(f);
        });
      }

      const docs = await q;
      return ok(docs);
    } catch (e: any) {
      return err(e.message, 500);
    }
  };

  const POST = async (req: NextRequest) => {
    const denied = await permissionGuard(section, "full");
    if (denied) return denied;

    try {
      await connectDB();
      const body = await req.json();
      const doc = await Model.create(body);
      return ok(doc, 201);
    } catch (e: any) {
      return err(e.message, 500);
    }
  };

  return { GET, POST };
}

// ── Document handlers: GET one + PATCH + DELETE ───────────────────────────────

export function makeDocumentHandlers(
  Model: Model<any>,
  section: string,
  options?: {
    populateFields?: string[];
  },
) {
  const GET = async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const denied = await permissionGuard(section, "readonly");
    if (denied) return denied;

    try {
      const { id } = await context.params;
      await connectDB();

      let q = Model.findById(id);
      if (options?.populateFields) {
        options.populateFields.forEach((f) => {
          q = q.populate(f);
        });
      }

      const doc = await q;
      if (!doc) return err("Not found", 404);
      return ok(doc);
    } catch (e: any) {
      return err(e.message, 500);
    }
  };

  const PATCH = async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const denied = await permissionGuard(section, "full");
    if (denied) return denied;

    try {
      const { id } = await context.params;
      await connectDB();
      const body = await req.json();
      const doc = await Model.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return err("Not found", 404);
      return ok(doc);
    } catch (e: any) {
      return err(e.message, 500);
    }
  };

  const DELETE = async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const denied = await permissionGuard(section, "full");
    if (denied) return denied;

    try {
      const { id } = await context.params;
      await connectDB();
      const doc = await Model.findByIdAndDelete(id);
      if (!doc) return err("Not found", 404);
      return ok({ deleted: true });
    } catch (e: any) {
      return err(e.message, 500);
    }
  };

  return { GET, PATCH, DELETE };
}

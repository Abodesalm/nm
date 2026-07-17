import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Loan from "@/lib/db/models/Loan";
import History from "@/lib/db/models/History";
import { permissionGuard, ok, err } from "@/lib/api-factory";
import { addTreasuryEntry } from "@/lib/treasury";
import { loanRemaining } from "@/lib/loans";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — loans list + open totals per direction
export async function GET(req: NextRequest) {
  const denied = await permissionGuard("finance", "readonly", "view");
  if (denied) return denied;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, any> = {};
    if (direction) query.direction = direction;
    if (status) query.status = status;
    if (search) query.party = { $regex: search, $options: "i" };

    const [loans, total, openLoans] = await Promise.all([
      Loan.find(query)
        .populate("relatedStorageItem", "name")
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Loan.countDocuments(query),
      Loan.find({ status: "open" }).lean(),
    ]);

    const summary = {
      on_us: { SP: 0, USD: 0, count: 0 },
      for_us: { SP: 0, USD: 0, count: 0 },
    };
    for (const l of openLoans as any[]) {
      const remaining = loanRemaining(l);
      const bucket = summary[l.direction as "on_us" | "for_us"];
      bucket.SP += remaining.SP;
      bucket.USD += remaining.USD;
      bucket.count += 1;
    }

    const withRemaining = (loans as any[]).map((l) => ({
      ...l,
      remaining: loanRemaining(l),
    }));

    return ok({ loans: withRemaining, total, summary });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// POST — manual loan (cash borrowed by us / lent by us, or plain debt record)
export async function POST(req: NextRequest) {
  const denied = await permissionGuard("finance", "full", "loans_add");
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    if (!["on_us", "for_us"].includes(body.direction))
      return err("اتجاه الدين غير صالح");
    if (!body.party?.trim()) return err("اسم الطرف مطلوب");
    if (!body.amount || (!body.amount.SP && !body.amount.USD))
      return err("المبلغ مطلوب");

    const loan = await Loan.create({
      direction: body.direction,
      party: body.party.trim(),
      amount: body.amount,
      payments: [],
      status: "open",
      affectsTreasury: !!body.affectsTreasury,
      notes: body.notes ?? null,
      date: body.date ? new Date(body.date) : new Date(),
    });

    // Cash loan: money actually moved through the box at origin
    if (body.affectsTreasury) {
      await addTreasuryEntry({
        type: body.direction === "on_us" ? "deposit" : "withdraw",
        source: "loan",
        amount: body.amount,
        description:
          body.direction === "on_us"
            ? `استلام دين من ${loan.party}`
            : `إقراض ${loan.party}`,
        relatedLoan: loan._id.toString(),
        date: loan.date,
      });
    }

    await History.create({
      section: "finance",
      type: body.direction === "on_us" ? "loan_on_us_added" : "loan_for_us_added",
      performedBy: (session?.user as any)?.id,
      relatedId: loan._id,
      notes: `دين ${body.direction === "on_us" ? "علينا" : "لنا"} — ${loan.party}`,
      date: new Date(),
    });

    return ok(loan, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}

import TreasuryEntry from "@/lib/db/models/TreasuryEntry";
import Invoice from "@/lib/db/models/Invoice";

export interface Money {
  USD: number;
  SP: number;
  exchange: number;
}

/**
 * رصيد الخزينة — derived, never stored (MyMoney rule).
 * Sums every entry: deposits add, withdrawals subtract, per currency.
 * SP is the primary figure; USD is the same money's historical equivalent.
 */
export async function computeTreasuryBalance() {
  const rows = await TreasuryEntry.aggregate([
    {
      $group: {
        _id: "$type",
        SP: { $sum: "$amount.SP" },
        USD: { $sum: "$amount.USD" },
      },
    },
  ]);
  const get = (t: string) => rows.find((r) => r._id === t) ?? { SP: 0, USD: 0 };
  const dep = get("deposit");
  const wit = get("withdraw");
  return {
    SP: +(dep.SP - wit.SP).toFixed(1),
    USD: +(dep.USD - wit.USD).toFixed(2),
  };
}

/** Next sequential invoice number (shared by every invoice-creating route). */
export async function nextInvoiceNumber(): Promise<number> {
  const last = await Invoice.findOne({}, { invoiceNumber: 1 })
    .sort({ invoiceNumber: -1 })
    .lean<{ invoiceNumber: number } | null>();
  return (last?.invoiceNumber ?? 0) + 1;
}

function hasMoney(m?: Money | null): m is Money {
  return !!m && (!!m.USD || !!m.SP);
}

/** Record real cash leaving/entering the box. Skips zero amounts. */
export async function addTreasuryEntry(entry: {
  type: "deposit" | "withdraw";
  source?: "manual" | "invoice" | "loan";
  amount: Money;
  description: string;
  notes?: string | null;
  relatedInvoice?: string | null;
  relatedLoan?: string | null;
  date?: Date | string | null;
}) {
  if (!hasMoney(entry.amount)) return null;
  return TreasuryEntry.create({
    type: entry.type,
    source: entry.source ?? "manual",
    amount: entry.amount,
    description: entry.description,
    notes: entry.notes ?? undefined,
    relatedInvoice: entry.relatedInvoice ?? null,
    relatedLoan: entry.relatedLoan ?? null,
    date: entry.date ? new Date(entry.date) : new Date(),
  });
}

/** Cascade: remove box movements tied to a deleted invoice. */
export async function deleteTreasuryEntriesByInvoice(invoiceId: string) {
  await TreasuryEntry.deleteMany({ relatedInvoice: invoiceId });
}

/** Cascade: remove box movements tied to a deleted loan. */
export async function deleteTreasuryEntriesByLoan(loanId: string) {
  await TreasuryEntry.deleteMany({ relatedLoan: loanId });
}

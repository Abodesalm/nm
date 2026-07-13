import { Money } from "@/lib/treasury";

/** المتبقي من الدين لكل عملة: الأصل − مجموع الدفعات. */
export function loanRemaining(loan: {
  amount?: Money | null;
  payments?: { amount?: Money | null }[];
}) {
  const paidSP = (loan.payments ?? []).reduce(
    (s, p) => s + (p.amount?.SP ?? 0),
    0,
  );
  const paidUSD = (loan.payments ?? []).reduce(
    (s, p) => s + (p.amount?.USD ?? 0),
    0,
  );
  return {
    SP: +((loan.amount?.SP ?? 0) - paidSP).toFixed(1),
    USD: +((loan.amount?.USD ?? 0) - paidUSD).toFixed(2),
  };
}

/** SP is authoritative (SYP-primary system); USD-only loans fall back to USD. */
export function isLoanSettled(loan: {
  amount?: Money | null;
  payments?: { amount?: Money | null }[];
}) {
  const remaining = loanRemaining(loan);
  if ((loan.amount?.SP ?? 0) > 0) return remaining.SP <= 0.05;
  return remaining.USD <= 0.005;
}

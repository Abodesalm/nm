import StorageItem from "@/lib/db/models/StorageItem";
import History from "@/lib/db/models/History";
import Point from "@/lib/db/models/Point";
import Invoice from "@/lib/db/models/Invoice";
import Loan from "@/lib/db/models/Loan";
import {
  addTreasuryEntry,
  deleteTreasuryEntriesByInvoice,
  deleteTreasuryEntriesByLoan,
  nextInvoiceNumber,
} from "@/lib/treasury";
import { isLoanSettled } from "@/lib/loans";

/**
 * Core add/delete logic for storage actions — the single source of truth used
 * by BOTH the per-item route (api/storage/[id]/actions) and the global
 * cross-item actions log (api/storage/actions). Keeping this in one place
 * guarantees deleting an action from the log behaves IDENTICALLY to deleting
 * it from the item profile (same quantity reversal, same cascades, same log).
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Increasing types flow INTO the warehouse; everything else flows out.
// "usage" behaves like consume; "custody" (أمانة) behaves like borrow:
// still ours, tracked in the borrowed counter, returnable via "return".
export const INCREASING_TYPES = ["stock_in", "return"];
export const DECREASING_TYPES = [
  "stock_out",
  "consume",
  "usage",
  "borrow",
  "custody",
];

// "أخرى" (other) exists only within the دخل/خرج pages — its direction isn't
// implied by the type itself (unlike every other type) but by which of the
// two locked pages created it, persisted on the action as `flowDirection`.
export const OTHER_TYPE = "other";

export const TYPE_AR: Record<string, string> = {
  stock_in: "إدخال مخزون",
  stock_out: "إخراج مخزون",
  consume: "استهلاك",
  usage: "استخدام",
  borrow: "استعارة",
  custody: "أمانة",
  return: "إرجاع",
  other: "أخرى",
};

/** True if this action increases the item's quantity. Handles "other" via its persisted flowDirection. */
export function isIncreasingAction(a: {
  type: string;
  flowDirection?: string | null;
}) {
  if (a.type === OTHER_TYPE) return a.flowDirection === "in";
  return INCREASING_TYPES.includes(a.type);
}

/** Natural direction of a non-"other" type, or null if unknown (used to validate page-locked submissions). */
function directionOfType(type: string): "in" | "out" | null {
  if (INCREASING_TYPES.includes(type)) return "in";
  if (DECREASING_TYPES.includes(type)) return "out";
  return null;
}

export function recalcQuantities(actions: any[]) {
  let current = 0;
  let borrowed = 0;
  for (const a of actions) {
    if (isIncreasingAction(a)) current += a.quantity;
    else current -= a.quantity;
    if (a.type === "borrow" || a.type === "custody") borrowed += a.quantity;
    if (a.type === "return") borrowed -= a.quantity;
  }
  return { current: Math.max(0, current), borrowed: Math.max(0, borrowed) };
}

export function calcStatus(current: number, min: number) {
  if (current === 0) return "out-of-stock";
  if (current <= min) return "low-stock";
  return "in-stock";
}

/** Upsert quantity for an item in a point's equipment array */
async function addToPointEquipment(
  pointId: string,
  itemId: string,
  quantity: number,
) {
  const result = await Point.updateOne(
    { _id: pointId, "equipment.itemId": itemId },
    { $inc: { "equipment.$.quantity": quantity } },
  );
  if (result.matchedCount === 0) {
    await Point.findByIdAndUpdate(pointId, {
      $push: { equipment: { itemId, quantity } },
    });
  }
}

/** Decrement quantity for an item in a point's equipment array, removing if ≤ 0 */
async function removeFromPointEquipment(
  pointId: string,
  itemId: string,
  quantity: number,
) {
  await Point.updateOne(
    { _id: pointId, "equipment.itemId": itemId },
    { $inc: { "equipment.$.quantity": -quantity } },
  );
  await Point.updateOne(
    { _id: pointId },
    { $pull: { equipment: { quantity: { $lte: 0 } } } },
  );
}

/** Add an action to an item — full side effects (point sync, history, invoice, loan, treasury). */
export async function addStorageActionToItem(
  itemId: string,
  body: any,
  actorId?: string | null,
  opts?: { enforceDirection?: "in" | "out" },
) {
  const item = await StorageItem.findById(itemId);
  if (!item) throw new ApiError("العنصر غير موجود", 404);

  const enforceDirection = opts?.enforceDirection;

  // "أخرى" only exists within a دخل/خرج-locked page — its direction is
  // ALWAYS derived from that page context, never trusted from the client.
  if (body.type === OTHER_TYPE) {
    if (!enforceDirection)
      throw new ApiError("نوع الحركة 'أخرى' غير متاح إلا من صفحتي الدخل أو الخرج");
    body.flowDirection = enforceDirection;
  } else {
    body.flowDirection = null;
    // A submission from a locked دخل/خرج page can't smuggle in the other direction's type
    if (enforceDirection && directionOfType(body.type) !== enforceDirection) {
      throw new ApiError("نوع الحركة غير مسموح في هذه الصفحة");
    }
  }

  const isGain = !!body.gain;

  if (body.loan?.enabled) {
    if (!body.cost || (!body.cost.USD && !body.cost.SP))
      throw new ApiError(
        isGain ? "البيع بالدين يتطلب مكسباً" : "الشراء بالدين يتطلب تكلفة",
      );
    if (!body.loan.party?.trim())
      throw new ApiError(
        isGain ? "اسم الجهة المدينة مطلوب" : "اسم الجهة الدائنة مطلوب",
      );
  }

  // Increasing actions always land in the warehouse — no external destination
  if (isIncreasingAction(body)) {
    body.goal_model = null;
    body.goal_id = null;
  }

  item.actions.push(body);
  const { current, borrowed } = recalcQuantities(item.actions);
  item.currentQuantity = current;
  item.borrowedQuantity = borrowed;
  item.status = calcStatus(current, item.minQuantity);
  await item.save();

  const newAction = item.actions[item.actions.length - 1];

  // Sync to point equipment if this action targets a point
  if (body.goal_model === "points" && body.goal_id) {
    await addToPointEquipment(body.goal_id, itemId, body.quantity);
  }

  // History log
  await History.create({
    section: "storage",
    type: body.type,
    performedBy: actorId ?? null,
    item: itemId,
    point: body.goal_model === "points" ? body.goal_id : null,
    relatedId: newAction._id,
    quantity: body.quantity,
    goal_model: body.goal_model ?? null,
    goal_id: body.goal_id ?? null,
    notes: body.cost?.USD
      ? [
          body.notes,
          `${isGain ? "المكسب" : "التكلفة"}: $${body.cost.USD} / ${body.cost.SP?.toLocaleString("en")} ل.س`,
        ]
          .filter(Boolean)
          .join(" — ")
      : (body.notes ?? null),
    date: body.date ?? new Date(),
  });

  // Create invoice if this action has a cost or a gain
  if (body.cost && (body.cost.USD || body.cost.SP)) {
    const invoice = await Invoice.create({
      invoiceNumber: await nextInvoiceNumber(),
      type: "storage_action",
      category: isGain ? "earn" : "cost",
      storageItem: itemId,
      relatedId: newAction._id,
      amount: body.cost,
      description: `${isGain ? "مكسب" : "تكلفة"} ${item.name} — ${body.type}`,
      notes: body.notes || null,
      date: body.date ? new Date(body.date) : new Date(),
    });

    if (body.loan?.enabled) {
      // Credit deal: the full amount is owed between us and the party; only
      // the paid/received-now part moves the box now. The rest is a loan —
      // "on_us" when we owe (cost), "for_us" when we're owed (gain).
      const paidNow = body.loan.paidNow;
      const hasPaidNow = paidNow && (paidNow.USD || paidNow.SP);

      const loan = await Loan.create({
        direction: isGain ? "for_us" : "on_us",
        party: body.loan.party.trim(),
        amount: body.cost,
        payments: hasPaidNow
          ? [
              {
                amount: paidNow,
                notes: isGain
                  ? "دفعة أولى مقبوضة عند البيع"
                  : "دفعة أولى عند الشراء",
                date: body.date ? new Date(body.date) : new Date(),
              },
            ]
          : [],
        status: "open",
        affectsTreasury: false,
        relatedStorageItem: itemId,
        relatedActionId: newAction._id,
        notes: body.notes ?? null,
        date: body.date ? new Date(body.date) : new Date(),
      });
      loan.status = isLoanSettled(loan) ? "paid" : "open";
      await loan.save();

      if (hasPaidNow) {
        await addTreasuryEntry({
          type: isGain ? "deposit" : "withdraw",
          source: "loan",
          amount: paidNow,
          description: isGain
            ? `دفعة أولى — بيع ${item.name} بالدين إلى ${loan.party}`
            : `دفعة أولى — شراء ${item.name} بالدين من ${loan.party}`,
          relatedLoan: loan._id.toString(),
          date: body.date ?? null,
        });
      }
    } else {
      // Fully settled now: the whole amount moves the box immediately
      await addTreasuryEntry({
        type: isGain ? "deposit" : "withdraw",
        source: "invoice",
        amount: body.cost,
        description: `${isGain ? "بيع" : "شراء"} ${item.name} — ${body.type}`,
        relatedInvoice: invoice._id.toString(),
        date: body.date ?? null,
      });
    }
  }

  return { item, action: newAction };
}

/** Delete an action from an item — full side effects, mirrors addStorageActionToItem's cascades. */
export async function deleteStorageActionFromItem(
  itemId: string,
  actionId: string,
  actorId?: string | null,
  opts?: { enforceDirection?: "in" | "out" },
) {
  const item = await StorageItem.findById(itemId);
  if (!item) throw new ApiError("العنصر غير موجود", 404);

  // Find the action before removing it (need goal_model/goal_id/quantity)
  const action = item.actions.find(
    (a: any) => a._id.toString() === actionId,
  );
  if (!action) throw new ApiError("الحركة غير موجودة", 404);

  // A دخل/خرج-locked page can only delete actions of its own direction
  if (
    opts?.enforceDirection &&
    isIncreasingAction(action) !== (opts.enforceDirection === "in")
  ) {
    throw new ApiError("لا يمكن حذف حركة من الاتجاه الآخر من هذه الصفحة", 403);
  }

  item.actions = item.actions.filter(
    (a: any) => a._id.toString() !== actionId,
  );
  const { current, borrowed } = recalcQuantities(item.actions);
  item.currentQuantity = current;
  item.borrowedQuantity = borrowed;
  item.status = calcStatus(current, item.minQuantity);
  await item.save();

  // Reverse point equipment sync
  if (action.goal_model === "points" && action.goal_id) {
    await removeFromPointEquipment(
      String(action.goal_id),
      itemId,
      action.quantity,
    );
  }

  // Delete history log, invoice, loan and their box movements
  await History.deleteOne({ relatedId: actionId });

  // Audit trail: record that the action itself was deleted
  await History.create({
    section: "storage",
    type: "action_deleted",
    performedBy: actorId ?? null,
    item: itemId,
    quantity: action.quantity,
    notes: `حذف حركة (${TYPE_AR[action.type] ?? action.type}) بكمية ${action.quantity} من ${item.name}`,
    date: new Date(),
  });

  const invoice = await Invoice.findOne({ relatedId: actionId });
  if (invoice) {
    await deleteTreasuryEntriesByInvoice(invoice._id.toString());
    await Invoice.deleteOne({ _id: invoice._id });
  }

  const loan = await Loan.findOne({ relatedActionId: actionId });
  if (loan) {
    await deleteTreasuryEntriesByLoan(loan._id.toString());
    await Loan.deleteOne({ _id: loan._id });
  }

  return { item, action };
}

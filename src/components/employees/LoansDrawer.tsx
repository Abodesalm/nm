"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus, Trash2, RefreshCw, EyeOff, Eye } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: any;
  defaultExchange: number;
  onUpdate?: () => void;
}

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 10px",
  borderRadius: 7,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

export function LoansDrawer({
  open,
  onClose,
  employee,
  defaultExchange,
  onUpdate,
}: Props) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [form, setForm] = useState({
    amount: { USD: 0, SP: 0, exchange: 0 },
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (open && employee) fetchLoans();
  }, [open, employee]);

  async function fetchLoans() {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}`);
    const json = await res.json();
    // Sort by newest first
    const sorted = [...(json.data?.loans ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setLoans(sorted);
    setLoading(false);
  }

  const visibleLoans = loans.filter((l) => (showHidden ? true : !l.hidden));
  const hiddenCount = loans.filter((l) => l.hidden).length;
  const unpaidTotal = loans
    .filter((l) => l.state === "unpaid" && !l.hidden)
    .reduce((acc, l) => acc + (l.amount?.USD ?? 0), 0);

  const paginated = visibleLoans.slice((page - 1) * limit, page * limit);

  async function handleAdd() {
    setSaving(true);
    await fetch(`/api/employees/${employee._id}/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ amount: { USD: 0, SP: 0, exchange: 0 }, notes: "" });
    await fetchLoans();
    onUpdate?.();
  }

  async function handleToggle(loanId: string, currentState: string) {
    await fetch(`/api/employees/${employee._id}/loans`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId,
        state: currentState === "paid" ? "unpaid" : "paid",
      }),
    });
    await fetchLoans();
    onUpdate?.();
  }

  async function handleHide(loanId: string, hidden: boolean) {
    await fetch(`/api/employees/${employee._id}/hide-loan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId, hidden }),
    });
    await fetchLoans();
    onUpdate?.();
  }

  async function handleDelete(loanId: string) {
    await fetch(`/api/employees/${employee._id}/loans`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    setConfirmDelete(null);
    await fetchLoans();
    onUpdate?.();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`السلف — ${employee?.fullName}`}
      width={520}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stats + Add */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#dc2626",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                إجمالي السلف غير المدفوعة
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#dc2626",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                ${unpaidTotal.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                borderRadius: 8,
                border: "none",
                background: "#f97316",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> إضافة سلفة
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  المبلغ
                </label>
                <MoneyInput
                  value={form.amount}
                  onChange={(val) => setForm({ ...form, amount: val })}
                  defaultExchange={defaultExchange}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  ملاحظات
                </label>
                <input
                  style={inputStyle}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ملاحظات..."
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setShowAdd(false)}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#f97316",
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "جاري الحفظ..." : "إضافة"}
                </button>
              </div>
            </div>
          )}

          {/* Loans list */}
          {visibleLoans.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              {loans.length === 0 ? "لا توجد سلف بعد" : "لا توجد سلف مرئية"}
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {paginated.map((loan) => (
                  <div
                    key={loan._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 9,
                      background: "var(--bg)",
                      border: `1px solid ${loan.hidden ? "rgba(107,114,128,0.2)" : "var(--border)"}`,
                      opacity: loan.hidden ? 0.55 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text)",
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          ${loan.amount?.USD?.toFixed(2)}
                        </p>
                        <StatusBadge status={loan.state} />
                        {loan.hidden && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              background: "var(--border)",
                              padding: "2px 7px",
                              borderRadius: 99,
                            }}
                          >
                            مخفي
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                        {loan.notes && (
                          <p
                            style={{ fontSize: 12, color: "var(--text-muted)" }}
                          >
                            {loan.notes}
                          </p>
                        )}
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {new Date(loan.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>

                    {/* Toggle paid */}
                    <button
                      onClick={() => handleToggle(loan._id, loan.state)}
                      title={
                        loan.state === "paid"
                          ? "تحديد كغير مدفوع"
                          : "تحديد كمدفوع"
                      }
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "none",
                        background: "transparent",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--border)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <RefreshCw size={13} />
                    </button>

                    {/* Hide/Unhide */}
                    <button
                      onClick={() => handleHide(loan._id, !loan.hidden)}
                      title={loan.hidden ? "إظهار" : "إخفاء"}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "none",
                        background: "transparent",
                        color: loan.hidden ? "#f97316" : "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--border)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {loan.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setConfirmDelete(loan._id)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239,68,68,0.08)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <Pagination
                page={page}
                total={visibleLoans.length}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </>
          )}

          {/* Toggle show hidden */}
          {hiddenCount > 0 && (
            <button
              onClick={() => {
                setShowHidden((v) => !v);
                setPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 34,
                borderRadius: 8,
                border: "1px dashed var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: 13,
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#f97316";
                e.currentTarget.style.color = "#f97316";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {showHidden ? (
                <>
                  <EyeOff size={14} /> إخفاء السلف المخفية ({hiddenCount})
                </>
              ) : (
                <>
                  <Eye size={14} /> عرض السلف المخفية ({hiddenCount})
                </>
              )}
            </button>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف السلفة"
          message="هل أنت متأكد من حذف هذه السلفة؟"
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

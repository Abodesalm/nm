"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { Plus, Trash2, Award, HeartHandshake } from "lucide-react";

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

export function BonusesDrawer({
  open,
  onClose,
  employee,
  defaultExchange,
  onUpdate,
}: Props) {
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    type: "reward" as "reward" | "compensation",
    amount: { USD: 0, SP: 0, exchange: 0 },
    reason: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (open && employee) fetchBonuses();
  }, [open, employee]);

  async function fetchBonuses() {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}`);
    const json = await res.json();
    const sorted = [...(json.data?.bonuses ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setBonuses(sorted);
    setLoading(false);
  }

  const totalSP = bonuses.reduce((acc, b) => acc + (b.amount?.SP ?? 0), 0);
  const rewardsCount = bonuses.filter((b) => b.type === "reward").length;
  const compsCount = bonuses.length - rewardsCount;

  const paginated = bonuses.slice((page - 1) * limit, page * limit);

  async function handleAdd() {
    if (!form.amount.SP && !form.amount.USD) {
      setError("المبلغ مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/employees/${employee._id}/bonuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    setShowAdd(false);
    setForm({
      type: "reward",
      amount: { USD: 0, SP: 0, exchange: 0 },
      reason: "",
      date: new Date().toISOString().split("T")[0],
    });
    await fetchBonuses();
    onUpdate?.();
  }

  async function handleDelete(bonusId: string) {
    await fetch(`/api/employees/${employee._id}/bonuses`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bonusId }),
    });
    setConfirmDelete(null);
    await fetchBonuses();
    onUpdate?.();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`المكافآت والتعويضات — ${employee?.fullName}`}
      width={540}
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
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#8b5cf6",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                الإجمالي ({rewardsCount} مكافأة، {compsCount} تعويض)
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#8b5cf6",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {totalSP.toLocaleString("en")} ل.س
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
              <Plus size={14} /> إضافة
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
              {/* Type toggle */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {(
                  [
                    { value: "reward", label: "مكافأة", color: "#22c55e" },
                    {
                      value: "compensation",
                      label: "تعويض",
                      color: "#3b82f6",
                    },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `2px solid ${form.type === t.value ? t.color : "var(--border)"}`,
                      background:
                        form.type === t.value ? `${t.color}18` : "transparent",
                      color:
                        form.type === t.value ? t.color : "var(--text-muted)",
                      fontSize: 13,
                      fontFamily: "'Tajawal', sans-serif",
                      fontWeight: form.type === t.value ? 600 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
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
                  المبلغ
                </label>
                <MoneyInput
                  value={form.amount}
                  onChange={(val) => setForm({ ...form, amount: val })}
                  defaultExchange={defaultExchange}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    السبب
                  </label>
                  <input
                    style={inputStyle}
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    placeholder="سبب المكافأة/التعويض..."
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    التاريخ
                  </label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>
              )}

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

          {/* Bonuses list */}
          {bonuses.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              لا توجد مكافآت أو تعويضات بعد
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {paginated.map((b) => {
                  const isReward = b.type === "reward";
                  const color = isReward ? "#22c55e" : "#3b82f6";
                  const Icon = isReward ? Award : HeartHandshake;
                  return (
                    <div
                      key={b._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 9,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: `${color}18`,
                          color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
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
                            {(b.amount?.SP ?? 0).toLocaleString("en")} ل.س
                          </p>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color,
                              background: `${color}14`,
                              padding: "2px 8px",
                              borderRadius: 99,
                            }}
                          >
                            {isReward ? "مكافأة" : "تعويض"}
                          </span>
                        </div>
                        <p
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {b.reason ? `${b.reason} — ` : ""}
                          {new Date(b.date).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(b._id)}
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
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <Pagination
                page={page}
                total={bonuses.length}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف المكافأة/التعويض"
          message="هل أنت متأكد من الحذف؟ ستُحذف الفاتورة وحركة الخزينة المرتبطة."
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

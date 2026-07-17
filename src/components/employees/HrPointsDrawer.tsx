"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Plus, Trash2, Star, Coins } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: any;
  onUpdate?: () => void;
}

const MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
];

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

function fmtSP(n: number) {
  return (+n.toFixed(1)).toLocaleString("en");
}
function fmtUSD(n: number) {
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

/** value of one entry = points × pricePerPoint, per currency */
function entryValue(e: any) {
  const p = e.pricePerPoint;
  if (!p || (!p.SP && !p.USD)) return null;
  return {
    SP: (e.points ?? 0) * (p.SP ?? 0),
    USD: (e.points ?? 0) * (p.USD ?? 0),
  };
}

export function HrPointsDrawer({ open, onClose, employee, onUpdate }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [withPrice, setWithPrice] = useState(false);
  const [pricePerPoint, setPricePerPoint] = useState({
    USD: 0,
    SP: 0,
    exchange: 0,
  });
  const [defaultExchange, setDefaultExchange] = useState(15000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open && employee) {
      fetchPoints();
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.data?.defaultExchangeRate)
            setDefaultExchange(d.data.defaultExchangeRate);
        })
        .catch(() => {});
    }
  }, [open, employee]);

  async function fetchPoints() {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}`);
    const json = await res.json();
    const sorted = [...(json.data?.hrPoints ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setEntries(sorted);
    setLoading(false);
  }

  const totalPoints = entries.reduce((acc, e) => acc + (e.points ?? 0), 0);
  const totalValue = entries.reduce(
    (acc, e) => {
      const v = entryValue(e);
      if (v) {
        acc.SP += v.SP;
        acc.USD += v.USD;
      }
      return acc;
    },
    { SP: 0, USD: 0 },
  );

  // Group by month/year (entries already sorted newest-first)
  const months: {
    key: string;
    month: number;
    year: number;
    entries: any[];
    points: number;
    value: { SP: number; USD: number };
  }[] = [];
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let group = months.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        month: d.getMonth(),
        year: d.getFullYear(),
        entries: [],
        points: 0,
        value: { SP: 0, USD: 0 },
      };
      months.push(group);
    }
    group.entries.push(e);
    group.points += e.points ?? 0;
    const v = entryValue(e);
    if (v) {
      group.value.SP += v.SP;
      group.value.USD += v.USD;
    }
  }

  async function handleAdd() {
    const n = Number(points);
    if (!n || Number.isNaN(n)) {
      setError("عدد النقاط مطلوب (يمكن أن يكون سالباً للخصم)");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/employees/${employee._id}/hr-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: n,
        reason,
        pricePerPoint: withPrice ? pricePerPoint : null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    setShowAdd(false);
    setPoints("");
    setReason("");
    setWithPrice(false);
    setPricePerPoint({ USD: 0, SP: 0, exchange: 0 });
    await fetchPoints();
    onUpdate?.();
  }

  async function handleDelete(pointId: string) {
    await fetch(`/api/employees/${employee._id}/hr-points`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointId }),
    });
    setConfirmDelete(null);
    await fetchPoints();
    onUpdate?.();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`نقاط التقييم — ${employee?.fullName}`}
      width={520}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Totals + Add */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.25)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Star size={18} style={{ color: "#eab308" }} />
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#a16207",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    رصيد النقاط
                  </p>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#eab308",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {totalPoints}
                  </p>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Coins size={18} style={{ color: "#22c55e" }} />
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#15803d",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    القيمة الإجمالية
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#22c55e",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {fmtSP(totalValue.SP)} ل.س
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontWeight: 400,
                        marginRight: 6,
                      }}
                    >
                      ≈ ${fmtUSD(totalValue.USD)}
                    </span>
                  </p>
                </div>
              </div>
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
              <Plus size={14} /> منح نقاط
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1fr",
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
                    النقاط
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="+10"
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
                    السبب
                  </label>
                  <input
                    style={inputStyle}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="سبب منح النقاط..."
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                </div>
              </div>

              {/* Price per point (optional, locked per operation) */}
              {withPrice ? (
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
                    سعر النقطة الواحدة (لهذه العملية)
                  </label>
                  <MoneyInput
                    value={pricePerPoint}
                    onChange={setPricePerPoint}
                    defaultExchange={defaultExchange}
                  />
                  <button
                    onClick={() => {
                      setWithPrice(false);
                      setPricePerPoint({ USD: 0, SP: 0, exchange: 0 });
                    }}
                    style={{
                      alignSelf: "flex-start",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "'Tajawal', sans-serif",
                      padding: 0,
                    }}
                  >
                    × إزالة السعر
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setWithPrice(true)}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#f97316",
                    fontFamily: "'Tajawal', sans-serif",
                    padding: 0,
                  }}
                >
                  + تحديد سعر النقطة
                </button>
              )}

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
                  {saving ? "جاري الحفظ..." : "منح"}
                </button>
              </div>
            </div>
          )}

          {/* Entries grouped by month */}
          {entries.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              لا توجد نقاط بعد — امنح نقاطاً لمن قام بعمل جيد
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {months.map((g) => (
                <div key={g.key}>
                  {/* Month header with totals */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 9,
                      background: "rgba(249,115,22,0.06)",
                      border: "1px solid rgba(249,115,22,0.18)",
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text)",
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {MONTHS[g.month]} {g.year}
                    </span>
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#eab308",
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        {g.points > 0 ? "+" : ""}
                        {g.points} نقطة
                      </span>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#22c55e",
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        {fmtSP(g.value.SP)} ل.س
                        <span
                          style={{
                            fontSize: 10.5,
                            color: "var(--text-muted)",
                            fontWeight: 400,
                            marginRight: 4,
                          }}
                        >
                          ≈ ${fmtUSD(g.value.USD)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {g.entries.map((e) => {
                      const positive = (e.points ?? 0) >= 0;
                      const v = entryValue(e);
                      return (
                        <div
                          key={e._id}
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
                          <span
                            style={{
                              minWidth: 46,
                              textAlign: "center",
                              padding: "3px 8px",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              fontFamily: "'Cairo', sans-serif",
                              background: positive ? "#22c55e18" : "#ef444418",
                              color: positive ? "#22c55e" : "#ef4444",
                              flexShrink: 0,
                            }}
                          >
                            {positive ? "+" : ""}
                            {e.points}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                color: "var(--text)",
                                fontFamily: "'Tajawal', sans-serif",
                              }}
                            >
                              {e.reason || "بدون سبب محدد"}
                            </p>
                            <p
                              style={{
                                fontSize: 11.5,
                                color: "var(--text-muted)",
                              }}
                            >
                              {new Date(e.date).toLocaleDateString("en-GB")}
                              {e.pricePerPoint?.SP || e.pricePerPoint?.USD
                                ? ` — سعر النقطة: ${fmtSP(e.pricePerPoint.SP ?? 0)} ل.س`
                                : ""}
                            </p>
                          </div>
                          {v && (
                            <div
                              style={{ textAlign: "left", flexShrink: 0 }}
                            >
                              <p
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  color: v.SP >= 0 ? "#22c55e" : "#ef4444",
                                  fontFamily: "'Cairo', sans-serif",
                                }}
                              >
                                {fmtSP(v.SP)} ل.س
                              </p>
                              <p
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--text-muted)",
                                }}
                              >
                                ${fmtUSD(v.USD)}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => setConfirmDelete(e._id)}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف النقاط"
          message="هل أنت متأكد من حذف هذا السجل؟"
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

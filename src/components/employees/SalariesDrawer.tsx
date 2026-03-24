"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ChevronRight, ChevronLeft, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: any;
  defaultExchange: number;
  onUpdate?: () => void;
}

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
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

export function SalariesDrawer({
  open,
  onClose,
  employee,
  defaultExchange,
  onUpdate,
}: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const [amount, setAmount] = useState({ USD: 0, SP: 0, exchange: 0 });
  const [reward, setReward] = useState({ USD: 0, SP: 0, exchange: 0 });
  const [notes, setNotes] = useState("");
  const [takeLoans, setTakeLoans] = useState(false);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open && employee) fetchData();
  }, [open, employee]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}`);
    const json = await res.json();
    setSalaries(json.data?.salaries ?? []);
    setLoans(json.data?.loans ?? []);
    setLoading(false);
  }

  const yearSalaries = salaries.filter((s) => s.year === year);
  const totalPaid = yearSalaries.reduce(
    (acc, s) => acc + (s.amount?.USD ?? 0),
    0,
  );
  const totalRewards = yearSalaries.reduce(
    (acc, s) => acc + (s.reward?.USD ?? 0),
    0,
  );
  const unpaidLoans = loans.filter((l) => l.state === "unpaid" && !l.hidden);
  const unpaidTotal = unpaidLoans.reduce(
    (acc, l) => acc + (l.amount?.USD ?? 0),
    0,
  );

  function getSalary(monthIdx: number) {
    return yearSalaries.find((s) => s.month === monthIdx + 1);
  }

  function handleMonthClick(monthIdx: number) {
    const existing = getSalary(monthIdx);
    if (existing) return;
    setSelectedMonth(monthIdx);
    // Pre-fill with employee's default salary
    const defaultSalary = employee.salary ?? {
      USD: 0,
      SP: 0,
      exchange: defaultExchange,
    };
    setAmount({ ...defaultSalary });
    setReward({ USD: 0, SP: 0, exchange: defaultExchange });
    setNotes("");
    setTakeLoans(false);
  }

  // Calculate final amount
  const loansDeduction = takeLoans ? unpaidTotal : 0;
  const finalUSD = (amount.USD || 0) + (reward.USD || 0) - loansDeduction;

  async function handleSaveSalary() {
    if (selectedMonth === null) return;
    setSaving(true);

    // Save salary
    await fetch(`/api/employees/${employee._id}/salaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        reward,
        notes,
        month: selectedMonth + 1,
        year,
      }),
    });

    // Mark loans as paid if takeLoans is enabled
    if (takeLoans && unpaidLoans.length > 0) {
      await Promise.all(
        unpaidLoans.map((loan) =>
          fetch(`/api/employees/${employee._id}/loans`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loanId: loan._id, state: "paid" }),
          }),
        ),
      );
    }

    setSaving(false);
    setSelectedMonth(null);
    await fetchData();
    onUpdate?.();
  }

  async function handleDeleteSalary(salaryId: string) {
    await fetch(`/api/employees/${employee._id}/salaries`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryId }),
    });
    setConfirmDelete(null);
    await fetchData();
    onUpdate?.();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`الرواتب — ${employee?.fullName}`}
      width={560}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {[
              {
                label: "إجمالي الرواتب المدفوعة",
                value: `$${totalPaid.toFixed(2)}`,
                color: "#f97316",
              },
              {
                label: "إجمالي المكافآت",
                value: `$${totalRewards.toFixed(2)}`,
                color: "#22c55e",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color,
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Year navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setYear((y) => y - 1)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text)",
              }}
            >
              <ChevronRight size={14} />
            </button>
            <span
              className="font-title font-semibold"
              style={{ fontSize: 15, color: "var(--text)" }}
            >
              {year}
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text)",
              }}
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Months grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {MONTHS.map((monthName, i) => {
              const salary = getSalary(i);
              const isSelected = selectedMonth === i;
              const isCurrentMonth =
                i === now.getMonth() && year === now.getFullYear();

              return (
                <div
                  key={monthName}
                  onClick={() => handleMonthClick(i)}
                  style={{
                    borderRadius: 10,
                    border: `${isCurrentMonth && !salary ? "2px" : "1px"} solid ${
                      isSelected
                        ? "#f97316"
                        : salary
                          ? "rgba(34,197,94,0.3)"
                          : isCurrentMonth
                            ? "#f97316"
                            : "var(--border)"
                    }`,
                    background: salary
                      ? "rgba(34,197,94,0.06)"
                      : isSelected
                        ? "rgba(249,115,22,0.06)"
                        : isCurrentMonth
                          ? "rgba(249,115,22,0.04)"
                          : "var(--bg)",
                    padding: "10px 12px",
                    cursor: salary ? "default" : "pointer",
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                >
                  {/* Current month indicator */}
                  {isCurrentMonth && !salary && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#f97316",
                      }}
                    />
                  )}
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: salary
                        ? "#16a34a"
                        : isCurrentMonth
                          ? "#f97316"
                          : "var(--text)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {i + 1}. {monthName}
                  </p>
                  {salary ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <p style={{ fontSize: 11, color: "#16a34a" }}>
                        ${salary.amount?.USD?.toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(salary._id);
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: "none",
                          background: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {isCurrentMonth ? "الشهر الحالي" : "غير مدفوع"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Salary form */}
          {selectedMonth !== null && !getSalary(selectedMonth) && (
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <p
                className="font-title font-semibold"
                style={{ fontSize: 14, color: "var(--text)" }}
              >
                راتب {selectedMonth + 1}. {MONTHS[selectedMonth]} {year}
              </p>

              {/* Amount */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  الراتب
                </label>
                <MoneyInput
                  value={amount}
                  onChange={setAmount}
                  defaultExchange={defaultExchange}
                />
              </div>

              {/* Reward */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  المكافأة
                </label>
                <MoneyInput
                  value={reward}
                  onChange={setReward}
                  defaultExchange={defaultExchange}
                />
              </div>

              {/* Take loans toggle */}
              {unpaidLoans.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: takeLoans
                      ? "rgba(239,68,68,0.06)"
                      : "var(--surface)",
                    border: `1px solid ${takeLoans ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: takeLoans ? "#ef4444" : "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      خصم السلف ({unpaidLoans.length} سلفة)
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      إجمالي السلف: ${unpaidTotal.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setTakeLoans(!takeLoans)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 99,
                      background: takeLoans ? "#ef4444" : "var(--border)",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        right: takeLoans ? 3 : undefined,
                        left: takeLoans ? undefined : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "all 0.2s",
                      }}
                    />
                  </button>
                </div>
              )}

              {/* Summary */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                    marginBottom: 4,
                  }}
                >
                  ملخص الراتب
                </p>
                {[
                  {
                    label: "الراتب الأساسي",
                    value: amount.USD,
                    color: "var(--text)",
                  },
                  { label: "المكافأة", value: reward.USD, color: "#22c55e" },
                  ...(takeLoans
                    ? [
                        {
                          label: "خصم السلف",
                          value: -loansDeduction,
                          color: "#ef4444",
                        },
                      ]
                    : []),
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color,
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {value >= 0 ? "+" : ""}${value.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    height: 1,
                    background: "var(--border)",
                    margin: "4px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    الإجمالي
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#f97316",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    ${finalUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes */}
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setSelectedMonth(null)}
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
                  onClick={handleSaveSalary}
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
                  {saving ? "جاري الحفظ..." : "حفظ الراتب"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف الراتب"
          message="هل أنت متأكد من حذف هذا الراتب؟"
          confirmLabel="حذف"
          onConfirm={() => handleDeleteSalary(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

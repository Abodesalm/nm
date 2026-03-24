"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: any;
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
const DAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

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

export function AbsentsDrawer({ open, onClose, employee }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [absents, setAbsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [form, setForm] = useState({ excused: false, reason: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open && employee) fetchAbsents();
  }, [open, employee]);

  async function fetchAbsents() {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}`);
    const json = await res.json();
    setAbsents(json.data?.absents ?? []);
    setLoading(false);
  }

  // Get absents for current month/year
  const monthAbsents = absents.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalAbsents = monthAbsents.length;
  const excusedAbsents = monthAbsents.filter((a) => a.excused).length;
  const unexcusedAbsents = totalAbsents - excusedAbsents;

  // Get absent for a specific day
  function getAbsent(day: number) {
    return monthAbsents.find((a) => new Date(a.date).getDate() === day);
  }

  // Calendar days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  function handleDayClick(day: number) {
    const absent = getAbsent(day);
    setSelectedDay(day);
    if (absent) {
      setForm({
        excused: absent.excused,
        reason: absent.reason ?? "",
        note: absent.note ?? "",
      });
    } else {
      setForm({ excused: false, reason: "", note: "" });
    }
  }

  async function handleSaveAbsent() {
    if (selectedDay === null) return;
    setSaving(true);
    const date = new Date(year, month, selectedDay);
    const existing = getAbsent(selectedDay);

    if (existing) {
      await fetch(`/api/employees/${employee._id}/absents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          absentId: existing._id,
          data: { ...form, isAbsent: true },
        }),
      });
    } else {
      await fetch(`/api/employees/${employee._id}/absents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, isAbsent: true, ...form }),
      });
    }
    setSaving(false);
    setSelectedDay(null);
    fetchAbsents();
  }

  async function handleDeleteAbsent(absentId: string) {
    await fetch(`/api/employees/${employee._id}/absents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ absentId }),
    });
    setConfirmDelete(null);
    setSelectedDay(null);
    fetchAbsents();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`غيابات — ${employee?.fullName}`}
      width={520}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            {[
              {
                label: "إجمالي الغيابات",
                value: totalAbsents,
                color: "#f97316",
              },
              { label: "بعذر", value: excusedAbsents, color: "#22c55e" },
              { label: "بدون عذر", value: unexcusedAbsents, color: "#ef4444" },
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
                    fontSize: 22,
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

          {/* Month navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={prevMonth}
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
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
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

          {/* Calendar */}
          <div>
            {/* Day headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                marginBottom: 4,
              }}
            >
              {DAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    padding: "4px 0",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {/* Empty cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const absent = getAbsent(day);
                const isSelected = selectedDay === day;
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 8,
                      border: isSelected
                        ? "2px solid #f97316"
                        : "1px solid var(--border)",
                      background: absent
                        ? absent.excused
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)"
                        : isSelected
                          ? "rgba(249,115,22,0.08)"
                          : "var(--bg)",
                      color: absent
                        ? absent.excused
                          ? "#16a34a"
                          : "#dc2626"
                        : isToday
                          ? "#f97316"
                          : "var(--text)",
                      fontSize: 13,
                      fontFamily: "'Cairo', sans-serif",
                      fontWeight: isToday || absent ? 700 : 400,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day form */}
          {selectedDay !== null && (
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p
                  className="font-title font-semibold"
                  style={{ fontSize: 14, color: "var(--text)" }}
                >
                  يوم {selectedDay} {MONTHS[month]}
                </p>
                {getAbsent(selectedDay) && (
                  <button
                    onClick={() =>
                      setConfirmDelete(getAbsent(selectedDay)!._id)
                    }
                    style={{
                      fontSize: 12,
                      color: "#ef4444",
                      background: "rgba(239,68,68,0.08)",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontFamily: "'Tajawal', sans-serif",
                    }}
                  >
                    حذف الغياب
                  </button>
                )}
              </div>

              {/* Excused toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setForm({ ...form, excused: !form.excused })}
                  style={{
                    width: 40,
                    height: 22,
                    borderRadius: 99,
                    background: form.excused ? "#22c55e" : "var(--border)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      right: form.excused ? 3 : undefined,
                      left: form.excused ? undefined : 3,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "all 0.2s",
                    }}
                  />
                </button>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text)",
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  {form.excused ? "غياب بعذر" : "غياب بدون عذر"}
                </span>
              </div>

              {/* Reason */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="سبب الغياب..."
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Note */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  ملاحظة
                </label>
                <input
                  style={inputStyle}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="ملاحظة إضافية..."
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setSelectedDay(null)}
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
                  onClick={handleSaveAbsent}
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
                  {saving
                    ? "جاري الحفظ..."
                    : getAbsent(selectedDay)
                      ? "تحديث"
                      : "تسجيل غياب"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف الغياب"
          message="هل أنت متأكد من حذف هذا الغياب؟"
          confirmLabel="حذف"
          onConfirm={() => handleDeleteAbsent(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

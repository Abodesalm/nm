"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { Spinner } from "@/components/shared/Spinner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item: any;
}

const ACTION_TYPES = [
  { value: "stock_in", label: "إدخال مخزون", color: "#22c55e" },
  { value: "stock_out", label: "إخراج مخزون", color: "#ef4444" },
  { value: "consume", label: "استهلاك", color: "#f97316" },
  { value: "borrow", label: "استعارة", color: "#3b82f6" },
  { value: "return", label: "إرجاع", color: "#8b5cf6" },
];

const GOAL_MODELS = [
  { value: "employees", label: "موظف" },
  { value: "customers", label: "زبون" },
  { value: "points", label: "نقطة" },
];

const inputStyle: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13.5,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

export function ActionDrawer({ open, onClose, onSaved, item }: Props) {
  const [actionType, setActionType] = useState("stock_in");
  const [quantity, setQuantity] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeResults, setEmployeeResults] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [goalModel, setGoalModel] = useState("");
  const [goalSearch, setGoalSearch] = useState("");
  const [goalResults, setGoalResults] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setActionType("stock_in");
      setQuantity("");
      setEmployeeSearch("");
      setSelectedEmployee(null);
      setGoalModel("");
      setGoalSearch("");
      setSelectedGoal(null);
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (employeeSearch.trim().length < 2) {
      setEmployeeResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/employees?search=${employeeSearch}&limit=5`,
      );
      const json = await res.json();
      setEmployeeResults(json.data?.employees ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  useEffect(() => {
    if (!goalModel || goalSearch.trim().length < 2) {
      setGoalResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/${goalModel}?search=${goalSearch}&limit=5`);
      const json = await res.json();
      const key =
        goalModel === "employees"
          ? "employees"
          : goalModel === "customers"
            ? "customers"
            : "points";
      setGoalResults(json.data?.[key] ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [goalModel, goalSearch]);

  async function handleSave() {
    if (!quantity || Number(quantity) <= 0) {
      setError("الكمية مطلوبة وأكبر من صفر");
      return;
    }

    setSaving(true);
    setError("");

    const body: any = {
      type: actionType,
      quantity: Number(quantity),
      notes,
      employee: selectedEmployee?._id ?? null,
      goal_model: goalModel || null,
      goal_id: selectedGoal?._id ?? null,
    };

    const res = await fetch(`/api/storage/${item._id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);

    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    onSaved();
    onClose();
  }

  function field(label: string, content: React.ReactNode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {label}
        </label>
        {content}
      </div>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`إضافة حركة — ${item?.name}`}
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Action type */}
        {field(
          "نوع الحركة",
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {ACTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setActionType(t.value)}
                style={{
                  height: 38,
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `2px solid ${actionType === t.value ? t.color : "var(--border)"}`,
                  background:
                    actionType === t.value ? `${t.color}18` : "transparent",
                  color: actionType === t.value ? t.color : "var(--text-muted)",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: actionType === t.value ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>,
        )}

        {/* Quantity + Date */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {field(
            "الكمية",
            <input
              style={inputStyle}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
          {field(
            "التاريخ",
            <input
              style={inputStyle}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
        </div>

        {/* Employee search */}
        {field(
          "الموظف المسؤول",
          <div style={{ position: "relative" }}>
            {selectedEmployee ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 12px",
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: "var(--text)",
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  {selectedEmployee.fullName} #{selectedEmployee.id_num}
                </span>
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEmployeeSearch("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <input
                  style={inputStyle}
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="ابحث عن موظف..."
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                {employeeResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      left: 0,
                      marginTop: 4,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      zIndex: 100,
                      overflow: "hidden",
                    }}
                  >
                    {employeeResults.map((emp) => (
                      <div
                        key={emp._id}
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setEmployeeSearch("");
                          setEmployeeResults([]);
                        }}
                        style={{
                          padding: "9px 12px",
                          cursor: "pointer",
                          fontSize: 13.5,
                          color: "var(--text)",
                          fontFamily: "'Tajawal', sans-serif",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {emp.fullName}{" "}
                        <span
                          style={{ color: "var(--text-muted)", fontSize: 12 }}
                        >
                          #{emp.id_num}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>,
        )}

        {/* Goal */}
        {field(
          "الوجهة",
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={goalModel}
              onChange={(e) => {
                setGoalModel(e.target.value);
                setSelectedGoal(null);
                setGoalSearch("");
              }}
            >
              <option value="">بدون وجهة</option>
              {GOAL_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {goalModel && (
              <div style={{ position: "relative" }}>
                {selectedGoal ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 12px",
                      height: 40,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13.5,
                        color: "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      {selectedGoal.fullName ??
                        selectedGoal.name ??
                        selectedGoal.point_number}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedGoal(null);
                        setGoalSearch("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        fontSize: 16,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      style={inputStyle}
                      value={goalSearch}
                      onChange={(e) => setGoalSearch(e.target.value)}
                      placeholder={`ابحث عن ${GOAL_MODELS.find((m) => m.value === goalModel)?.label}...`}
                      onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                    {goalResults.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          left: 0,
                          marginTop: 4,
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          zIndex: 100,
                          overflow: "hidden",
                        }}
                      >
                        {goalResults.map((g: any) => (
                          <div
                            key={g._id}
                            onClick={() => {
                              setSelectedGoal(g);
                              setGoalSearch("");
                              setGoalResults([]);
                            }}
                            style={{
                              padding: "9px 12px",
                              cursor: "pointer",
                              fontSize: 13.5,
                              color: "var(--text)",
                              fontFamily: "'Tajawal', sans-serif",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "var(--bg)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            {g.fullName ?? g.name ?? `نقطة #${g.point_number}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>,
        )}

        {/* Notes */}
        {field(
          "ملاحظات",
          <textarea
            style={{
              ...inputStyle,
              height: 70,
              padding: "10px 12px",
              resize: "vertical",
            }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات..."
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />,
        )}

        {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 9,
              border: "none",
              background: "#f97316",
              color: "#fff",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {saving && <Spinner size={16} />}
            {saving ? "جاري الحفظ..." : "حفظ الحركة"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

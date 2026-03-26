"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { Spinner } from "@/components/shared/Spinner";
import { MoneyInput } from "@/components/shared/MoneyInput";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item: any;
  defaultExchange?: number;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "'Cairo', sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function ActionDrawer({ open, onClose, onSaved, item, defaultExchange = 0 }: Props) {
  const [actionType, setActionType] = useState("stock_in");
  const [quantity, setQuantity] = useState("");
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [goalModel, setGoalModel] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCost, setShowCost] = useState(false);
  const [cost, setCost] = useState({ USD: 0, SP: 0, exchange: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // For points: load all and filter client-side
  const [allPoints, setAllPoints] = useState<any[]>([]);
  const [pointSearch, setPointSearch] = useState("");

  // For employees/customers: live search
  const [goalSearch, setGoalSearch] = useState("");
  const [goalResults, setGoalResults] = useState<any[]>([]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setActionType("stock_in");
      setQuantity("");
      setEmployeeSearch("");
      setSelectedEmployee(null);
      setGoalModel("");
      setSelectedGoal(null);
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowCost(false);
      setCost({ USD: 0, SP: 0, exchange: 0 });
      setError("");
      setAllPoints([]);
      setPointSearch("");
      setGoalSearch("");
      setGoalResults([]);
    }
  }, [open]);

  // Load all points when goal = "points"
  useEffect(() => {
    if (goalModel === "points") {
      fetch("/api/points?limit=500")
        .then((r) => r.json())
        .then((d) => setAllPoints(Array.isArray(d.data) ? d.data : []));
    } else {
      setAllPoints([]);
      setPointSearch("");
    }
    setSelectedGoal(null);
    setGoalSearch("");
    setGoalResults([]);
  }, [goalModel]);

  // Live search for employees/customers
  useEffect(() => {
    if (goalModel === "points" || !goalModel || goalSearch.trim().length < 2) {
      setGoalResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/${goalModel}?search=${goalSearch}&limit=8`);
      const json = await res.json();
      const key = goalModel === "employees" ? "employees" : "customers";
      setGoalResults(json.data?.[key] ?? json.data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [goalModel, goalSearch]);

  // Load all employees once when drawer opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/employees?limit=500")
      .then((r) => r.json())
      .then((d) => setAllEmployees(d.data?.employees ?? []));
  }, [open]);

  const filteredEmployees = employeeSearch.trim()
    ? allEmployees.filter(
        (e) =>
          e.fullName?.includes(employeeSearch) ||
          e.id_num?.toString().includes(employeeSearch),
      )
    : allEmployees.slice(0, 8);

  const filteredPoints = allPoints.filter((p) => {
    const q = pointSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(p.point_number).includes(q) ||
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.region ?? "").toLowerCase().includes(q)
    );
  });

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
      cost: showCost ? cost : null,
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

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`إضافة حركة — ${item?.name}`}
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Action type */}
        <Field label="نوع الحركة">
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
          </div>
        </Field>

        {/* Quantity + Date */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Field label="الكمية">
            <input
              style={inputStyle}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label="التاريخ">
            <input
              style={inputStyle}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>

        {/* Employee search */}
        <Field label="الموظف المسؤول">
          <SearchPicker
            selected={selectedEmployee}
            displayKey={(e) => `${e.fullName} #${e.id_num}`}
            onClear={() => {
              setSelectedEmployee(null);
              setEmployeeSearch("");
            }}
            search={employeeSearch}
            onSearchChange={setEmployeeSearch}
            results={filteredEmployees}
            onSelect={(e) => {
              setSelectedEmployee(e);
              setEmployeeSearch("");
            }}
            resultLabel={(e) => (
              <>
                {e.fullName}{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  #{e.id_num}
                </span>
              </>
            )}
            placeholder="ابحث عن موظف..."
          />
        </Field>

        {/* Goal */}
        <Field label="الوجهة">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={goalModel}
              onChange={(e) => setGoalModel(e.target.value)}
            >
              <option value="">بدون وجهة</option>
              {GOAL_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Points: load-all + client-side filter */}
            {goalModel === "points" &&
              (selectedGoal ? (
                <SelectedTag
                  label={`#${selectedGoal.point_number}${selectedGoal.name ? ` — ${selectedGoal.name}` : ""}`}
                  onClear={() => {
                    setSelectedGoal(null);
                    setPointSearch("");
                  }}
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <input
                    style={inputStyle}
                    value={pointSearch}
                    onChange={(e) => setPointSearch(e.target.value)}
                    placeholder="ابحث بالرقم أو الاسم أو المنطقة..."
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                  <div
                    style={{
                      maxHeight: 180,
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                    }}
                  >
                    {allPoints.length === 0 ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--text-muted)",
                          fontFamily: "'Tajawal', sans-serif",
                        }}
                      >
                        جاري التحميل...
                      </div>
                    ) : filteredPoints.length === 0 ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--text-muted)",
                          fontFamily: "'Tajawal', sans-serif",
                        }}
                      >
                        لا توجد نتائج
                      </div>
                    ) : (
                      filteredPoints.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => {
                            setSelectedGoal(p);
                            setPointSearch("");
                          }}
                          style={{
                            padding: "9px 12px",
                            cursor: "pointer",
                            fontSize: 13.5,
                            color: "var(--text)",
                            fontFamily: "'Tajawal', sans-serif",
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--bg)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 12,
                              color: "#f97316",
                              fontWeight: 700,
                            }}
                          >
                            #{p.point_number}
                          </span>
                          <span style={{ flex: 1 }}>
                            {p.name || (
                              <span style={{ color: "var(--text-muted)" }}>
                                بدون اسم
                              </span>
                            )}
                          </span>
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {p.region}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

            {/* Employees / Customers: live search */}
            {(goalModel === "employees" || goalModel === "customers") && (
              <SearchPicker
                selected={selectedGoal}
                displayKey={(g) =>
                  g.fullName ?? g.name ?? String(g.customer_number ?? "")
                }
                onClear={() => {
                  setSelectedGoal(null);
                  setGoalSearch("");
                }}
                search={goalSearch}
                onSearchChange={setGoalSearch}
                results={goalResults}
                onSelect={(g) => {
                  setSelectedGoal(g);
                  setGoalSearch("");
                  setGoalResults([]);
                }}
                resultLabel={(g) =>
                  g.fullName ?? g.name ?? `#${g.customer_number}`
                }
                placeholder={`ابحث عن ${GOAL_MODELS.find((m) => m.value === goalModel)?.label}...`}
              />
            )}
          </div>
        </Field>

        {/* Notes */}
        <Field label="ملاحظات">
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
          />
        </Field>

        {/* Cost (optional) */}
        {showCost ? (
          <Field label="التكلفة (اختياري)">
            <MoneyInput
              value={cost}
              onChange={setCost}
              defaultExchange={defaultExchange}
            />
            <button
              onClick={() => { setShowCost(false); setCost({ USD: 0, SP: 0, exchange: 0 }); }}
              style={{
                alignSelf: "flex-start",
                marginTop: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
                padding: 0,
              }}
            >
              × إزالة التكلفة
            </button>
          </Field>
        ) : (
          <button
            onClick={() => setShowCost(true)}
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
            + إضافة تكلفة
          </button>
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
              boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
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

/** Reusable search-picker for employee/customer live search */
function SearchPicker({
  selected,
  displayKey,
  onClear,
  search,
  onSearchChange,
  results,
  onSelect,
  resultLabel,
  placeholder,
}: {
  selected: any;
  displayKey: (item: any) => string;
  onClear: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  results: any[];
  onSelect: (item: any) => void;
  resultLabel: (item: any) => React.ReactNode;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  if (selected)
    return <SelectedTag label={displayKey(selected)} onClear={onClear} />;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={inputStyle}
        value={search}
        onChange={(e) => { onSearchChange(e.target.value); setOpen(true); }}
        onFocus={(e) => { e.target.style.borderColor = "#f97316"; setOpen(true); }}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
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
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {results.map((item) => (
            <div
              key={item._id}
              onMouseDown={() => { onSelect(item); setOpen(false); }}
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
              {resultLabel(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectedTag({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        height: 40,
        borderRadius: 8,
        border: "1px solid #f97316",
        background: "rgba(249,115,22,0.06)",
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
        {label}
      </span>
      <button
        onClick={onClear}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

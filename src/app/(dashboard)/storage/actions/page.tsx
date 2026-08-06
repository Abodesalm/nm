"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { objectIdDate, isSameLocalDay } from "@/lib/utils";
import { PageSpinner } from "@/components/shared/Spinner";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ActionDrawer } from "@/components/storage/ActionDrawer";
import { downloadXLSX } from "@/lib/exportXLSX";
import {
  ArrowRight,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  RotateCcw,
  Minus,
  Package,
  StickyNote,
  FileDown,
  MoreHorizontal,
  Lock,
} from "lucide-react";

const ACTION_TYPES: {
  value: string;
  label: string;
  color: string;
  icon: any;
}[] = [
  { value: "stock_in", label: "إدخال مخزون", color: "#22c55e", icon: TrendingUp },
  { value: "stock_out", label: "إخراج مخزون", color: "#ef4444", icon: TrendingDown },
  { value: "consume", label: "استهلاك", color: "#f97316", icon: Minus },
  { value: "usage", label: "استخدام", color: "#eab308", icon: Minus },
  { value: "borrow", label: "استعارة", color: "#3b82f6", icon: RefreshCw },
  { value: "custody", label: "أمانة", color: "#14b8a6", icon: RefreshCw },
  { value: "return", label: "إرجاع", color: "#8b5cf6", icon: RotateCcw },
];
/** "أخرى" — only selectable from within a locked دخل/خرج page; direction comes from the page, not the type */
const OTHER_META = { value: "other", label: "أخرى", color: "#64748b", icon: MoreHorizontal };
const TYPE_META = Object.fromEntries(
  [...ACTION_TYPES, OTHER_META].map((t) => [t.value, t]),
);
const INCREASING_TYPES = ["stock_in", "return"];
const DECREASING_TYPES = ["stock_out", "consume", "usage", "borrow", "custody"];

const GOAL_AR: Record<string, string> = {
  employees: "موظف",
  customers: "زبون",
  points: "علبة",
};

const MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  width: "100%",
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

/** Generic live-search picker used for the item/employee filters */
function EntityPicker({
  selected,
  onSelect,
  onClear,
  search,
  onSearchChange,
  results,
  displayLabel,
  resultLabel,
  placeholder,
}: {
  selected: any;
  onSelect: (v: any) => void;
  onClear: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  results: any[];
  displayLabel: (v: any) => string;
  resultLabel: (v: any) => React.ReactNode;
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

  if (selected) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 38,
          padding: "0 10px 0 8px",
          borderRadius: 8,
          border: "1.5px solid #f97316",
          background: "rgba(249,115,22,0.08)",
          color: "#f97316",
          fontSize: 13,
          fontFamily: "'Tajawal', sans-serif",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayLabel(selected)}
        </span>
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#f97316",
            padding: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={inputStyle}
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            left: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {results.map((r) => (
            <div
              key={r._id}
              onMouseDown={() => {
                onSelect(r);
                setOpen(false);
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
              {resultLabel(r)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StorageActionsLogInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // A RESTRICTION flag, not a grant: when set, this user may only delete an
  // action on the day it was recorded. Mirrors requireDeletableToday() —
  // the UI lock is convenience, the server check is the guarantee.
  const sameDayDeleteOnly =
    !(session?.user as any)?.isSuperAdmin &&
    (session?.user as any)?.permissions?.find((p: any) => p.section === "storage")
      ?.actions?.action_delete_same_day_only === true;

  // Isolation: دخل and خرج are locked, separate pages that share this
  // component. There is no way to reach the other direction's data or
  // add-form from within one — every filter, chip, and endpoint call below
  // is scoped to `direction` whenever it's set.
  const rawDirection = searchParams.get("direction");
  const direction: "in" | "out" | null =
    rawDirection === "in" || rawDirection === "out" ? rawDirection : null;
  const chipTypes =
    direction === "in"
      ? [...ACTION_TYPES.filter((t) => INCREASING_TYPES.includes(t.value)), OTHER_META]
      : direction === "out"
        ? [...ACTION_TYPES.filter((t) => DECREASING_TYPES.includes(t.value)), OTHER_META]
        : ACTION_TYPES;

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemResults, setItemResults] = useState<any[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [empSearch, setEmpSearch] = useState("");
  const [empResults, setEmpResults] = useState<any[]>([]);

  const [types, setTypes] = useState<string[]>([]);
  const [timeMode, setTimeMode] = useState<"none" | "range" | "month">("none");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");

  const [defaultExchange, setDefaultExchange] = useState(15000);
  const [addOpen, setAddOpen] = useState(false);
  const [viewRow, setViewRow] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Reset the type-chip refinement whenever the locked direction changes
  // (e.g. navigating directly between ?direction=in and ?direction=out)
  useEffect(() => {
    setTypes([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setDefaultExchange(d.data?.defaultExchangeRate ?? 15000))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (itemSearch.trim().length < 2) {
      setItemResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/storage?search=${encodeURIComponent(itemSearch)}&limit=8`,
      );
      const json = await res.json();
      setItemResults(json.data?.items ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [itemSearch]);

  useEffect(() => {
    if (empSearch.trim().length < 2) {
      setEmpResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/employees?search=${encodeURIComponent(empSearch)}&limit=8`,
      );
      const json = await res.json();
      setEmpResults(json.data?.employees ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch]);

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (direction) params.set("direction", direction);
    if (selectedItem) params.set("item", selectedItem._id);
    if (selectedEmployee) params.set("employee", selectedEmployee._id);
    if (types.length) params.set("types", types.join(","));
    if (timeMode === "range") {
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
    } else if (timeMode === "month") {
      params.set("month", String(month));
      params.set("year", String(year));
    }
    if (minQty) params.set("minQty", minQty);
    if (maxQty) params.set("maxQty", maxQty);
    return params;
  }, [
    direction,
    selectedItem,
    selectedEmployee,
    types,
    timeMode,
    dateFrom,
    dateTo,
    month,
    year,
    minQty,
    maxQty,
  ]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const params = buildFilterParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    const res = await fetch(`/api/storage/actions?${params}`);
    const json = await res.json();
    if (json.status !== "success") {
      setForbidden(true);
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setForbidden(false);
    setRows(json.data?.actions ?? []);
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }, [page, limit, buildFilterParams]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedItem,
    selectedEmployee,
    types,
    timeMode,
    dateFrom,
    dateTo,
    month,
    year,
    minQty,
    maxQty,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  function toggleType(v: string) {
    setTypes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function clearFilters() {
    setSelectedItem(null);
    setItemSearch("");
    setSelectedEmployee(null);
    setEmpSearch("");
    setTypes([]);
    setTimeMode("none");
    setDateFrom("");
    setDateTo("");
    setMinQty("");
    setMaxQty("");
  }

  const hasFilters =
    !!selectedItem ||
    !!selectedEmployee ||
    types.length > 0 ||
    timeMode !== "none" ||
    !!minQty ||
    !!maxQty;

  async function handleDeleteRow(row: any) {
    await fetch("/api/storage/actions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storageItem: row.item._id,
        actionId: row._id,
        direction: direction ?? undefined,
      }),
    });
    setConfirmDelete(null);
    fetchRows();
  }

  async function handleExport() {
    setExporting(true);
    const params = buildFilterParams();
    params.set("page", "1");
    params.set("limit", "10000");

    const res = await fetch(`/api/storage/actions?${params}`);
    const json = await res.json();
    const exportRows = (json.data?.actions ?? []).map((row: any) => ({
      العنصر: row.item?.name ?? "",
      الفئة: row.item?.category ?? "",
      النوع: TYPE_META[row.type]?.label ?? row.type,
      الكمية:
        row.type === "other"
          ? `${row.flowDirection === "in" ? "+" : "-"}${row.quantity}`
          : row.quantity,
      الوحدة: row.item?.unit ?? "",
      الموظف: row.employee?.fullName ?? "—",
      الوجهة: row.goal_model ? (GOAL_AR[row.goal_model] ?? row.goal_model) : "—",
      التاريخ: new Date(row.date).toLocaleDateString("en-GB"),
      الملاحظات: row.notes ?? "",
      "نوع المبلغ": row.cost?.USD || row.cost?.SP ? (row.gain ? "مكسب" : "تكلفة") : "",
      "المبلغ (USD)": row.cost?.USD ?? "",
      "المبلغ (ل.س)": row.cost?.SP ?? "",
    }));
    downloadXLSX(exportRows, `سجل-حركات-المخزون-${new Date().toISOString().slice(0, 10)}`);
    setExporting(false);
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    fontFamily: "'Cairo', sans-serif",
    textAlign: "right",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: 13.5,
    color: "var(--text)",
    fontFamily: "'Tajawal', sans-serif",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/storage")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowRight size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1
            className="font-title font-bold"
            style={{
              fontSize: 21,
              color:
                direction === "in"
                  ? "#22c55e"
                  : direction === "out"
                    ? "#ef4444"
                    : "var(--text)",
            }}
          >
            {direction === "in"
              ? "سجل الدخل"
              : direction === "out"
                ? "سجل الخرج"
                : "سجل حركات المخزون"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {direction === "in"
              ? "كل حركات الدخل التي تزيد كمية عناصر المستودع"
              : direction === "out"
                ? "كل حركات الخرج التي تنقص كمية عناصر المستودع"
                : "كل الحركات عبر جميع عناصر المستودع"}
          </p>
        </div>
        {!forbidden && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 16px",
                borderRadius: 9,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 14,
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 600,
                cursor: exporting ? "not-allowed" : "pointer",
                opacity: exporting ? 0.7 : 1,
              }}
            >
              <FileDown size={16} /> {exporting ? "جاري التصدير..." : "تصدير Excel"}
            </button>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 18px",
                borderRadius: 9,
                border: "none",
                background: "#f97316",
                color: "#fff",
                fontSize: 14,
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
              }}
            >
              <Plus size={16} /> إضافة حركة
            </button>
          </div>
        )}
      </div>

      {forbidden ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "60px 20px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <Lock size={28} style={{ color: "var(--text-muted)" }} />
          <p
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            ليس لديك صلاحية لعرض هذه الصفحة
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            تحتاج صلاحية{" "}
            {direction === "in" ? "الوصول إلى صفحة الدخل" : "الوصول إلى صفحة الخرج"}
            {" "}للمتابعة — تواصل مع مسؤول النظام.
          </p>
        </div>
      ) : (
      <>
      {/* Filters */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Row 1: item, employee, quantity range */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.4fr 0.8fr 0.8fr",
            gap: 10,
          }}
        >
          <EntityPicker
            selected={selectedItem}
            onSelect={setSelectedItem}
            onClear={() => {
              setSelectedItem(null);
              setItemSearch("");
            }}
            search={itemSearch}
            onSearchChange={setItemSearch}
            results={itemResults}
            displayLabel={(it) => it.name}
            resultLabel={(it) => (
              <>
                {it.name}{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  ({it.category})
                </span>
              </>
            )}
            placeholder="فلترة بالعنصر..."
          />
          <EntityPicker
            selected={selectedEmployee}
            onSelect={setSelectedEmployee}
            onClear={() => {
              setSelectedEmployee(null);
              setEmpSearch("");
            }}
            search={empSearch}
            onSearchChange={setEmpSearch}
            results={empResults}
            displayLabel={(e) => `${e.fullName} #${e.id_num}`}
            resultLabel={(e) => (
              <>
                {e.fullName}{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  #{e.id_num}
                </span>
              </>
            )}
            placeholder="فلترة بالموظف..."
          />
          <input
            style={inputStyle}
            type="number"
            placeholder="أقل كمية"
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
          />
          <input
            style={inputStyle}
            type="number"
            placeholder="أعلى كمية"
            value={maxQty}
            onChange={(e) => setMaxQty(e.target.value)}
          />
        </div>

        {/* Row 2: time filter */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            style={{ ...selectStyle, width: 160 }}
            value={timeMode}
            onChange={(e) => setTimeMode(e.target.value as any)}
          >
            <option value="none">كل الأوقات</option>
            <option value="range">نطاق تواريخ</option>
            <option value="month">شهر محدد</option>
          </select>

          {timeMode === "range" && (
            <>
              <input
                style={{ ...inputStyle, width: 150 }}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                إلى
              </span>
              <input
                style={{ ...inputStyle, width: 150 }}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </>
          )}

          {timeMode === "month" && (
            <>
              <select
                style={{ ...selectStyle, width: 140 }}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                style={{ ...selectStyle, width: 100 }}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Row 3: type chips (+ cross-direction presets only in the unlocked overview) */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {!direction && (
            <>
              <button
                onClick={() => setTypes([])}
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 20,
                  border: `1.5px solid ${types.length === 0 ? "#f97316" : "var(--border)"}`,
                  background: types.length === 0 ? "rgba(249,115,22,0.1)" : "transparent",
                  color: types.length === 0 ? "#f97316" : "var(--text-muted)",
                  fontSize: 12,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                الكل
              </button>
              <button
                onClick={() => setTypes(INCREASING_TYPES)}
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 20,
                  border: "1.5px solid #22c55e",
                  background:
                    types.length === INCREASING_TYPES.length &&
                    INCREASING_TYPES.every((t) => types.includes(t))
                      ? "rgba(34,197,94,0.12)"
                      : "transparent",
                  color: "#22c55e",
                  fontSize: 12,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                دخل
              </button>
              <button
                onClick={() => setTypes(DECREASING_TYPES)}
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 20,
                  border: "1.5px solid #ef4444",
                  background:
                    types.length === DECREASING_TYPES.length &&
                    DECREASING_TYPES.every((t) => types.includes(t))
                      ? "rgba(239,68,68,0.12)"
                      : "transparent",
                  color: "#ef4444",
                  fontSize: 12,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                خرج
              </button>

              <span style={{ width: 1, height: 20, background: "var(--border)" }} />
            </>
          )}

          {chipTypes.map((t) => {
            const active = types.includes(t.value);
            return (
              <button
                key={t.value}
                onClick={() => toggleType(t.value)}
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 20,
                  border: `1.5px solid ${active ? t.color : "var(--border)"}`,
                  background: active ? `${t.color}18` : "transparent",
                  color: active ? t.color : "var(--text-muted)",
                  fontSize: 12,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: 12,
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                marginRight: "auto",
              }}
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <PageSpinner />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>العنصر</th>
                    <th style={thStyle}>النوع</th>
                    <th style={thStyle}>الكمية</th>
                    <th style={thStyle}>الموظف</th>
                    <th style={thStyle}>الوجهة</th>
                    <th style={thStyle}>التاريخ</th>
                    <th style={thStyle}>ملاحظات</th>
                    <th style={thStyle}>التكلفة</th>
                    <th style={{ ...thStyle, width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          padding: "40px 0",
                          color: "var(--text-muted)",
                        }}
                      >
                        لا توجد حركات مطابقة
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const meta = TYPE_META[row.type] ?? {
                        label: row.type,
                        color: "#6b7280",
                        icon: Package,
                      };
                      const Icon = meta.icon;
                      const hasCost = row.cost && (row.cost.USD || row.cost.SP);
                      // Same-day-only users lose the delete button once the
                      // action's own day is over (server enforces it too).
                      const lockedByDay =
                        sameDayDeleteOnly &&
                        !isSameLocalDay(
                          objectIdDate(String(row._id), row.date),
                          new Date(),
                        );
                      return (
                        <tr
                          key={row._id}
                          onClick={() => setViewRow(row)}
                          style={{ cursor: "pointer", transition: "background 0.1s" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--bg)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600 }}>{row.item?.name}</span>{" "}
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                              ({row.item?.unit})
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "2px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                background: `${meta.color}18`,
                                color: meta.color,
                              }}
                            >
                              <Icon size={12} /> {meta.label}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {row.type === "other" ? (
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: row.flowDirection === "in" ? "#22c55e" : "#ef4444",
                                }}
                              >
                                {row.flowDirection === "in" ? "+" : "-"}
                                {row.quantity}
                              </span>
                            ) : (
                              <span style={{ fontWeight: 700 }}>{row.quantity}</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                            {row.employee ? `${row.employee.fullName}` : "—"}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                            {row.goal_model ? GOAL_AR[row.goal_model] ?? row.goal_model : "—"}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                            {new Date(row.date).toLocaleDateString("en-GB")}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={row.notes ?? ""}
                          >
                            {row.notes ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                                <StickyNote size={12} /> {row.notes}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={tdStyle}>
                            {hasCost ? (
                              <span
                                style={{
                                  color: row.gain ? "#22c55e" : "#ef4444",
                                  fontWeight: 600,
                                }}
                              >
                                {row.gain ? "+" : "-"}
                                {(row.cost.SP ?? 0).toLocaleString("en")} ل.س
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td
                            style={{ ...tdStyle, textAlign: "center" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!lockedByDay) setConfirmDelete(row);
                            }}
                          >
                            <button
                              disabled={lockedByDay}
                              title={
                                lockedByDay
                                  ? "الحذف مسموح في نفس اليوم الذي سُجّلت فيه الحركة فقط"
                                  : "حذف الحركة"
                              }
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: "none",
                                background: "transparent",
                                color: lockedByDay ? "var(--text-muted)" : "#ef4444",
                                cursor: lockedByDay ? "not-allowed" : "pointer",
                                opacity: lockedByDay ? 0.55 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                if (!lockedByDay)
                                  e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                              }}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                              }
                            >
                              {lockedByDay ? <Lock size={13} /> : <Trash2 size={13} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "4px 14px", borderTop: total > 0 ? "1px solid var(--border)" : "none" }}>
              <Pagination
                page={page}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>
      </>
      )}

      {/* Add action — any item, locked to this page's direction */}
      <ActionDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={fetchRows}
        mode="global"
        restrictDirection={direction ?? undefined}
        defaultExchange={defaultExchange}
      />

      {/* Read-only mini profile */}
      <ActionDrawer
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        onSaved={() => {}}
        item={viewRow?.item}
        defaultExchange={defaultExchange}
        viewAction={viewRow}
      />

      {confirmDelete && (
        <ConfirmDialog
          title="حذف الحركة"
          message={`هل أنت متأكد من حذف هذه الحركة من "${confirmDelete.item?.name}"؟ سيتم تحديث كمية العنصر تلقائياً.`}
          confirmLabel="حذف"
          onConfirm={() => handleDeleteRow(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function StorageActionsLogPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <StorageActionsLogInner />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  UserCircle,
  FileDown,
} from "lucide-react";
import { downloadXLSX } from "@/lib/exportXLSX";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { PageSpinner } from "@/components/shared/Spinner";
import { useSearchParams } from "next/navigation";

// Module-level to avoid remount/focus-loss on re-render
function EmpPicker({
  selected,
  onClear,
  search,
  onSearchChange,
  results,
  onSelect,
}: {
  selected: any;
  onClear: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  results: any[];
  onSelect: (e: any) => void;
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
          display: "inline-flex",
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
        <UserCircle size={14} />
        {selected.fullName}
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
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="فلتر بالموظف..."
        style={{
          height: 38,
          padding: "0 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text)",
          fontSize: 13,
          fontFamily: "'Tajawal', sans-serif",
          outline: "none",
          width: 160,
        }}
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: 220,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 300,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {results.map((emp) => (
            <div
              key={emp._id}
              onMouseDown={() => {
                onSelect(emp);
                setOpen(false);
              }}
              style={{
                padding: "9px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <UserCircle
                size={14}
                color="var(--text-muted)"
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text)",
                  fontFamily: "'Tajawal', sans-serif",
                  flex: 1,
                }}
              >
                {emp.fullName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                #{emp.id_num}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SECTIONS = [
  { value: "employees", label: "موظفين" },
  { value: "storage", label: "تخزين" },
  { value: "points", label: "نقاط" },
  { value: "customers", label: "زبائن" },
  { value: "problems", label: "مشاكل" },
  { value: "finance", label: "مالية" },
  { value: "documents", label: "وثائق" },
];

const TYPE_LABELS: Record<string, string> = {
  salary_added: "إضافة راتب",
  loan_added: "إضافة سلفة",
  stock_in: "إدخال مخزون",
  stock_out: "إخراج مخزون",
  consume: "استهلاك",
  borrow: "استعارة",
  return: "إرجاع",
  point_added: "إضافة نقطة",
  point_deleted: "حذف نقطة",
  customer_added: "إضافة زبون",
  customer_suspended: "إيقاف زبون",
  customer_restored: "استعادة زبون",
  customer_deleted: "حذف زبون",
  sub_added: "إضافة اشتراك",
  sub_deleted: "حذف اشتراك",
};

const SECTION_COLORS: Record<string, string> = {
  employees: "#3b82f6",
  storage: "#22c55e",
  points: "#f97316",
  customers: "#8b5cf6",
  problems: "#ef4444",
  finance: "#eab308",
  documents: "#06b6d4",
};

const COLUMNS = [
  { key: "date", label: "التاريخ" },
  { key: "section", label: "القسم" },
  { key: "type", label: "النوع" },
  { key: "performedBy", label: "بواسطة" },
  { key: "employee", label: "الموظف" },
  { key: "item", label: "العنصر" },
  { key: "quantity", label: "الكمية" },
  { key: "notes", label: "ملاحظات" },
];

const STORAGE_KEY = "history_hidden_cols";

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [activeSection, setActiveSection] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const [exporting, setExporting] = useState(false);
  const [showColMenu, setShowColMenu] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Load all employees once (for picker)
  useEffect(() => {
    fetch("/api/employees?limit=500")
      .then((r) => r.json())
      .then((d) => {
        const list: any[] = d.data?.employees ?? [];
        setAllEmployees(list);
        const urlId = searchParams.get("employee");
        if (urlId) {
          const found = list.find((e) => e._id === urlId);
          if (found) setSelectedEmp(found);
        }
      });
  }, []);

  const filteredEmps = empSearch.trim()
    ? allEmployees.filter(
        (e) =>
          e.fullName?.includes(empSearch) ||
          e.id_num?.toString().includes(empSearch),
      )
    : allEmployees.slice(0, 8);

  // Load hidden cols
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHiddenCols(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenCols));
  }, [hiddenCols]);

  // Close col menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        showColMenu &&
        colMenuRef.current &&
        !colMenuRef.current.contains(e.target as Node)
      ) {
        setShowColMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu]);

  useEffect(() => {
    setPage(1);
  }, [activeSection, filterType, dateFrom, dateTo, selectedEmp]);
  useEffect(() => {
    fetchLogs();
  }, [activeSection, filterType, dateFrom, dateTo, selectedEmp, page, limit]);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(selectedEmp && { employee: selectedEmp._id }),
      ...(activeSection && { section: activeSection }),
      ...(filterType && { type: filterType }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });
    const res = await fetch(`/api/history?${params}`);
    const json = await res.json();
    setLogs(json.data?.logs ?? []);
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConfirmDelete(null);
    fetchLogs();
  }

  async function handleExportHistory() {
    setExporting(true);
    const params = new URLSearchParams({
      page: "1",
      limit: "5000",
      ...(selectedEmp && { employee: selectedEmp._id }),
      ...(activeSection && { section: activeSection }),
      ...(filterType && { type: filterType }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });
    const res = await fetch(`/api/history?${params}`);
    const json = await res.json();
    const allLogs: any[] = json.data?.logs ?? [];
    const rows = allLogs.map((log) => {
      const row: Record<string, any> = {};
      visibleCols.forEach((col) => {
        switch (col.key) {
          case "date":
            row["التاريخ"] = new Date(log.date).toLocaleDateString("en-GB");
            break;
          case "section":
            row["القسم"] =
              SECTIONS.find((s) => s.value === log.section)?.label ??
              log.section;
            break;
          case "type":
            row["النوع"] = TYPE_LABELS[log.type] ?? log.type;
            break;
          case "performedBy":
            row["بواسطة"] = log.performedBy?.name ?? "—";
            break;
          case "employee":
            row["الموظف"] = log.employee
              ? `${log.employee.fullName} #${log.employee.id_num}`
              : "—";
            break;
          case "item":
            row["العنصر"] = log.item?.name ?? "—";
            break;
          case "quantity":
            row["الكمية"] = log.quantity ?? "—";
            break;
          case "notes":
            row["ملاحظات"] = log.notes ?? "—";
            break;
        }
      });
      return row;
    });
    downloadXLSX(rows, "سجل-العمليات");
    setExporting(false);
  }

  function toggleCol(key: string) {
    setHiddenCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const visibleCols = COLUMNS.filter((c) => !hiddenCols.includes(c.key));

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
    padding: "11px 14px",
    fontSize: 13,
    color: "var(--text)",
    fontFamily: "'Tajawal', sans-serif",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1
          className="font-title font-bold"
          style={{ fontSize: 22, color: "var(--text)" }}
        >
          السجل
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          سجل جميع العمليات في النظام
        </p>
      </div>

      {/* Section quick filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[{ value: "", label: "الكل" }, ...SECTIONS].map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setActiveSection(s.value);
              setFilterType("");
            }}
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: 99,
              border: `1px solid ${activeSection === s.value ? (SECTION_COLORS[s.value] ?? "#f97316") : "var(--border)"}`,
              background:
                activeSection === s.value
                  ? `${SECTION_COLORS[s.value] ?? "#f97316"}15`
                  : "transparent",
              color:
                activeSection === s.value
                  ? (SECTION_COLORS[s.value] ?? "#f97316")
                  : "var(--text-muted)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: activeSection === s.value ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Type filter */}
        <select
          style={{
            height: 38,
            padding: "0 1px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            outline: "none",
            cursor: "pointer",
          }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">كل الأنواع</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              height: 38,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              outline: "none",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              height: 38,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              outline: "none",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Employee picker */}
        <EmpPicker
          selected={selectedEmp}
          onClear={() => setSelectedEmp(null)}
          search={empSearch}
          onSearchChange={setEmpSearch}
          results={filteredEmps}
          onSelect={(e) => {
            setSelectedEmp(e);
            setEmpSearch("");
          }}
        />

        {/* Clear */}
        {(filterType || dateFrom || dateTo || selectedEmp) && (
          <button
            onClick={() => {
              setFilterType("");
              setDateFrom("");
              setDateTo("");
              setSelectedEmp(null);
            }}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            مسح الفلاتر
          </button>
        )}

        {/* Export */}
        <button
          onClick={handleExportHistory}
          disabled={exporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12,
            fontFamily: "'Tajawal', sans-serif",
            cursor: exporting ? "not-allowed" : "pointer",
            opacity: exporting ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          <FileDown size={13} />
          {exporting ? "جاري التصدير..." : "تصدير XLSX"}
        </button>

        {/* Columns toggle */}
        <div
          ref={colMenuRef}
          style={{ position: "relative", marginRight: "auto" }}
        >
          <button
            onClick={() => setShowColMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 38,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 12,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            الأعمدة{" "}
            {showColMenu ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showColMenu && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "calc(100% + 6px)",
                width: 180,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 200,
                padding: 6,
              }}
            >
              {COLUMNS.map((col) => {
                const isVisible = !hiddenCols.includes(col.key);
                return (
                  <div
                    key={col.key}
                    onClick={() => toggleCol(col.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 7,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        flexShrink: 0,
                        border: `2px solid ${isVisible ? "#f97316" : "var(--border)"}`,
                        background: isVisible ? "#f97316" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isVisible && (
                        <span
                          style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      {col.label}
                    </span>
                  </div>
                );
              })}
            </div>
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
                    {visibleCols.map((col) => (
                      <th key={col.key} style={thStyle}>
                        {col.label}
                      </th>
                    ))}
                    <th
                      style={{ ...thStyle, textAlign: "center", width: 48 }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleCols.length + 1}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          padding: "40px 0",
                          color: "var(--text-muted)",
                        }}
                      >
                        لا توجد سجلات
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log._id}
                        style={{ transition: "background 0.1s" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {visibleCols.map((col) => (
                          <td key={col.key} style={tdStyle}>
                            {col.key === "date" && (
                              <div>
                                <p
                                  style={{ fontSize: 13, color: "var(--text)" }}
                                >
                                  {new Date(log.date).toLocaleDateString(
                                    "en-GB",
                                  )}
                                </p>
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {new Date(log.date).toLocaleTimeString(
                                    "en-GB",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </p>
                              </div>
                            )}
                            {col.key === "section" && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "3px 10px",
                                  borderRadius: 99,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  fontFamily: "'Cairo', sans-serif",
                                  color:
                                    SECTION_COLORS[log.section] ?? "#6b7280",
                                  background: `${SECTION_COLORS[log.section] ?? "#6b7280"}15`,
                                }}
                              >
                                {SECTIONS.find((s) => s.value === log.section)
                                  ?.label ?? log.section}
                              </span>
                            )}
                            {col.key === "type" && (
                              <span
                                style={{ fontSize: 13, color: "var(--text)" }}
                              >
                                {TYPE_LABELS[log.type] ?? log.type}
                              </span>
                            )}
                            {col.key === "performedBy" && (
                              <span
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-muted)",
                                }}
                              >
                                {log.performedBy?.name ?? "—"}
                              </span>
                            )}
                            {col.key === "employee" &&
                              (log.employee ? (
                                <span
                                  style={{ fontSize: 13, color: "var(--text)" }}
                                >
                                  {log.employee.fullName}
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-muted)",
                                      marginRight: 4,
                                    }}
                                  >
                                    #{log.employee.id_num}
                                  </span>
                                </span>
                              ) : (
                                "—"
                              ))}
                            {col.key === "item" && (
                              <span
                                style={{ fontSize: 13, color: "var(--text)" }}
                              >
                                {log.item?.name ?? "—"}
                              </span>
                            )}
                            {col.key === "quantity" && (
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: log.quantity ? 600 : 400,
                                  color: log.quantity
                                    ? "var(--text)"
                                    : "var(--text-muted)",
                                }}
                              >
                                {log.quantity ?? "—"}
                              </span>
                            )}
                            {col.key === "notes" && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-muted)",
                                  maxWidth: 200,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {log.notes ?? "—"}
                              </span>
                            )}
                          </td>
                        ))}

                        {/* Delete */}
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button
                            onClick={() => setConfirmDelete(log._id)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              border: "none",
                              background: "transparent",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto",
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: "4px 14px",
                borderTop: total > 0 ? "1px solid var(--border)" : "none",
              }}
            >
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

      {confirmDelete && (
        <ConfirmDialog
          title="حذف السجل"
          message="هل أنت متأكد من حذف هذا السجل؟ سيتم حذف البيانات المرتبطة به أيضاً (راتب، سلفة، حركة مخزون...)."
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

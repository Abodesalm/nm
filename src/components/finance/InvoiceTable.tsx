"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/shared/Pagination";
import { PageSpinner } from "@/components/shared/Spinner";
import {
  ChevronUp,
  ChevronDown,
  Columns,
  Check,
  Eye,
} from "lucide-react";

const COLUMNS = [
  { key: "invoiceNumber", label: "# الفاتورة",    sortable: true  },
  { key: "type",          label: "النوع",          sortable: false },
  { key: "category",      label: "الفئة",          sortable: false },
  { key: "party",         label: "الطرف المعني",   sortable: false },
  { key: "amountUSD",     label: "المبلغ ($)",     sortable: true  },
  { key: "amountSP",      label: "المبلغ (ل.س)",  sortable: true  },
  { key: "date",          label: "التاريخ",        sortable: true  },
];

const STORAGE_KEY = "finance-invoice-cols";

const TYPE_LABELS: Record<string, string> = {
  salary:         "راتب",
  subscription:   "اشتراك",
  storage_action: "تكلفة مخزن",
};

const TYPE_COLORS: Record<string, string> = {
  salary:         "#3b82f6",
  subscription:   "#22c55e",
  storage_action: "#f97316",
};

interface Props {
  refresh:        number;
  search:         string;
  filterType:     string;
  filterCategory: string;
  dateFrom:       string;
  dateTo:         string;
}

export function InvoiceTable({
  refresh,
  search,
  filterType,
  filterCategory,
  dateFrom,
  dateTo,
}: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [limit,    setLimit]    = useState(10);
  const [sortBy,   setSortBy]   = useState("date");
  const [sortDir,  setSortDir]  = useState<"asc" | "desc">("desc");
  const [showColMenu, setShowColMenu] = useState(false);
  const [hiddenCols,  setHiddenCols]  = useState<string[]>([]);

  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHiddenCols(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenCols));
  }, [hiddenCols]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (showColMenu && colMenuRef.current && !colMenuRef.current.contains(e.target as Node))
        setShowColMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu]);

  useEffect(() => { setPage(1); }, [search, filterType, filterCategory, dateFrom, dateTo, refresh]);

  useEffect(() => { fetchInvoices(); }, [search, filterType, filterCategory, dateFrom, dateTo, page, limit, sortBy, sortDir, refresh]);

  async function fetchInvoices() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortField: sortBy,
      sortOrder: sortDir,
      ...(search         && { search }),
      ...(filterType     && { type: filterType }),
      ...(filterCategory && { category: filterCategory }),
      ...(dateFrom       && { dateFrom }),
      ...(dateTo         && { dateTo }),
    });
    const res  = await fetch(`/api/finance/invoices?${params}`);
    const json = await res.json();
    setInvoices(json.data?.invoices ?? []);
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }

  function handleSort(col: string) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }

  function toggleCol(key: string) {
    setHiddenCols((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function partyLabel(inv: any) {
    if (inv.employee)    return `${inv.employee.fullName} (#${inv.employee.id_num})`;
    if (inv.customer)    return `${inv.customer.name} (#${inv.customer.customer_number})`;
    if (inv.storageItem) return inv.storageItem.name;
    return "—";
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("ar-SY", { year: "numeric", month: "short", day: "numeric" });
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
    userSelect: "none",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: 13.5,
    color: "var(--text)",
    fontFamily: "'Tajawal', sans-serif",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "visible",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div ref={colMenuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowColMenu((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 34, padding: "0 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: 12,
              fontFamily: "'Tajawal', sans-serif", cursor: "pointer",
            }}
          >
            <Columns size={14} /> الأعمدة
          </button>
          {showColMenu && (
            <div
              style={{
                position: "absolute", left: 0, top: "calc(100% + 6px)",
                width: 190, background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, padding: 6,
              }}
            >
              {COLUMNS.map((col) => {
                const isVisible = !hiddenCols.includes(col.key);
                return (
                  <div
                    key={col.key}
                    onClick={() => toggleCol(col.key)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isVisible ? "#f97316" : "var(--border)"}`,
                        background: isVisible ? "#f97316" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isVisible && <Check size={10} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "'Tajawal', sans-serif" }}>
                      {col.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {visibleCols.map((col) => (
                    <th
                      key={col.key}
                      style={{ ...thStyle, cursor: col.sortable ? "pointer" : "default" }}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {col.label}
                        {col.sortable && sortBy === col.key && (
                          sortDir === "asc"
                            ? <ChevronUp size={13} style={{ color: "#f97316" }} />
                            : <ChevronDown size={13} style={{ color: "#f97316" }} />
                        )}
                      </div>
                    </th>
                  ))}
                  {/* View icon col */}
                  <th style={{ ...thStyle, textAlign: "center", width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleCols.length + 1}
                      style={{ ...tdStyle, textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}
                    >
                      لا توجد فواتير
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv._id}
                      style={{ cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => router.push(`/finance/invoices/${inv._id}`)}
                    >
                      {visibleCols.map((col) => (
                        <td key={col.key} style={tdStyle}>
                          {col.key === "invoiceNumber" && (
                            <span style={{ fontWeight: 700, color: "#f97316" }}>#{inv.invoiceNumber}</span>
                          )}
                          {col.key === "type" && (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                background: `${TYPE_COLORS[inv.type]}18`,
                                color: TYPE_COLORS[inv.type],
                              }}
                            >
                              {TYPE_LABELS[inv.type] ?? inv.type}
                            </span>
                          )}
                          {col.key === "category" && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "2px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                background: inv.category === "earn" ? "#22c55e18" : "#ef444418",
                                color: inv.category === "earn" ? "#22c55e" : "#ef4444",
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                              {inv.category === "earn" ? "دخل" : "تكلفة"}
                            </span>
                          )}
                          {col.key === "party"      && <span style={{ color: "var(--text-muted)" }}>{partyLabel(inv)}</span>}
                          {col.key === "amountUSD"  && (
                            <span style={{ fontWeight: 600 }}>
                              {(inv.amount?.USD ?? 0).toLocaleString("en")} $
                            </span>
                          )}
                          {col.key === "amountSP"   && (
                            <span style={{ color: "var(--text-muted)" }}>
                              {(inv.amount?.SP ?? 0).toLocaleString("en")} ل.س
                            </span>
                          )}
                          {col.key === "date"       && <span style={{ color: "var(--text-muted)" }}>{formatDate(inv.date)}</span>}
                        </td>
                      ))}
                      {/* View icon */}
                      <td
                        style={{ ...tdStyle, textAlign: "center" }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/finance/invoices/${inv._id}`); }}
                      >
                        <Eye size={15} style={{ color: "var(--text-muted)" }} />
                      </td>
                    </tr>
                  ))
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
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

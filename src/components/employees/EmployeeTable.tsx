"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageSpinner } from "@/components/shared/Spinner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  CreditCard,
  Eye,
  History,
  ChevronUp,
  ChevronDown,
  Columns,
  Check,
} from "lucide-react";

const COLUMNS = [
  { key: "id_num", label: "رقم الموظف", sortable: true },
  { key: "fullName", label: "الاسم", sortable: true },
  { key: "role", label: "المسمى الوظيفي", sortable: true },
  { key: "department", label: "القسم", sortable: true },
  { key: "phone", label: "الهاتف", sortable: false },
  { key: "salary", label: "الراتب", sortable: true },
  { key: "state", label: "الحالة", sortable: false },
];

const STORAGE_KEY = "employees_hidden_cols";

interface Props {
  onEdit: (emp: any) => void;
  onAbsents: (emp: any) => void;
  onSalaries: (emp: any) => void;
  onLoans: (emp: any) => void;
  onDelete: (id: string) => void;
  refresh: number;
  search: string;
  filterRole: string;
  filterDept: string;
}

export function EmployeeTable({
  onEdit,
  onAbsents,
  onSalaries,
  onLoans,
  onDelete,
  refresh,
  search,
  filterRole,
  filterDept,
}: Props) {
  const router = useRouter();

  const [employees, setEmployees] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("id_num");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);

  const colMenuRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load hidden cols from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHiddenCols(JSON.parse(saved));
    } catch {}
  }, []);

  // Save hidden cols to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenCols));
  }, [hiddenCols]);

  // Close menus on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      // Close col menu
      if (
        showColMenu &&
        colMenuRef.current &&
        !colMenuRef.current.contains(e.target as Node)
      ) {
        setShowColMenu(false);
      }
      // Close row menu
      if (openMenu) {
        const menuEl = menuRefs.current[openMenu];
        if (menuEl && !menuEl.contains(e.target as Node)) {
          setOpenMenu(null);
        }
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu, openMenu]);

  useEffect(() => {
    setPage(1);
  }, [search, filterRole, filterDept, refresh]);

  useEffect(() => {
    fetchEmployees();
  }, [search, filterRole, filterDept, page, limit, sortBy, sortDir, refresh]);

  async function fetchEmployees() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
      ...(search && { search }),
      ...(filterRole && { role: filterRole }),
      ...(filterDept && { department: filterDept }),
    });
    const res = await fetch(`/api/employees?${params}`);
    const json = await res.json();
    setEmployees(json.data?.employees ?? []);
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }

  function handleSort(col: string) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
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
    <>
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
          }}
        >
          <div ref={colMenuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowColMenu((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 34,
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
              <Columns size={14} /> الأعمدة
            </button>

            {showColMenu && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "calc(100% + 6px)",
                  width: 190,
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
                        {isVisible && <Check size={10} color="#fff" />}
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

        {loading ? (
          <PageSpinner />
        ) : (
          <>
            <div style={{ overflowX: "visible" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {visibleCols.map((col) => (
                      <th
                        key={col.key}
                        style={{
                          ...thStyle,
                          cursor: col.sortable ? "pointer" : "default",
                        }}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {col.label}
                          {col.sortable &&
                            sortBy === col.key &&
                            (sortDir === "asc" ? (
                              <ChevronUp
                                size={13}
                                style={{ color: "#f97316" }}
                              />
                            ) : (
                              <ChevronDown
                                size={13}
                                style={{ color: "#f97316" }}
                              />
                            ))}
                        </div>
                      </th>
                    ))}
                    <th
                      style={{ ...thStyle, textAlign: "center", width: 48 }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
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
                        لا يوجد موظفون
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr
                        key={emp._id}
                        style={{
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        onClick={() => router.push(`/employees/${emp._id}`)}
                      >
                        {visibleCols.map((col) => (
                          <td key={col.key} style={tdStyle}>
                            {col.key === "id_num" && (
                              <span
                                style={{
                                  background: "rgba(249,115,22,0.1)",
                                  color: "#f97316",
                                  padding: "3px 10px",
                                  borderRadius: 99,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: "'Cairo', sans-serif",
                                }}
                              >
                                #{emp.id_num}
                              </span>
                            )}
                            {col.key === "fullName" && (
                              <div>
                                <p style={{ fontWeight: 600 }}>
                                  {emp.fullName}
                                </p>
                                {emp.email && (
                                  <p
                                    style={{
                                      fontSize: 12,
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {emp.email}
                                  </p>
                                )}
                              </div>
                            )}
                            {col.key === "role" && emp.role}
                            {col.key === "department" && emp.department}
                            {col.key === "phone" && (
                              <span
                                style={{
                                  direction: "ltr",
                                  display: "block",
                                  textAlign: "right",
                                }}
                              >
                                {emp.phone ?? "—"}
                              </span>
                            )}
                            {col.key === "salary" &&
                              (emp.salary?.USD ? (
                                <div>
                                  <p style={{ fontWeight: 600 }}>
                                    ${emp.salary.USD.toFixed(2)}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {emp.salary.SP?.toLocaleString("en")} ل.س
                                  </p>
                                </div>
                              ) : (
                                "—"
                              ))}
                            {col.key === "state" && (
                              <StatusBadge status={emp.state} />
                            )}
                          </td>
                        ))}

                        {/* 3-dot menu */}
                        <td
                          style={{ ...tdStyle, textAlign: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            ref={(el) => {
                              menuRefs.current[emp._id] = el;
                            }}
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === emp._id ? null : emp._id,
                                )
                              }
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                border: "none",
                                background:
                                  openMenu === emp._id
                                    ? "var(--border)"
                                    : "transparent",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--border)")
                              }
                              onMouseLeave={(e) => {
                                if (openMenu !== emp._id)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {openMenu === emp._id && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: "calc(100% + 4px)",
                                  width: 185,
                                  background: "var(--surface)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 10,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                  zIndex: 200,
                                  padding: 4,
                                }}
                              >
                                {[
                                  {
                                    label: "عرض الملف",
                                    icon: Eye,
                                    action: () => {
                                      router.push(`/employees/${emp._id}`);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "تعديل",
                                    icon: Pencil,
                                    action: () => {
                                      onEdit(emp);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "الغيابات",
                                    icon: Calendar,
                                    action: () => {
                                      onAbsents(emp);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "الرواتب",
                                    icon: DollarSign,
                                    action: () => {
                                      onSalaries(emp);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "السلف",
                                    icon: CreditCard,
                                    action: () => {
                                      onLoans(emp);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "السجل",
                                    icon: History,
                                    action: () => {
                                      router.push(
                                        `/history?employee=${emp._id}`,
                                      );
                                      setOpenMenu(null);
                                    },
                                  },
                                ].map(({ label, icon: Icon, action }) => (
                                  <button
                                    key={label}
                                    onClick={action}
                                    style={{
                                      width: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 10px",
                                      borderRadius: 7,
                                      border: "none",
                                      background: "transparent",
                                      color: "var(--text)",
                                      fontSize: 13,
                                      fontFamily: "'Tajawal', sans-serif",
                                      cursor: "pointer",
                                      textAlign: "right",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "var(--bg)")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        "transparent")
                                    }
                                  >
                                    <Icon
                                      size={14}
                                      style={{
                                        color: "var(--text-muted)",
                                        flexShrink: 0,
                                      }}
                                    />
                                    {label}
                                  </button>
                                ))}
                                <div
                                  style={{
                                    height: 1,
                                    background: "var(--border)",
                                    margin: "4px 0",
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    setConfirmDelete(emp._id);
                                    setOpenMenu(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 10px",
                                    borderRadius: 7,
                                    border: "none",
                                    background: "transparent",
                                    color: "#ef4444",
                                    fontSize: 13,
                                    fontFamily: "'Tajawal', sans-serif",
                                    cursor: "pointer",
                                    textAlign: "right",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "rgba(239,68,68,0.08)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  <Trash2 size={14} style={{ flexShrink: 0 }} />{" "}
                                  حذف
                                </button>
                              </div>
                            )}
                          </div>
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
          title="حذف الموظف"
          message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          onConfirm={() => {
            onDelete(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

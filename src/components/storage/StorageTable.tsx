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
  Eye,
  ChevronUp,
  ChevronDown,
  Columns,
  Check,
  Zap,
} from "lucide-react";

const COLUMNS = [
  { key: "name", label: "اسم العنصر", sortable: true },
  { key: "category", label: "الفئة", sortable: false },
  { key: "unit", label: "الوحدة", sortable: false },
  { key: "currentQuantity", label: "الكمية الحالية", sortable: true },
  { key: "borrowedQuantity", label: "المستعار", sortable: false },
  { key: "status", label: "الحالة", sortable: true },
  { key: "cost", label: "التكلفة", sortable: true },
];

const STORAGE_KEY = "storage_hidden_cols";

interface Props {
  onEdit: (item: any) => void;
  onAction: (item: any) => void;
  onDelete: (id: string) => void;
  refresh: number;
  search: string;
  filterCategory: string;
  filterStatus: string;
  showHidden: boolean;
}

export function StorageTable({
  onEdit,
  onAction,
  onDelete,
  refresh,
  search,
  filterCategory,
  filterStatus,
  showHidden,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);

  const colMenuRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      if (
        showColMenu &&
        colMenuRef.current &&
        !colMenuRef.current.contains(e.target as Node)
      )
        setShowColMenu(false);
      if (openMenu) {
        const menuEl = menuRefs.current[openMenu];
        if (menuEl && !menuEl.contains(e.target as Node)) setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu, openMenu]);

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterStatus, showHidden, refresh]);
  useEffect(() => {
    fetchItems();
  }, [
    search,
    filterCategory,
    filterStatus,
    showHidden,
    page,
    limit,
    sortBy,
    sortDir,
    refresh,
  ]);

  async function fetchItems() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
      ...(search && { search }),
      ...(filterCategory && { category: filterCategory }),
      ...(filterStatus && { status: filterStatus }),
      ...(showHidden && { hidden: "true" }),
    });
    const res = await fetch(`/api/storage?${params}`);
    const json = await res.json();
    setItems(json.data?.items ?? []);
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
                  {items.length === 0 ? (
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
                        لا توجد عناصر
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item._id}
                        style={{
                          cursor: "pointer",
                          transition: "background 0.1s",
                          opacity: item.isHidden ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        onClick={() => router.push(`/storage/${item._id}`)}
                      >
                        {visibleCols.map((col) => (
                          <td key={col.key} style={tdStyle}>
                            {col.key === "name" && (
                              <div>
                                <p style={{ fontWeight: 600 }}>{item.name}</p>
                                {item.isHidden && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    مخفي
                                  </span>
                                )}
                              </div>
                            )}
                            {col.key === "category" && item.category}
                            {col.key === "unit" && item.unit}
                            {col.key === "currentQuantity" && (
                              <span style={{ fontWeight: 600 }}>
                                {item.currentQuantity} {item.unit}
                              </span>
                            )}
                            {col.key === "borrowedQuantity" && (
                              <span
                                style={{
                                  color:
                                    item.borrowedQuantity > 0
                                      ? "#3b82f6"
                                      : "var(--text-muted)",
                                }}
                              >
                                {item.borrowedQuantity} {item.unit}
                              </span>
                            )}
                            {col.key === "status" && (
                              <StatusBadge status={item.status} />
                            )}
                            {col.key === "cost" &&
                              (item.cost?.USD ? (
                                <div>
                                  <p style={{ fontWeight: 600 }}>
                                    ${item.cost.USD.toFixed(2)}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {item.cost.SP?.toLocaleString("en")} ل.س
                                  </p>
                                </div>
                              ) : (
                                "—"
                              ))}
                          </td>
                        ))}

                        {/* 3-dot */}
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            overflow: "visible",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            ref={(el) => {
                              menuRefs.current[item._id] = el;
                            }}
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === item._id ? null : item._id,
                                )
                              }
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                border: "none",
                                background:
                                  openMenu === item._id
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
                                if (openMenu !== item._id)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {openMenu === item._id && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: "calc(100% + 4px)",
                                  width: 180,
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
                                    label: "عرض التفاصيل",
                                    icon: Eye,
                                    action: () => {
                                      router.push(`/storage/${item._id}`);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "إضافة حركة",
                                    icon: Zap,
                                    action: () => {
                                      onAction(item);
                                      setOpenMenu(null);
                                    },
                                  },
                                  {
                                    label: "تعديل",
                                    icon: Pencil,
                                    action: () => {
                                      onEdit(item);
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
                                    />{" "}
                                    {label}
                                  </button>
                                ))}

                                {/* Toggle hidden */}
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/storage/${item._id}`, {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        isHidden: !item.isHidden,
                                      }),
                                    });
                                    setOpenMenu(null);
                                    onDelete("__refresh__");
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
                                    color: "var(--text-muted)",
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
                                  <Eye size={14} style={{ flexShrink: 0 }} />
                                  {item.isHidden ? "إظهار" : "إخفاء"}
                                </button>

                                <div
                                  style={{
                                    height: 1,
                                    background: "var(--border)",
                                    margin: "4px 0",
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    setConfirmDelete(item._id);
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
          title="حذف العنصر"
          message="هل أنت متأكد من حذف هذا العنصر؟ سيتم حذف جميع حركاته أيضاً."
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

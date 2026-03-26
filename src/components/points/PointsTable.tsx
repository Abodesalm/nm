"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { PointStatusBadge } from "./PointStatusBadge";
import { PointDrawer } from "./PointDrawer";
import {
  Search,
  Plus,
  Pencil,
  Eye,
  Trash2,
  MoreHorizontal,
  UserPlus,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  points: any[];
  onRefresh: () => void;
  onAddCustomer?: (point: any) => void;
  prefilledRegion?: { mainRegion: string; region: string };
}

const ALL_COLUMNS = [
  { key: "point_number", label: "رقم النقطة", locked: true },
  { key: "name", label: "الاسم", locked: false },
  { key: "status", label: "الحالة", locked: false },
  { key: "totalPorts", label: "المنافذ الإجمالية", locked: false },
  { key: "freePorts", label: "المنافذ الحرة", locked: false },
  { key: "customersCount", label: "الزبائن", locked: false },
  { key: "providerPoint", label: "نقطة المزود", locked: false },
];

export function PointsTable({
  points,
  onRefresh,
  onAddCustomer,
  prefilledRegion,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [addProvider, setAddProvider] = useState<any>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colBtnRef = useRef<HTMLButtonElement>(null);

  // Close column menu when clicking outside
  useEffect(() => {
    if (!colMenuOpen) return;
    function handler(e: MouseEvent) {
      if (
        colBtnRef.current &&
        !colBtnRef.current
          .closest("[data-col-menu]")
          ?.contains(e.target as Node)
      ) {
        setColMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colMenuOpen]);

  function toggleCol(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const visibleCols = ALL_COLUMNS.filter((c) => !hiddenCols.has(c.key));
  // +1 for the actions column
  const colSpanTotal = visibleCols.length + 1;

  const filtered = points.filter((p) => {
    const matchSearch =
      !search ||
      (p.name ?? "").includes(search) ||
      String(p.point_number).includes(search);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/points/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("تم حذف النقطة");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    fontFamily: "'Tajawal', sans-serif",
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

  const show = (key: string) => !hiddenCols.has(key);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              right: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="بحث بالاسم أو الرقم..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              height: 38,
              padding: "0 34px 0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
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
        >
          <option value="all">كل الحالات</option>
          <option value="online">متصل</option>
          <option value="offline">غير متصل</option>
          <option value="maintenance">صيانة</option>
        </select>

        {/* Columns toggle */}
        <div data-col-menu style={{ position: "relative" }}>
          <button
            ref={colBtnRef}
            onClick={() => setColMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: colMenuOpen ? "var(--bg)" : "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <SlidersHorizontal size={14} /> الأعمدة
          </button>

          {colMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: 180,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 100,
                padding: 6,
              }}
            >
              {ALL_COLUMNS.filter((c) => !c.locked).map((col) => {
                const visible = !hiddenCols.has(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={() => toggleCol(col.key)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
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
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        background: visible ? "#f97316" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      {visible && (
                        <Check size={10} color="#fff" strokeWidth={3} />
                      )}
                    </span>
                    {col.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={() => setAddDrawerOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 16px",
            borderRadius: 8,
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }}
        >
          <Plus size={14} /> إضافة نقطة
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        <div style={{ overflowX: "visible" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {show("point_number") && <th style={thStyle}>رقم النقطة</th>}
                {show("name") && <th style={thStyle}>الاسم</th>}
                {show("status") && <th style={thStyle}>الحالة</th>}
                {show("totalPorts") && (
                  <th style={thStyle}>المنافذ الإجمالية</th>
                )}
                {show("freePorts") && <th style={thStyle}>المنافذ الحرة</th>}
                {show("customersCount") && <th style={thStyle}>الزبائن</th>}
                {show("providerPoint") && <th style={thStyle}>نقطة المزود</th>}
                <th style={{ ...thStyle, width: 48, textAlign: "center" }} />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpanTotal}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      padding: "40px 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    لا توجد نقاط
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p._id}
                    style={{ cursor: "pointer", transition: "background 0.1s" }}
                    onClick={() => router.push(`/points/${p._id}`)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {show("point_number") && (
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: "rgba(249,115,22,0.1)",
                            color: "#f97316",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          #{p.point_number}
                        </span>
                      </td>
                    )}
                    {show("name") && (
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{p.name}</td>
                    )}
                    {show("status") && (
                      <td style={tdStyle}>
                        <PointStatusBadge status={p.status} />
                      </td>
                    )}
                    {show("totalPorts") && (
                      <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                        {p.totalPorts}
                      </td>
                    )}
                    {show("freePorts") && (
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              p.freePorts <= 2
                                ? "#ef4444"
                                : p.freePorts <= 4
                                  ? "#f97316"
                                  : "#16a34a",
                          }}
                        >
                          {p.freePorts}
                        </span>
                      </td>
                    )}
                    {show("customersCount") && (
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#6366f1" }}>
                          {p.customersCount ?? 0}
                        </span>
                      </td>
                    )}
                    {show("providerPoint") && (
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--text-muted)",
                          fontSize: 12,
                        }}
                      >
                        {p.providerPoint
                          ? `#${p.providerPoint.point_number} ${p.providerPoint.name}`
                          : "الجذر"}
                      </td>
                    )}
                    <td
                      style={{ ...tdStyle, textAlign: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === p._id ? null : p._id)
                          }
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "none",
                            background: "transparent",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--border)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {openMenuId === p._id && (
                          <>
                            <div
                              style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 99,
                              }}
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: "calc(100% + 4px)",
                                width: 170,
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 10,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                zIndex: 100,
                                padding: 4,
                              }}
                            >
                              {[
                                {
                                  icon: <Eye size={13} />,
                                  label: "عرض التفاصيل",
                                  action: () => {
                                    router.push(`/points/${p._id}`);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  icon: <Plus size={13} />,
                                  label: "إضافة نقطة فرعية",
                                  action: () => {
                                    setAddProvider(p);
                                    setAddDrawerOpen(true);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  icon: <Pencil size={13} />,
                                  label: "تعديل",
                                  action: () => {
                                    setEditTarget(p);
                                    setOpenMenuId(null);
                                  },
                                },
                                {
                                  icon: <UserPlus size={13} />,
                                  label: "إضافة زبون",
                                  action: () => {
                                    router.push(`/customers?point=${p._id}`);
                                    setOpenMenuId(null);
                                  },
                                },
                              ].map((item) => (
                                <button
                                  key={item.label}
                                  onClick={item.action}
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
                                  {item.icon} {item.label}
                                </button>
                              ))}
                              <div
                                style={{
                                  height: 1,
                                  background: "var(--border)",
                                  margin: "3px 6px",
                                }}
                              />
                              <button
                                onClick={() => {
                                  setDeleteTarget(p);
                                  setOpenMenuId(null);
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
                                <Trash2 size={13} /> حذف
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div
            style={{
              padding: "4px 14px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Pagination
              page={page}
              total={total}
              limit={pageSize}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setPageSize(l);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Drawers & Dialogs */}
      <PointDrawer
        open={addDrawerOpen}
        onClose={() => {
          setAddDrawerOpen(false);
          setAddProvider(null);
        }}
        onSaved={() => {
          onRefresh();
          setAddDrawerOpen(false);
          setAddProvider(null);
        }}
        prefilledRegion={prefilledRegion}
        prefilledProvider={addProvider}
      />
      {editTarget && (
        <PointDrawer
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            onRefresh();
            setEditTarget(null);
          }}
          point={editTarget}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="حذف النقطة"
          message={`هل أنت متأكد من حذف النقطة "${deleteTarget.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          confirmColor="#ef4444"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

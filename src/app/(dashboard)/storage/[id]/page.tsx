"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageSpinner } from "@/components/shared/Spinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { StorageDrawer } from "@/components/storage/StorageDrawer";
import { ActionDrawer } from "@/components/storage/ActionDrawer";
import {
  ArrowRight,
  Pencil,
  Trash2,
  Zap,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  RotateCcw,
  Minus,
} from "lucide-react";

const ACTION_LABELS: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  stock_in: { label: "إدخال مخزون", color: "#22c55e", icon: TrendingUp },
  stock_out: { label: "إخراج مخزون", color: "#ef4444", icon: TrendingDown },
  consume: { label: "استهلاك", color: "#f97316", icon: Minus },
  borrow: { label: "استعارة", color: "#3b82f6", icon: RefreshCw },
  return: { label: "إرجاع", color: "#8b5cf6", icon: RotateCcw },
};

export default function StorageItemPage() {
  const { id } = useParams();
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [defaultExchange, setDefaultExchange] = useState(15000);
  const [loading, setLoading] = useState(true);
  const [editDrawer, setEditDrawer] = useState(false);
  const [actionDrawer, setActionDrawer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<string | null>(
    null,
  );

  // Actions pagination + filter
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterType, setFilterType] = useState("");

  const fetchItem = useCallback(async () => {
    const res = await fetch(`/api/storage/${id}`);
    const json = await res.json();
    setItem(json.data);
  }, [id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const [_, settingsRes] = await Promise.all([
        fetchItem(),
        fetch("/api/settings").then((r) => r.json()),
      ]);
      setDefaultExchange(settingsRes.data?.defaultExchangeRate ?? 15000);
      setLoading(false);
    }
    init();
  }, [id]);

  async function handleDelete() {
    await fetch(`/api/storage/${id}`, { method: "DELETE" });
    router.push("/storage");
  }

  async function handleDeleteAction(actionId: string) {
    await fetch(`/api/storage/${id}/actions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId }),
    });
    setConfirmDeleteAction(null);
    fetchItem();
  }

  if (loading) return <PageSpinner />;
  if (!item)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>العنصر غير موجود</p>
      </div>
    );

  const actions = [...(item.actions ?? [])].reverse();
  const filteredActions = filterType
    ? actions.filter((a: any) => a.type === filterType)
    : actions;
  const paginatedActions = filteredActions.slice(
    (page - 1) * limit,
    page * limit,
  );

  const usedPct =
    item.minQuantity > 0
      ? Math.min(100, (item.currentQuantity / (item.minQuantity * 2)) * 100)
      : item.currentQuantity > 0
        ? 100
        : 0;

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    overflow: "hidden",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Back + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => router.push("/storage")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            cursor: "pointer",
          }}
        >
          <ArrowRight size={15} /> رجوع
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActionDrawer(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "none",
              background: "#f97316",
              color: "#fff",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Zap size={14} /> إضافة حركة
          </button>
          <button
            onClick={() => setEditDrawer(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <Pencil size={14} /> تعديل
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "none",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </div>

      {/* Header card */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(249,115,22,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={24} style={{ color: "#f97316" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h1
                className="font-title font-bold"
                style={{ fontSize: 22, color: "var(--text)" }}
              >
                {item.name}
              </h1>
              <StatusBadge status={item.status} />
              {item.isHidden && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    background: "var(--border)",
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}
                >
                  مخفي
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "الفئة", value: item.category },
                { label: "الوحدة", value: item.unit },
                {
                  label: "الحد الأدنى",
                  value: `${item.minQuantity} ${item.unit}`,
                },
                ...(item.cost?.USD
                  ? [
                      {
                        label: "التكلفة",
                        value: `$${item.cost.USD.toFixed(2)}`,
                      },
                    ]
                  : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {label}:{" "}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {item.notes && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "var(--bg)",
              borderRadius: 9,
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {item.notes}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
      >
        {[
          {
            label: "الكمية الحالية",
            value: item.currentQuantity,
            unit: item.unit,
            color: "#f97316",
            bg: "rgba(249,115,22,0.08)",
          },
          {
            label: "المستعار",
            value: item.borrowedQuantity,
            unit: item.unit,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.08)",
          },
          {
            label: "إجمالي الحركات",
            value: item.actions?.length ?? 0,
            unit: "حركة",
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.08)",
          },
        ].map(({ label, value, unit, color, bg }) => (
          <div key={label} style={{ ...cardStyle, padding: 18 }}>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color,
                fontFamily: "'Cairo', sans-serif",
                marginTop: 6,
              }}
            >
              {value}
            </p>
            <p
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {unit}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={cardStyle}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            مستوى المخزون
          </h3>
        </div>
        <div style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              الحد الأدنى: {item.minQuantity} {item.unit}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              الحالي: {item.currentQuantity} {item.unit}
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${usedPct}%`,
                background:
                  item.status === "out-of-stock"
                    ? "#ef4444"
                    : item.status === "low-stock"
                      ? "#eab308"
                      : "#22c55e",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions log */}
      <div style={cardStyle}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <h3
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            سجل الحركات
          </h3>
          <select
            style={{
              height: 32,
              padding: "0 10px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "'Tajawal', sans-serif",
              outline: "none",
              cursor: "pointer",
            }}
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">كل الأنواع</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {paginatedActions.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              لا توجد حركات
            </p>
          ) : (
            paginatedActions.map((action: any) => {
              const meta = ACTION_LABELS[action.type] ?? {
                label: action.type,
                color: "#6b7280",
                icon: Package,
              };
              const Icon = meta.icon;
              return (
                <div
                  key={action._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: `${meta.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {action.quantity} {item.unit}
                      </span>
                      {action.employee && (
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          بواسطة: {action.employee.fullName ?? action.employee}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                      <span
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {new Date(action.date).toLocaleDateString("en-GB")}
                      </span>
                      {action.notes && (
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {action.notes}
                        </span>
                      )}
                      {action.goal_model && (
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {action.goal_model}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteAction(action._id)}
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
                      flexShrink: 0,
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
                </div>
              );
            })
          )}
        </div>

        {filteredActions.length > 0 && (
          <div
            style={{
              padding: "4px 14px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Pagination
              page={page}
              total={filteredActions.length}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Drawers */}
      <StorageDrawer
        open={editDrawer}
        onClose={() => setEditDrawer(false)}
        onSaved={fetchItem}
        item={item}
        defaultExchange={defaultExchange}
      />
      <ActionDrawer
        open={actionDrawer}
        onClose={() => setActionDrawer(false)}
        onSaved={fetchItem}
        item={item}
      />

      {confirmDelete && (
        <ConfirmDialog
          title="حذف العنصر"
          message={`هل أنت متأكد من حذف ${item.name}؟`}
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmDeleteAction && (
        <ConfirmDialog
          title="حذف الحركة"
          message="هل أنت متأكد من حذف هذه الحركة؟ سيتم تحديث الكميات تلقائياً."
          confirmLabel="حذف"
          onConfirm={() => handleDeleteAction(confirmDeleteAction)}
          onCancel={() => setConfirmDeleteAction(null)}
        />
      )}
    </div>
  );
}

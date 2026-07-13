"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { Plus, Trash2, Star } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: any;
  onUpdate?: () => void;
}

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

export function HrPointsDrawer({ open, onClose, employee, onUpdate }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (open && employee) fetchPoints();
  }, [open, employee]);

  async function fetchPoints() {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}`);
    const json = await res.json();
    const sorted = [...(json.data?.hrPoints ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setEntries(sorted);
    setLoading(false);
  }

  const totalPoints = entries.reduce((acc, e) => acc + (e.points ?? 0), 0);
  const paginated = entries.slice((page - 1) * limit, page * limit);

  async function handleAdd() {
    const n = Number(points);
    if (!n || Number.isNaN(n)) {
      setError("عدد النقاط مطلوب (يمكن أن يكون سالباً للخصم)");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/employees/${employee._id}/hr-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: n, reason }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    setShowAdd(false);
    setPoints("");
    setReason("");
    await fetchPoints();
    onUpdate?.();
  }

  async function handleDelete(pointId: string) {
    await fetch(`/api/employees/${employee._id}/hr-points`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointId }),
    });
    setConfirmDelete(null);
    await fetchPoints();
    onUpdate?.();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`نقاط التقييم — ${employee?.fullName}`}
      width={500}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Total + Add */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                background: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Star size={18} style={{ color: "#eab308" }} />
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#a16207",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  رصيد النقاط
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#eab308",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {totalPoints}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
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
              <Plus size={14} /> منح نقاط
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
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
                  display: "grid",
                  gridTemplateColumns: "110px 1fr",
                  gap: 10,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    النقاط
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="+10"
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
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
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="سبب منح النقاط..."
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>
              )}

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setShowAdd(false)}
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
                  onClick={handleAdd}
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
                  {saving ? "جاري الحفظ..." : "منح"}
                </button>
              </div>
            </div>
          )}

          {/* Entries */}
          {entries.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              لا توجد نقاط بعد — امنح نقاطاً لمن قام بعمل جيد
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {paginated.map((e) => {
                  const positive = (e.points ?? 0) >= 0;
                  return (
                    <div
                      key={e._id}
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
                      <span
                        style={{
                          minWidth: 46,
                          textAlign: "center",
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "'Cairo', sans-serif",
                          background: positive ? "#22c55e18" : "#ef444418",
                          color: positive ? "#22c55e" : "#ef4444",
                          flexShrink: 0,
                        }}
                      >
                        {positive ? "+" : ""}
                        {e.points}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "var(--text)",
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          {e.reason || "بدون سبب محدد"}
                        </p>
                        <p
                          style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                        >
                          {new Date(e.date).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(e._id)}
                        style={{
                          width: 30,
                          height: 30,
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
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <Pagination
                page={page}
                total={entries.length}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف النقاط"
          message="هل أنت متأكد من حذف هذا السجل؟"
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

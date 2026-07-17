"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check, Wallet } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface Fund {
  _id: string;
  name: string;
}

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

export default function FinanceSettingsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/settings/finance");
    const json = await res.json();
    setFunds(json.data?.funds ?? []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    await fetch("/api/settings/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "fund", data: { name: newName.trim() } }),
    });
    setNewName("");
    fetchData();
  }

  async function handleSaveEdit() {
    if (!editing || !editing.name.trim()) return;
    await fetch("/api/settings/finance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "fund",
        id: editing.id,
        data: { name: editing.name },
      }),
    });
    setEditing(null);
    fetchData();
  }

  async function handleDelete(id: string) {
    await fetch("/api/settings/finance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "fund", id }),
    });
    setConfirmDelete(null);
    fetchData();
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "3px solid var(--border)",
            borderTopColor: "#f97316",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2
          className="font-title font-bold"
          style={{ fontSize: 18, color: "var(--text)" }}
        >
          إعدادات المالية
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          إدارة الصناديق — تصنيفات حركات الخزينة
        </p>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          maxWidth: 520,
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Wallet size={16} style={{ color: "#f97316" }} />
          <h3
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            الصناديق
          </h3>
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="اسم الصندوق..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={handleAdd}
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 8,
                border: "none",
                background: "#f97316",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <Plus size={15} /> إضافة
            </button>
          </div>

          {funds.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              لا يوجد صناديق بعد — أضف أول صندوق لتصنيف حركات الخزينة
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {funds.map((fund) => (
                <div
                  key={fund._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 9,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {editing?.id === fund._id ? (
                    <>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={editing.name}
                        onChange={(e) =>
                          setEditing({ ...editing, name: e.target.value })
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                        autoFocus
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#f97316")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "var(--border)")
                        }
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          border: "none",
                          background: "#22c55e",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          border: "none",
                          background: "var(--border)",
                          color: "var(--text)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: "var(--text)",
                          fontFamily: "'Tajawal', sans-serif",
                        }}
                      >
                        {fund.name}
                      </span>
                      <button
                        onClick={() =>
                          setEditing({ id: fund._id, name: fund.name })
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
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(fund._id)}
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
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmDelete && (
          <ConfirmDialog
            title="حذف الصندوق"
            message="هل أنت متأكد من حذف هذا الصندوق؟ حركات الخزينة المرتبطة به ستبقى لكن بدون تصنيف."
            confirmLabel="حذف"
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    </div>
  );
}

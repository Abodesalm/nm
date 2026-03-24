"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Download,
  Upload,
  DollarSign,
} from "lucide-react";

interface Pack {
  _id: string;
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  price: { USD: number; SP: number; exchange: number };
}

interface PackFormData {
  name: string;
  downloadSpeed: string;
  uploadSpeed: string;
  price: { USD: string; SP: string; exchange: string };
}

const emptyForm: PackFormData = {
  name: "",
  downloadSpeed: "",
  uploadSpeed: "",
  price: { USD: "", SP: "", exchange: "" },
};

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

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 24,
          width: 340,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <p
          className="font-title font-semibold"
          style={{ fontSize: 15, color: "var(--text)", marginBottom: 8 }}
        >
          تأكيد الحذف
        </p>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: "#ef4444",
              color: "#fff",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

function PackForm({
  form,
  onChange,
  onSave,
  onCancel,
  defaultExchange,
}: {
  form: PackFormData;
  onChange: (f: PackFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  defaultExchange: number;
}) {
  // Auto-calculate money fields
  function handleMoneyChange(field: "USD" | "SP" | "exchange", value: string) {
    const updated = { ...form.price, [field]: value };
    const exchange = parseFloat(updated.exchange) || defaultExchange;

    if (field === "USD" && value) {
      updated.SP = (parseFloat(value) * exchange).toFixed(1);
    } else if (field === "SP" && value) {
      updated.USD = (parseFloat(value) / exchange).toFixed(2);
    } else if (field === "exchange" && value) {
      if (updated.USD) {
        updated.SP = (parseFloat(updated.USD) * parseFloat(value)).toFixed(1);
      } else if (updated.SP) {
        updated.USD = (parseFloat(updated.SP) / parseFloat(value)).toFixed(2);
      }
    }

    onChange({ ...form, price: updated });
  }

  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          اسم الباقة
        </label>
        <input
          style={inputStyle}
          placeholder="مثال: باقة 10 ميغا"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Speed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            سرعة التنزيل (Mbps)
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, paddingLeft: 32 }}
              type="number"
              placeholder="10"
              value={form.downloadSpeed}
              onChange={(e) =>
                onChange({ ...form, downloadSpeed: e.target.value })
              }
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <Download
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            سرعة الرفع (Mbps)
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, paddingLeft: 32 }}
              type="number"
              placeholder="5"
              value={form.uploadSpeed}
              onChange={(e) =>
                onChange({ ...form, uploadSpeed: e.target.value })
              }
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <Upload
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Price */}
      <div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Cairo', sans-serif",
            display: "block",
            marginBottom: 8,
          }}
        >
          السعر
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          {[
            { key: "USD", label: "USD", placeholder: "0.00" },
            { key: "SP", label: "ل.س", placeholder: "0.0" },
            {
              key: "exchange",
              label: "سعر الصرف",
              placeholder: String(defaultExchange),
            },
          ].map(({ key, label, placeholder }) => (
            <div
              key={key}
              style={{ display: "flex", flexDirection: "column", gap: 5 }}
            >
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {label}
              </label>
              <input
                style={inputStyle}
                type="number"
                placeholder={placeholder}
                value={(form.price as any)[key]}
                onChange={(e) =>
                  handleMoneyChange(
                    key as "USD" | "SP" | "exchange",
                    e.target.value,
                  )
                }
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
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
          onClick={onSave}
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
          }}
        >
          حفظ
        </button>
      </div>
    </div>
  );
}

export default function CustomersSettingsPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultExchange, setDefaultExchange] = useState(15000);

  const [showAdd, setShowAdd] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState<PackFormData>(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [packsRes, settingsRes] = await Promise.all([
      fetch("/api/settings/customers").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setPacks(packsRes.data.packs ?? []);
    setDefaultExchange(settingsRes.data.defaultExchangeRate ?? 15000);
    setLoading(false);
  }

  function openAdd() {
    setShowAdd(true);
    setEditingPack(null);
    setForm({
      ...emptyForm,
      price: { USD: "", SP: "", exchange: String(defaultExchange) },
    });
  }

  function openEdit(pack: Pack) {
    setEditingPack(pack);
    setShowAdd(false);
    setForm({
      name: pack.name,
      downloadSpeed: String(pack.downloadSpeed),
      uploadSpeed: String(pack.uploadSpeed),
      price: {
        USD: String(pack.price.USD),
        SP: String(pack.price.SP),
        exchange: String(pack.price.exchange),
      },
    });
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      downloadSpeed: Number(form.downloadSpeed),
      uploadSpeed: Number(form.uploadSpeed),
      price: {
        USD: parseFloat(form.price.USD) || 0,
        SP: parseFloat(form.price.SP) || 0,
        exchange: parseFloat(form.price.exchange) || defaultExchange,
      },
    };

    if (editingPack) {
      await fetch("/api/settings/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPack._id, data: payload }),
      });
      setEditingPack(null);
    } else {
      await fetch("/api/settings/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      setShowAdd(false);
    }
    setForm(emptyForm);
    fetchData();
  }

  async function handleDelete(id: string) {
    await fetch("/api/settings/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
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
      {/* Header */}
      <div>
        <h2
          className="font-title font-bold"
          style={{ fontSize: 18, color: "var(--text)" }}
        >
          إعدادات الزبائن
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          إدارة باقات الإنترنت
        </p>
      </div>

      {/* Packs */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            الباقات
          </h3>
          <button
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 34,
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
            <Plus size={14} /> إضافة باقة
          </button>
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Add form */}
          {showAdd && (
            <PackForm
              form={form}
              onChange={setForm}
              onSave={handleSave}
              onCancel={() => {
                setShowAdd(false);
                setForm(emptyForm);
              }}
              defaultExchange={defaultExchange}
            />
          )}

          {/* Packs list */}
          {packs.length === 0 && !showAdd ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              لا توجد باقات بعد
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {packs.map((pack) => (
                <div key={pack._id}>
                  {editingPack?._id === pack._id ? (
                    <PackForm
                      form={form}
                      onChange={setForm}
                      onSave={handleSave}
                      onCancel={() => {
                        setEditingPack(null);
                        setForm(emptyForm);
                      }}
                      defaultExchange={defaultExchange}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          flexShrink: 0,
                          background: "rgba(249,115,22,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <DollarSign size={17} style={{ color: "#f97316" }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text)",
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          {pack.name}
                        </p>
                        <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Download size={11} /> {pack.downloadSpeed} Mbps
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Upload size={11} /> {pack.uploadSpeed} Mbps
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ textAlign: "left", flexShrink: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text)",
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          ${pack.price.USD.toFixed(2)}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {pack.price.SP.toLocaleString()} ل.س
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => openEdit(pack)}
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
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(pack._id)}
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message="هل أنت متأكد من حذف هذه الباقة؟"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

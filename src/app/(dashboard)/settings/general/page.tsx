"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function GeneralSettingsPage() {
  const [form, setForm] = useState({
    systemName: "",
    defaultExchangeRate: "",
    autoSuspendDay: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        const data = res.data;
        setForm({
          systemName: data.systemName ?? "NM System",
          defaultExchangeRate: String(data.defaultExchangeRate ?? 15000),
          autoSuspendDay: String(data.autoSuspendDay ?? 7),
        });
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemName: form.systemName,
        defaultExchangeRate: Number(form.defaultExchangeRate),
        autoSuspendDay: Number(form.autoSuspendDay),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    height: 42,
    padding: "0 14px",
    borderRadius: 9,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 14,
    fontFamily: "'Tajawal', sans-serif",
    outline: "none",
    transition: "border-color 0.15s",
    width: "100%",
  };

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
          الإعدادات العامة
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          الإعدادات الأساسية للنظام
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* System Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label
            className="font-title"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
          >
            اسم النظام
          </label>
          <input
            value={form.systemName}
            onChange={(e) => setForm({ ...form, systemName: e.target.value })}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Exchange Rate */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label
            className="font-title"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
          >
            سعر الصرف الافتراضي (ل.س لكل دولار)
          </label>
          <input
            type="number"
            value={form.defaultExchangeRate}
            onChange={(e) =>
              setForm({ ...form, defaultExchangeRate: e.target.value })
            }
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Auto Suspend Day */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label
            className="font-title"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
          >
            يوم الإيقاف التلقائي للزبائن (1-28)
          </label>
          <input
            type="number"
            min={1}
            max={28}
            value={form.autoSuspendDay}
            onChange={(e) =>
              setForm({ ...form, autoSuspendDay: e.target.value })
            }
            style={{ ...inputStyle, maxWidth: 140 }}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            سيتم إيقاف الزبائن الذين لم يدفعوا اشتراكهم في هذا اليوم من كل شهر
          </p>
        </div>

        {/* Save */}
        <div style={{ paddingTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 20px",
              borderRadius: 9,
              border: "none",
              background: saved ? "#22c55e" : "#f97316",
              color: "#fff",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "background 0.2s",
            }}
          >
            <Save size={15} />
            {saving ? "جاري الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}

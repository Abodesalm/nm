"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Server,
} from "lucide-react";

interface MainRegion {
  _id: string;
  name: string;
}
interface Region {
  _id: string;
  name: string;
  mainRegion: string;
  mikrotik: { ip: string; port: number; username: string; password: string };
}

interface RegionFormData {
  name: string;
  mainRegion: string;
  mikrotik: { ip: string; port: number; username: string; password: string };
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

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
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
        }}
      >
        <h3
          className="font-title font-semibold"
          style={{ fontSize: 15, color: "var(--text)" }}
        >
          {title}
        </h3>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

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

function RegionForm({
  form,
  mainRegions,
  onChange,
  onSave,
  onCancel,
}: {
  form: RegionFormData;
  mainRegions: MainRegion[];
  onChange: (form: RegionFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 12,
      }}
    >
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
            اسم المنطقة
          </label>
          <input
            style={inputStyle}
            value={form.name}
            placeholder="مثال: المنطقة الشمالية"
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
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
            المنطقة الرئيسية
          </label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.mainRegion}
            onChange={(e) => onChange({ ...form, mainRegion: e.target.value })}
          >
            <option value="">اختر منطقة رئيسية</option>
            {mainRegions.map((m) => (
              <option key={m._id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MikroTik */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}
      >
        <Server size={13} style={{ color: "var(--text-muted)" }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          إعدادات MikroTik
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 80px",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            IP
          </label>
          <input
            style={inputStyle}
            placeholder="192.168.1.1"
            value={form.mikrotik.ip}
            onChange={(e) =>
              onChange({
                ...form,
                mikrotik: { ...form.mikrotik, ip: e.target.value },
              })
            }
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
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
            اسم المستخدم
          </label>
          <input
            style={inputStyle}
            placeholder="admin"
            value={form.mikrotik.username}
            onChange={(e) =>
              onChange({
                ...form,
                mikrotik: { ...form.mikrotik, username: e.target.value },
              })
            }
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
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
            كلمة المرور
          </label>
          <input
            style={inputStyle}
            placeholder="••••••"
            type="password"
            value={form.mikrotik.password}
            onChange={(e) =>
              onChange({
                ...form,
                mikrotik: { ...form.mikrotik, password: e.target.value },
              })
            }
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
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
            Port
          </label>
          <input
            style={inputStyle}
            type="number"
            value={form.mikrotik.port}
            onChange={(e) =>
              onChange({
                ...form,
                mikrotik: { ...form.mikrotik, port: Number(e.target.value) },
              })
            }
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

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

const emptyRegionForm: RegionFormData = {
  name: "",
  mainRegion: "",
  mikrotik: { ip: "", port: 8728, username: "", password: "" },
};

export default function RegionsSettingsPage() {
  const [mainRegions, setMainRegions] = useState<MainRegion[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMainRegion, setNewMainRegion] = useState("");
  const [editingMain, setEditingMain] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmDeleteMain, setConfirmDeleteMain] = useState<string | null>(
    null,
  );

  const [showAddRegion, setShowAddRegion] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [confirmDeleteRegion, setConfirmDeleteRegion] = useState<string | null>(
    null,
  );
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [regionForm, setRegionForm] = useState<RegionFormData>(emptyRegionForm);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/settings/regions");
    const json = await res.json();
    const data = json.data;
    setMainRegions(data.mainRegions ?? []);
    setRegions(data.regions ?? []);
    setLoading(false);
  }

  async function addMainRegion() {
    if (!newMainRegion.trim()) return;
    await fetch("/api/settings/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "mainRegion",
        data: { name: newMainRegion.trim() },
      }),
    });
    setNewMainRegion("");
    fetchData();
  }

  async function saveEditMain() {
    if (!editingMain) return;
    await fetch("/api/settings/regions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "mainRegion",
        id: editingMain.id,
        data: { name: editingMain.name },
      }),
    });
    setEditingMain(null);
    fetchData();
  }

  async function deleteMainRegion(id: string) {
    await fetch("/api/settings/regions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "mainRegion", id }),
    });
    setConfirmDeleteMain(null);
    fetchData();
  }

  async function saveRegion() {
    if (!regionForm.name.trim() || !regionForm.mainRegion) return;
    if (editingRegion) {
      await fetch("/api/settings/regions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "region",
          id: editingRegion._id,
          data: regionForm,
        }),
      });
      setEditingRegion(null);
    } else {
      await fetch("/api/settings/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "region", data: regionForm }),
      });
      setShowAddRegion(false);
    }
    setRegionForm(emptyRegionForm);
    fetchData();
  }

  async function deleteRegion(id: string) {
    await fetch("/api/settings/regions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "region", id }),
    });
    setConfirmDeleteRegion(null);
    fetchData();
  }

  function openEditRegion(r: Region) {
    setEditingRegion(r);
    setRegionForm({
      name: r.name,
      mainRegion: r.mainRegion,
      mikrotik: { ...r.mikrotik },
    });
    setShowAddRegion(false);
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
          المناطق
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          إدارة المناطق الرئيسية والفرعية مع إعدادات MikroTik
        </p>
      </div>

      {/* Main Regions */}
      <SectionCard title="المناطق الرئيسية">
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="اسم المنطقة الرئيسية..."
            value={newMainRegion}
            onChange={(e) => setNewMainRegion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMainRegion()}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={addMainRegion}
            style={{
              height: 40,
              padding: "0 16px",
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

        {mainRegions.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            لا توجد مناطق رئيسية بعد
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {mainRegions.map((m) => (
              <div
                key={m._id}
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
                {editingMain?.id === m._id ? (
                  <>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={editingMain.name}
                      onChange={(e) =>
                        setEditingMain({ ...editingMain, name: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && saveEditMain()}
                      autoFocus
                      onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                    <button
                      onClick={saveEditMain}
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
                      onClick={() => setEditingMain(null)}
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
                      {m.name}
                    </span>
                    <button
                      onClick={() =>
                        setEditingMain({ id: m._id, name: m.name })
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
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteMain(m._id)}
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Regions */}
      <SectionCard title="المناطق الفرعية">
        <button
          onClick={() => {
            setShowAddRegion(!showAddRegion);
            setEditingRegion(null);
            setRegionForm(emptyRegionForm);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            border: "1px dashed var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            cursor: "pointer",
            marginBottom: 12,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#f97316";
            e.currentTarget.style.color = "#f97316";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Plus size={14} /> إضافة منطقة
        </button>

        {showAddRegion && (
          <RegionForm
            form={regionForm}
            mainRegions={mainRegions}
            onChange={setRegionForm}
            onSave={saveRegion}
            onCancel={() => {
              setShowAddRegion(false);
              setRegionForm(emptyRegionForm);
            }}
          />
        )}

        {regions.length === 0 && !showAddRegion ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            لا توجد مناطق بعد
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 4,
            }}
          >
            {regions.map((r) => (
              <div
                key={r._id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--bg)",
                }}
              >
                {editingRegion?._id === r._id ? (
                  <div style={{ padding: 14 }}>
                    <RegionForm
                      form={regionForm}
                      mainRegions={mainRegions}
                      onChange={setRegionForm}
                      onSave={saveRegion}
                      onCancel={() => {
                        setEditingRegion(null);
                        setRegionForm(emptyRegionForm);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 14px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text)",
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          {r.name}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {r.mainRegion}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedRegion(
                            expandedRegion === r._id ? null : r._id,
                          )
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
                        {expandedRegion === r._id ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => openEditRegion(r)}
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
                        onClick={() => setConfirmDeleteRegion(r._id)}
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

                    {expandedRegion === r._id && (
                      <div
                        style={{
                          padding: "10px 14px 14px",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 8,
                          }}
                        >
                          <Server
                            size={12}
                            style={{ color: "var(--text-muted)" }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--text-muted)",
                              fontFamily: "'Cairo', sans-serif",
                            }}
                          >
                            MikroTik
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
                            gap: 10,
                          }}
                        >
                          {[
                            { label: "IP", value: r.mikrotik?.ip || "—" },
                            {
                              label: "Port",
                              value: String(r.mikrotik?.port || "—"),
                            },
                            {
                              label: "Username",
                              value: r.mikrotik?.username || "—",
                            },
                            {
                              label: "Password",
                              value: r.mikrotik?.password ? "••••••" : "—",
                            },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                  marginBottom: 2,
                                }}
                              >
                                {label}
                              </p>
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "var(--text)",
                                  fontFamily: "'Tajawal', sans-serif",
                                }}
                              >
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {confirmDeleteMain && (
        <ConfirmDialog
          message="هل أنت متأكد من حذف هذه المنطقة الرئيسية؟"
          onConfirm={() => deleteMainRegion(confirmDeleteMain)}
          onCancel={() => setConfirmDeleteMain(null)}
        />
      )}
      {confirmDeleteRegion && (
        <ConfirmDialog
          message="هل أنت متأكد من حذف هذه المنطقة؟"
          onConfirm={() => deleteRegion(confirmDeleteRegion)}
          onCancel={() => setConfirmDeleteRegion(null)}
        />
      )}
    </div>
  );
}

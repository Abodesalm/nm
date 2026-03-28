"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Shield,
  KeyRound,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Permission {
  section: string;
  permission: "none" | "readonly" | "full";
}
interface User {
  _id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: Permission[];
  lastLogin?: string;
  createdAt: string;
}

const SECTIONS = [
  { key: "employees", label: "الموظفين" },
  { key: "storage", label: "التخزين" },
  { key: "history", label: "السجل" },
  { key: "points", label: "النقاط" },
  { key: "customers", label: "الزبائن" },
  { key: "problems", label: "المشاكل" },
  { key: "finance", label: "المالية" },
  { key: "documents", label: "الوثائق" },
  { key: "settings", label: "الإعدادات" },
  { key: "fieldwork", label: "العمل الميداني" },
];

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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
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
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h3
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function PermissionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const colors: Record<string, string> = {
    none: "var(--text-muted)",
    readonly: "#3b82f6",
    full: "#22c55e",
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 30,
        padding: "0 8px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--bg)",
        color: colors[value],
        fontSize: 12,
        fontFamily: "'Tajawal', sans-serif",
        outline: "none",
        cursor: "pointer",
      }}
    >
      <option value="none">لا شيء</option>
      <option value="readonly">قراءة فقط</option>
      <option value="full">كامل</option>
    </select>
  );
}

function SessionsPanel({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/settings/users/sessions?userId=${userId}`)
      .then((r) => r.json())
      .then((json) => {
        setSessions(json.data ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function forceLogout(sessionId: string) {
    await fetch("/api/settings/users/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });
    setSessions((prev) =>
      sessionId === "all" ? [] : prev.filter((s) => s._id !== sessionId),
    );
  }

  return (
    <div
      style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          marginTop: 12,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          الجلسات النشطة ({sessions.length})
        </p>
        {sessions.length > 0 && (
          <button
            onClick={() => forceLogout("all")}
            style={{
              fontSize: 11,
              color: "#ef4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            تسجيل خروج الكل
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          جاري التحميل...
        </p>
      ) : sessions.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          لا توجد جلسات نشطة
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sessions.map((s: any) => (
            <div
              key={s._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text)",
                    fontFamily: "'Tajawal', sans-serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.device?.slice(0, 60) ?? "Unknown device"}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  آخر نشاط: {new Date(s.lastActivity).toLocaleString("ar-SY")}
                </p>
              </div>
              <button
                onClick={() => forceLogout(s._id)}
                style={{
                  fontSize: 11,
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.08)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                  flexShrink: 0,
                }}
              >
                تسجيل خروج
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UsersSettingsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editPermissions, setEditPermissions] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: SECTIONS.map((s) => ({
      section: s.key,
      permission: "none" as const,
    })),
  });
  const [permsForm, setPermsForm] = useState<Permission[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch("/api/settings/users");
    const json = await res.json();
    if (json.status === "success") setUsers(json.data);
    setLoading(false);
  }

  async function handleAdd() {
    setFormError("");
    setSaving(true);
    const res = await fetch("/api/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setFormError(json.message);
      return;
    }
    setShowAdd(false);
    setAddForm({
      name: "",
      email: "",
      password: "",
      permissions: SECTIONS.map((s) => ({
        section: s.key,
        permission: "none",
      })),
    });
    fetchUsers();
  }

  async function handleSavePermissions() {
    if (!editPermissions) return;
    setSaving(true);
    await fetch("/api/settings/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editPermissions._id,
        type: "permissions",
        data: { permissions: permsForm },
      }),
    });
    setSaving(false);
    setEditPermissions(null);
    fetchUsers();
  }

  async function handleResetPassword() {
    if (!resetPassword) return;
    setFormError("");
    setSaving(true);
    const res = await fetch("/api/settings/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: resetPassword._id,
        type: "resetPassword",
        data: { password: newPassword },
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setFormError(json.message);
      return;
    }
    setResetPassword(null);
    setNewPassword("");
  }

  async function handleDelete(id: string) {
    await fetch("/api/settings/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConfirmDelete(null);
    fetchUsers();
  }

  if (!currentUser?.isSuperAdmin)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
        }}
      >
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          هذه الصفحة متاحة للسوبر أدمن فقط
        </p>
      </div>
    );

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
          المستخدمين
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          إدارة مستخدمي النظام وصلاحياتهم
        </p>
      </div>

      {/* Users list */}
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
            المستخدمون ({users.length})
          </h3>
          <button
            onClick={() => {
              setShowAdd(true);
              setFormError("");
            }}
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
            <Plus size={14} /> إضافة مستخدم
          </button>
        </div>

        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {users.map((user) => (
            <div
              key={user._id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--bg)",
              }}
            >
              {/* User row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: user.isSuperAdmin ? "#f97316" : "var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: user.isSuperAdmin ? "#fff" : "var(--text-muted)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      {user.name}
                    </p>
                    {user.isSuperAdmin && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#f97316",
                          background: "rgba(249,115,22,0.1)",
                          padding: "2px 7px",
                          borderRadius: 99,
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        سوبر أدمن
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {user.email}
                  </p>
                </div>

                {/* Last login */}
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    آخر دخول
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text)" }}>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString("ar-SY")
                      : "—"}
                  </p>
                </div>

                {/* Actions */}
                {!user.isSuperAdmin && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() =>
                        setExpandedUser(
                          expandedUser === user._id ? null : user._id,
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
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--border)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {expandedUser === user._id ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditPermissions(user);
                        setPermsForm(
                          user.permissions
                            ? [...user.permissions]
                            : SECTIONS.map((s) => ({
                                section: s.key,
                                permission: "none" as const,
                              })),
                        );
                      }}
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
                      title="تعديل الصلاحيات"
                    >
                      <Shield size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setResetPassword(user);
                        setNewPassword("");
                        setFormError("");
                      }}
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
                      title="إعادة تعيين كلمة المرور"
                    >
                      <KeyRound size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(user._id)}
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
                )}
              </div>

              {/* Expanded — permissions + sessions */}
              {expandedUser === user._id && !user.isSuperAdmin && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {/* Permissions summary */}
                  <div style={{ padding: "12px 14px" }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        fontFamily: "'Cairo', sans-serif",
                        marginBottom: 10,
                      }}
                    >
                      الصلاحيات
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 6,
                      }}
                    >
                      {SECTIONS.map((s) => {
                        const perm =
                          user.permissions?.find((p) => p.section === s.key)
                            ?.permission ?? "none";
                        const colors: Record<string, string> = {
                          none: "var(--text-muted)",
                          readonly: "#3b82f6",
                          full: "#22c55e",
                        };
                        const labels: Record<string, string> = {
                          none: "لا شيء",
                          readonly: "قراءة",
                          full: "كامل",
                        };
                        return (
                          <div
                            key={s.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "5px 8px",
                              borderRadius: 7,
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--text)",
                                fontFamily: "'Tajawal', sans-serif",
                              }}
                            >
                              {s.label}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: colors[perm],
                                fontWeight: 600,
                              }}
                            >
                              {labels[perm]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sessions */}
                  <SessionsPanel userId={user._id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal
          title="إضافة مستخدم جديد"
          onClose={() => {
            setShowAdd(false);
            setFormError("");
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                key: "name",
                label: "الاسم",
                type: "text",
                placeholder: "اسم المستخدم",
              },
              {
                key: "email",
                label: "البريد الإلكتروني",
                type: "email",
                placeholder: "email@example.com",
              },
              {
                key: "password",
                label: "كلمة المرور",
                type: "password",
                placeholder: "8 أحرف على الأقل + أرقام",
              },
            ].map(({ key, label, type, placeholder }) => (
              <div
                key={key}
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  style={inputStyle}
                  value={(addForm as any)[key]}
                  onChange={(e) =>
                    setAddForm({ ...addForm, [key]: e.target.value })
                  }
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            ))}

            {/* Permissions */}
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  fontFamily: "'Cairo', sans-serif",
                  marginBottom: 10,
                }}
              >
                الصلاحيات
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SECTIONS.map((s) => {
                  const perm =
                    addForm.permissions.find((p) => p.section === s.key)
                      ?.permission ?? "none";
                  return (
                    <div
                      key={s.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text)",
                          fontFamily: "'Tajawal', sans-serif",
                        }}
                      >
                        {s.label}
                      </span>
                      <PermissionSelect
                        value={perm}
                        onChange={(v) =>
                          setAddForm({
                            ...addForm,
                            permissions: addForm.permissions.map((p) =>
                              p.section === s.key
                                ? { ...p, permission: v as any }
                                : p,
                            ),
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {formError && (
              <p style={{ fontSize: 13, color: "#ef4444" }}>{formError}</p>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <button
                onClick={() => {
                  setShowAdd(false);
                  setFormError("");
                }}
                style={{
                  height: 38,
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
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f97316",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "جاري الحفظ..." : "إضافة"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Permissions Modal */}
      {editPermissions && (
        <Modal
          title={`صلاحيات — ${editPermissions.name}`}
          onClose={() => setEditPermissions(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SECTIONS.map((s) => {
              const perm =
                permsForm.find((p) => p.section === s.key)?.permission ??
                "none";
              return (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text)",
                      fontFamily: "'Tajawal', sans-serif",
                    }}
                  >
                    {s.label}
                  </span>
                  <PermissionSelect
                    value={perm}
                    onChange={(v) =>
                      setPermsForm(
                        permsForm.map((p) =>
                          p.section === s.key
                            ? { ...p, permission: v as any }
                            : p,
                        ),
                      )
                    }
                  />
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <button
                onClick={() => setEditPermissions(null)}
                style={{
                  height: 38,
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
                onClick={handleSavePermissions}
                disabled={saving}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f97316",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetPassword && (
        <Modal
          title={`إعادة تعيين كلمة المرور — ${resetPassword.name}`}
          onClose={() => {
            setResetPassword(null);
            setFormError("");
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                placeholder="8 أحرف على الأقل + أرقام"
                style={inputStyle}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            {formError && (
              <p style={{ fontSize: 13, color: "#ef4444" }}>{formError}</p>
            )}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setResetPassword(null);
                  setFormError("");
                }}
                style={{
                  height: 38,
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
                onClick={handleResetPassword}
                disabled={saving}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f97316",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="هل أنت متأكد من حذف هذا المستخدم؟"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

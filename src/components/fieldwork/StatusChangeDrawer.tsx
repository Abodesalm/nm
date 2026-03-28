"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Clock,
  CheckCircle,
  Briefcase,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "not_arrived", label: "لم يحضر بعد", icon: Clock, color: "#6b7280" },
  { value: "free", label: "حر للعمل", icon: CheckCircle, color: "#3b82f6" },
  { value: "working", label: "في العمل", icon: Briefcase, color: "#f97316" },
  { value: "finished", label: "أنهى يومه", icon: CheckCheck, color: "#16a34a" },
] as const;

type FieldWorkStatus = "not_arrived" | "free" | "working" | "finished";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee: any;
  log: any | null;
}

export function StatusChangeDrawer({
  open,
  onClose,
  onSaved,
  employee,
  log,
}: Props) {
  const currentStatus: FieldWorkStatus = log?.status ?? "not_arrived";
  const [selectedStatus, setSelectedStatus] =
    useState<FieldWorkStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedStatus(log?.status ?? "not_arrived");
      setNote("");
      setHour("");
      setMinute("");
      setError("");
      setShowHistory(false);
    }
  }, [open, log]);

  const showArrivalTime = selectedStatus === "free" && !log?.arrivedAt;

  async function handleSave() {
    if (saving) return;
    setError("");

    if (selectedStatus === "working" && !note.trim()) {
      setError("الملاحظة مطلوبة لحالة 'في العمل'");
      return;
    }
    if (showArrivalTime) {
      const h = parseInt(hour);
      const m = parseInt(minute);
      if (
        hour === "" ||
        minute === "" ||
        isNaN(h) ||
        isNaN(m) ||
        h < 0 ||
        h > 23 ||
        m < 0 ||
        m > 59
      ) {
        setError("يرجى إدخال وقت حضور صحيح");
        return;
      }
    }

    const arrivedAt = showArrivalTime
      ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
      : undefined;

    setSaving(true);
    try {
      const res = await fetch(`/api/fieldwork/${employee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, note, arrivedAt }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        setError(data.message ?? "حدث خطأ");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return null;

  return (
    <Drawer open={open} onClose={onClose} title="تغيير حالة الموظف" width={500}>
      {/* Employee info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 16px",
          background: "var(--bg)",
          borderRadius: 10,
          border: "1px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {employee.photo ? (
          <img
            src={employee.photo}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "'Cairo', sans-serif",
              flexShrink: 0,
            }}
          >
            {employee.fullName?.charAt(0) ?? "؟"}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text)",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            {employee.fullName}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginTop: 2,
            }}
          >
            {employee.role}
            {employee.department ? ` · ${employee.department}` : ""}
          </div>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Status selector */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
            marginBottom: 10,
          }}
        >
          الحالة الجديدة
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          role="group"
          aria-label="اختر الحالة"
        >
          {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => {
            const isSelected = selectedStatus === value;
            const isCurrent = currentStatus === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedStatus(value)}
                aria-pressed={isSelected}
                aria-label={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 9,
                  border: isSelected
                    ? `2px solid ${color}`
                    : "2px solid var(--border)",
                  background: isSelected ? `${color}18` : "var(--bg)",
                  color: isSelected ? color : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: isSelected ? 600 : 400,
                  transition: "border-color 0.15s, background 0.15s, color 0.15s",
                  textAlign: "right",
                  touchAction: "manipulation",
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
                <span style={{ flex: 1 }}>{label}</span>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "var(--border)",
                      color: "var(--text-muted)",
                      padding: "1px 6px",
                      borderRadius: 99,
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    الحالي
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Arrival time — only when switching to "free" for first time */}
      {showArrivalTime && (
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginBottom: 10,
            }}
          >
            وقت الحضور{" "}
            <span style={{ color: "#ef4444" }} aria-hidden="true">
              *
            </span>
          </p>
          <div
            style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="arrival-hour"
                style={{
                  display: "block",
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                  marginBottom: 4,
                }}
              >
                الساعة (0–23)
              </label>
              <input
                id="arrival-hour"
                type="number"
                min={0}
                max={23}
                inputMode="numeric"
                name="arrival-hour"
                autoComplete="off"
                placeholder="8…"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "'Cairo', sans-serif",
                  fontVariantNumeric: "tabular-nums",
                  outline: "none",
                  width: "100%",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <span
              aria-hidden="true"
              style={{
                color: "var(--text-muted)",
                fontSize: 22,
                fontWeight: 700,
                paddingBottom: 6,
              }}
            >
              :
            </span>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="arrival-minute"
                style={{
                  display: "block",
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                  marginBottom: 4,
                }}
              >
                الدقيقة (0–59)
              </label>
              <input
                id="arrival-minute"
                type="number"
                min={0}
                max={59}
                inputMode="numeric"
                name="arrival-minute"
                autoComplete="off"
                placeholder="30…"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "'Cairo', sans-serif",
                  fontVariantNumeric: "tabular-nums",
                  outline: "none",
                  width: "100%",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom: 20 }}>
        <label
          htmlFor="status-note"
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
            marginBottom: 8,
          }}
        >
          ملاحظة
          {selectedStatus === "working" ? (
            <span style={{ color: "#ef4444" }} aria-hidden="true">
              {" "}
              *
            </span>
          ) : (
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 11.5,
                fontWeight: 400,
              }}
            >
              {" "}
              (اختياري)
            </span>
          )}
        </label>
        <textarea
          id="status-note"
          name="status-note"
          placeholder={
            selectedStatus === "working"
              ? "اذكر العمل الذي يقوم به الموظف…"
              : "أضف ملاحظة إن وجدت…"
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 13.5,
            fontFamily: "'Tajawal', sans-serif",
            outline: "none",
            resize: "vertical",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* History accordion */}
      {log?.statusHistory?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              padding: "4px 0",
              touchAction: "manipulation",
            }}
          >
            {showHistory ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
            سجل التغييرات اليوم ({log.statusHistory.length})
          </button>
          {showHistory && (
            <div
              style={{
                marginTop: 8,
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {[...log.statusHistory].reverse().map((h: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderBottom:
                      i < log.statusHistory.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <StatusBadge status={h.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {h.note && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--text)",
                          fontFamily: "'Tajawal', sans-serif",
                          marginBottom: 2,
                          wordBreak: "break-word",
                        }}
                      >
                        {h.note}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-muted)",
                        fontFamily: "'Cairo', sans-serif",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {new Date(h.changedAt).toLocaleTimeString("ar-SY")} ·{" "}
                      {h.changedBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: 13.5,
            fontFamily: "'Tajawal', sans-serif",
            transition: "background 0.15s",
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--border)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-disabled={saving}
          style={{
            height: 38,
            padding: "0 20px",
            borderRadius: 8,
            border: "none",
            background: saving ? "var(--border)" : "#f97316",
            color: saving ? "var(--text-muted)" : "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 13.5,
            fontFamily: "'Tajawal', sans-serif",
            fontWeight: 600,
            transition: "background 0.15s, opacity 0.15s",
            touchAction: "manipulation",
          }}
        >
          {saving ? "جاري الحفظ…" : "حفظ التغيير"}
        </button>
      </div>
    </Drawer>
  );
}

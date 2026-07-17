"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageSpinner, Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Clock,
  Flame,
  UserX,
  UserCheck,
  Hand,
} from "lucide-react";

const MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
];

const DAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  present: { label: "حاضر", color: "#22c55e", bg: "rgba(34,197,94,0.14)" },
  absent: { label: "غياب", color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
  excused: { label: "غياب بعذر", color: "#3b82f6", bg: "rgba(59,130,246,0.14)" },
  weekend: { label: "عطلة", color: "var(--text-muted)", bg: "var(--bg)" },
  future: { label: "", color: "var(--text-muted)", bg: "transparent" },
  before_hire: { label: "", color: "var(--text-muted)", bg: "transparent" },
};

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
};

export default function FieldworkEmployeePage() {
  const { id } = useParams();
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Day override form
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [ovStatus, setOvStatus] = useState<"present" | "absent" | "excused">(
    "absent",
  );
  const [ovOvertime, setOvOvertime] = useState(false);
  const [ovReason, setOvReason] = useState("");
  const [ovNote, setOvNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/fieldwork/attendance/${id}?month=${month}&year=${year}`,
    );
    const json = await res.json();
    setData(json.data ?? null);
    setLoading(false);
  }, [id, month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  }

  function openDay(day: any) {
    if (day.status === "future" || day.status === "before_hire") return;
    setSelectedDay(day);
    setOvStatus(
      day.status === "present" || day.status === "weekend"
        ? "present"
        : day.status === "excused"
          ? "excused"
          : "absent",
    );
    setOvOvertime(!!day.overtime);
    setOvReason(day.reason ?? "");
    setOvNote(day.note ?? "");
  }

  async function saveOverride() {
    if (!selectedDay) return;
    setSaving(true);
    const payload = {
      isAbsent: ovStatus !== "present",
      excused: ovStatus === "excused",
      overtime: ovStatus === "present" ? ovOvertime : false,
      reason: ovReason,
      note: ovNote,
    };
    if (selectedDay.manualId) {
      await fetch(`/api/employees/${id}/absents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ absentId: selectedDay.manualId, data: payload }),
      });
    } else {
      await fetch(`/api/employees/${id}/absents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, date: selectedDay.date }),
      });
    }
    setSaving(false);
    setSelectedDay(null);
    fetchData();
  }

  async function resetToAuto() {
    if (!selectedDay?.manualId) return;
    await fetch(`/api/employees/${id}/absents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ absentId: selectedDay.manualId }),
    });
    setConfirmReset(false);
    setSelectedDay(null);
    fetchData();
  }

  if (loading && !data) return <PageSpinner />;
  if (!data)
    return (
      <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
        الموظف غير موجود
      </p>
    );

  const { employee, days, monthStats, allTime, standardWorkHours } = data;
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const statCards = [
    {
      label: "أيام العمل",
      month: monthStats.worked,
      all: allTime.worked,
      color: "#22c55e",
      icon: UserCheck,
    },
    {
      label: "الغيابات",
      month: `${monthStats.absents} (${monthStats.excused} بعذر)`,
      all: `${allTime.absents} (${allTime.excused} بعذر)`,
      color: "#ef4444",
      icon: UserX,
    },
    {
      label: "أيام الدوام الإضافي",
      month: monthStats.overtime,
      all: allTime.overtime,
      color: "#f97316",
      icon: Flame,
    },
    {
      label: "ساعات العمل المسجلة",
      month: monthStats.totalHours,
      all: allTime.totalHours,
      color: "#3b82f6",
      icon: Clock,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/fieldwork")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowRight size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1
            className="font-title font-bold"
            style={{ fontSize: 21, color: "var(--text)" }}
          >
            ملف الدوام — {employee.fullName}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {employee.role} — {employee.department} — الدوام القياسي{" "}
            {standardWorkHours} ساعات
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {statCards.map(({ label, month: m, all, color, icon: Icon }) => (
          <div
            key={label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: `${color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={15} style={{ color }} />
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                {label}
              </span>
            </div>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color,
                fontFamily: "'Cairo', sans-serif",
                marginTop: 8,
              }}
            >
              {m}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  marginRight: 6,
                }}
              >
                هذا الشهر
              </span>
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              كل الوقت: {all}
            </p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 18,
        }}
      >
        {/* Month nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={17} style={{ color: "#f97316" }} />
            <span
              className="font-title font-semibold"
              style={{ fontSize: 15.5, color: "var(--text)" }}
            >
              {MONTHS[month - 1]} {year}
            </span>
            {loading && <Spinner size={14} />}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { icon: ChevronRight, fn: prevMonth },
              { icon: ChevronLeft, fn: nextMonth },
            ].map(({ icon: Icon, fn }, i) => (
              <button
                key={i}
                onClick={fn}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Weekday headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 6,
          }}
        >
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontFamily: "'Cairo', sans-serif",
                fontWeight: 600,
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}
        >
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day: any) => {
            const meta = STATUS_META[day.status];
            const dayNum = Number(day.date.split("-")[2]);
            const clickable =
              day.status !== "future" && day.status !== "before_hire";
            const isOvertime = day.status === "present" && day.overtime;
            return (
              <div
                key={day.date}
                onClick={() => openDay(day)}
                title={
                  clickable
                    ? `${meta.label}${isOvertime ? " + دوام إضافي" : ""}${day.hours ? ` — ${day.hours} ساعة` : ""}${day.source === "manual" ? " (تعديل يدوي)" : ""}`
                    : undefined
                }
                style={{
                  minHeight: 58,
                  borderRadius: 9,
                  border: `1px solid ${
                    isOvertime
                      ? "rgba(249,115,22,0.5)"
                      : day.status === "weekend" ||
                          day.status === "future" ||
                          day.status === "before_hire"
                        ? "var(--border)"
                        : `${meta.color}44`
                  }`,
                  background: isOvertime ? "rgba(249,115,22,0.14)" : meta.bg,
                  padding: "6px 7px",
                  cursor: clickable ? "pointer" : "default",
                  opacity:
                    day.status === "future" || day.status === "before_hire"
                      ? 0.35
                      : 1,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--text)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {dayNum}
                </span>
                {clickable && day.status !== "weekend" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isOvertime ? "#f97316" : meta.color,
                      fontFamily: "'Tajawal', sans-serif",
                      lineHeight: 1.2,
                    }}
                  >
                    {isOvertime ? "إضافي" : meta.label}
                    {day.hours ? ` — ${day.hours}س` : ""}
                  </span>
                )}
                {day.status === "weekend" && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontFamily: "'Tajawal', sans-serif",
                    }}
                  >
                    عطلة
                  </span>
                )}
                {day.source === "manual" && (
                  <Hand
                    size={10}
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      color: "var(--text-muted)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "حاضر", color: "#22c55e" },
            { label: "دوام إضافي", color: "#f97316" },
            { label: "غياب", color: "#ef4444" },
            { label: "غياب بعذر", color: "#3b82f6" },
            { label: "عطلة", color: "var(--text-muted)" },
          ].map((l) => (
            <span
              key={l.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: l.color,
                  display: "inline-block",
                }}
              />
              {l.label}
            </span>
          ))}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            <Hand size={11} /> تعديل يدوي (يتجاوز الكشف التلقائي)
          </span>
        </div>
      </div>

      {/* Day override panel */}
      {selectedDay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 900,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 22,
              width: 400,
              maxWidth: "92vw",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <p
                className="font-title font-semibold"
                style={{ fontSize: 15, color: "var(--text)" }}
              >
                يوم {new Date(selectedDay.date).toLocaleDateString("en-GB")}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                {selectedDay.source === "manual"
                  ? "هذا اليوم معدل يدوياً — التعديل يتجاوز الكشف التلقائي"
                  : "التغيير هنا سيتجاوز الكشف التلقائي لهذا اليوم"}
              </p>
            </div>

            {/* Status picker */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
            >
              {(
                [
                  { value: "present", label: "حاضر", color: "#22c55e" },
                  { value: "absent", label: "غياب", color: "#ef4444" },
                  { value: "excused", label: "بعذر", color: "#3b82f6" },
                ] as const
              ).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setOvStatus(s.value)}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `2px solid ${ovStatus === s.value ? s.color : "var(--border)"}`,
                    background:
                      ovStatus === s.value ? `${s.color}18` : "transparent",
                    color: ovStatus === s.value ? s.color : "var(--text-muted)",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    fontWeight: ovStatus === s.value ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Overtime toggle (present only) */}
            {ovStatus === "present" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: 9,
                  background: ovOvertime
                    ? "rgba(249,115,22,0.07)"
                    : "var(--bg)",
                  border: `1px solid ${ovOvertime ? "rgba(249,115,22,0.3)" : "var(--border)"}`,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: ovOvertime ? "#f97316" : "var(--text)",
                    fontFamily: "'Tajawal', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  دوام إضافي
                </span>
                <button
                  onClick={() => setOvOvertime(!ovOvertime)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 99,
                    background: ovOvertime ? "#f97316" : "var(--border)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      right: ovOvertime ? 3 : undefined,
                      left: ovOvertime ? undefined : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "all 0.2s",
                    }}
                  />
                </button>
              </div>
            )}

            <input
              style={inputStyle}
              value={ovReason}
              onChange={(e) => setOvReason(e.target.value)}
              placeholder="السبب..."
            />
            <input
              style={inputStyle}
              value={ovNote}
              onChange={(e) => setOvNote(e.target.value)}
              placeholder="ملاحظات..."
            />

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {selectedDay.manualId ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.35)",
                    background: "transparent",
                    color: "#ef4444",
                    fontSize: 12.5,
                    fontFamily: "'Tajawal', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  إزالة التعديل اليدوي
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setSelectedDay(null)}
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
                  onClick={saveOverride}
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
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="إزالة التعديل اليدوي"
          message="سيعود هذا اليوم للكشف التلقائي من سجلات العمل الميداني."
          confirmLabel="إزالة"
          onConfirm={resetToAuto}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

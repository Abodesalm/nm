"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  MapPin,
  Wifi,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  salary_added:      "إضافة راتب",
  loan_added:        "إضافة سلفة",
  stock_in:          "إدخال مخزون",
  stock_out:         "إخراج مخزون",
  consume:           "استهلاك",
  borrow:            "استعارة",
  return:            "إرجاع",
  point_added:       "إضافة نقطة",
  point_deleted:     "حذف نقطة",
  customer_added:    "إضافة زبون",
  customer_suspended:"إيقاف زبون",
  customer_restored: "استعادة زبون",
  customer_deleted:  "حذف زبون",
  sub_added:         "إضافة اشتراك",
  sub_deleted:       "حذف اشتراك",
};

const SECTION_META: Record<string, { icon: any; color: string }> = {
  employees: { icon: Users,          color: "#3b82f6" },
  storage:   { icon: Package,        color: "#22c55e" },
  points:    { icon: MapPin,         color: "#f97316" },
  customers: { icon: Wifi,           color: "#8b5cf6" },
  problems:  { icon: AlertTriangle,  color: "#ef4444" },
  finance:   { icon: TrendingUp,     color: "#eab308" },
  documents: { icon: FileText,       color: "#06b6d4" },
};

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 60, height: 14, borderRadius: 6, background: "var(--border)" }} />
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--border)" }} />
      </div>
      <div>
        <div style={{ width: 56, height: 30, borderRadius: 6, background: "var(--border)", marginBottom: 8 }} />
        <div style={{ width: 100, height: 12, borderRadius: 6, background: "var(--border)" }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false); });
  }, []);

  const e = data?.employees  ?? {};
  const c = data?.customers  ?? {};
  const p = data?.points     ?? {};
  const s = data?.storage    ?? {};
  const logs: any[] = data?.recentLogs ?? [];

  const statCards = [
    {
      title: "الموظفين",
      value: e.total ?? 0,
      sub:   `${e.active ?? 0} نشط · ${e.onLeave ?? 0} إجازة`,
      icon:  Users,
      color: "#3b82f6",
      bg:    "rgba(59,130,246,0.08)",
    },
    {
      title: "الزبائن",
      value: c.total ?? 0,
      sub:   `${c.active ?? 0} نشط · ${c.suspended ?? 0} موقوف`,
      icon:  Wifi,
      color: "#f97316",
      bg:    "rgba(249,115,22,0.08)",
    },
    {
      title: "النقاط",
      value: p.total ?? 0,
      sub:   `${p.online ?? 0} متصل · ${p.offline ?? 0} غير متصل`,
      icon:  MapPin,
      color: "#22c55e",
      bg:    "rgba(34,197,94,0.08)",
    },
    {
      title: "التخزين",
      value: s.total ?? 0,
      sub:   `${s.lowStock ?? 0} منخفض · ${s.outOfStock ?? 0} نفد`,
      icon:  Package,
      color: "#a855f7",
      bg:    "rgba(168,85,247,0.08)",
    },
  ];

  const statusBars = [
    { label: "الزبائن النشطون",    value: c.active ?? 0, total: c.total ?? 0, color: "#f97316" },
    { label: "النقاط المتصلة",     value: p.online ?? 0, total: p.total ?? 0, color: "#22c55e" },
    { label: "الموظفون النشطون",   value: e.active ?? 0, total: e.total ?? 0, color: "#3b82f6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1
          className="font-title font-bold"
          style={{ fontSize: 22, color: "var(--text)", marginBottom: 4 }}
        >
          لوحة التحكم
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
          مرحباً بك، هذه نظرة عامة على النظام
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(({ title, value, sub, icon: Icon, color, bg }) => (
              <div
                key={title}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    className="font-title font-semibold"
                    style={{ fontSize: 13, color: "var(--text-muted)" }}
                  >
                    {title}
                  </span>
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                </div>
                <div>
                  <div
                    className="font-title font-bold"
                    style={{ fontSize: 30, color: "var(--text)", lineHeight: 1 }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                    {sub}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent Activity */}
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
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TrendingUp size={16} style={{ color: "#f97316" }} />
            <span className="font-title font-semibold" style={{ fontSize: 14, color: "var(--text)" }}>
              آخر النشاطات
            </span>
          </div>
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ padding: "9px 8px", display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 99, background: "var(--border)", flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 12, borderRadius: 6, background: "var(--border)" }} />
                    <div style={{ width: 50, height: 10, borderRadius: 6, background: "var(--border)" }} />
                  </div>
                ))
              : logs.length === 0
              ? (
                  <p style={{ padding: "20px 8px", fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", textAlign: "center" }}>
                    لا توجد نشاطات بعد
                  </p>
                )
              : logs.map((log) => {
                  const meta = SECTION_META[log.section] ?? { icon: CheckCircle, color: "#6b7280" };
                  const Icon = meta.icon;
                  return (
                    <div
                      key={log._id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 8px", borderRadius: 8,
                        transition: "background 0.15s", cursor: "default",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Icon size={15} style={{ color: meta.color, flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1, fontSize: 13, color: "var(--text)",
                          fontFamily: "'Tajawal', sans-serif",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {TYPE_LABELS[log.type] ?? log.type}
                        {log.performedBy?.name && (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                            {" · "}{log.performedBy.name}
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {relativeTime(log.date)}
                      </span>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* System Status */}
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
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} style={{ color: "#22c55e" }} />
            <span className="font-title font-semibold" style={{ fontSize: 14, color: "var(--text)" }}>
              حالة النظام
            </span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ width: 100, height: 12, borderRadius: 6, background: "var(--border)" }} />
                      <div style={{ width: 40, height: 12, borderRadius: 6, background: "var(--border)" }} />
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: "var(--border)" }} />
                  </div>
                ))
              : statusBars.map(({ label, value, total, color }) => {
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                        <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "'Tajawal', sans-serif" }}>
                          {label}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                          {value} / {total}
                        </span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%", width: `${pct}%`,
                            borderRadius: 999, background: color,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}

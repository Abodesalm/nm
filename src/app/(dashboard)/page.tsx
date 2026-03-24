import {
  Users,
  Package,
  MapPin,
  Wifi,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const stats = [
  {
    title: "الموظفين",
    value: "24",
    sub: "21 نشط · 3 إجازة",
    icon: Users,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    title: "الزبائن",
    value: "318",
    sub: "285 نشط · 33 موقوف",
    icon: Wifi,
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
  },
  {
    title: "النقاط",
    value: "47",
    sub: "41 متصل · 6 غير متصل",
    icon: MapPin,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
  },
  {
    title: "التخزين",
    value: "132",
    sub: "8 مخزون منخفض",
    icon: Package,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.08)",
  },
];

const recentActivity = [
  {
    icon: CheckCircle,
    color: "#22c55e",
    text: "تم تجديد اشتراك الزبون أحمد محمد",
    time: "منذ 5 دقائق",
  },
  {
    icon: XCircle,
    color: "#ef4444",
    text: "نقطة الشبكة المنطقة الشمالية انقطع اتصالها",
    time: "منذ 18 دقيقة",
  },
  {
    icon: AlertTriangle,
    color: "#f97316",
    text: "مخزون كابل الشبكة أوشك على النفاد",
    time: "منذ ساعة",
  },
  {
    icon: CheckCircle,
    color: "#22c55e",
    text: "تمت إضافة موظف جديد: خالد العمر",
    time: "منذ ساعتين",
  },
  {
    icon: CheckCircle,
    color: "#3b82f6",
    text: "تم دفع راتب شهر مارس لـ 24 موظف",
    time: "منذ 3 ساعات",
  },
  {
    icon: XCircle,
    color: "#ef4444",
    text: "تم إيقاف اشتراك 5 زبائن تلقائياً",
    time: "منذ 5 ساعات",
  },
];

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Header ── */}
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

      {/* ── Stats Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map(({ title, value, sub, icon: Icon, color, bg }) => (
          <div
            key={title}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "20px 20px",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                className="font-title font-semibold"
                style={{ fontSize: 13, color: "var(--text-muted)" }}
              >
                {title}
              </span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                {sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Row ── */}
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
            <span
              className="font-title font-semibold"
              style={{ fontSize: 14, color: "var(--text)" }}
            >
              آخر النشاطات
            </span>
          </div>
          <div
            style={{
              padding: "8px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {recentActivity.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 8px",
                  borderRadius: 8,
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <item.icon
                  size={15}
                  style={{ color: item.color, flexShrink: 0 }}
                />
                <span
                  className="flex-1 truncate"
                  style={{ fontSize: 13, color: "var(--text)" }}
                >
                  {item.text}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick status */}
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
            <span
              className="font-title font-semibold"
              style={{ fontSize: 14, color: "var(--text)" }}
            >
              حالة النظام
            </span>
          </div>
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[
              {
                label: "الزبائن النشطون",
                value: 285,
                total: 318,
                color: "#f97316",
              },
              {
                label: "النقاط المتصلة",
                value: 41,
                total: 47,
                color: "#22c55e",
              },
              {
                label: "الموظفون النشطون",
                value: 21,
                total: 24,
                color: "#3b82f6",
              },
            ].map(({ label, value, total, color }) => {
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 7,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text)" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {value} / {total}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 7,
                      borderRadius: 999,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 999,
                        background: color,
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

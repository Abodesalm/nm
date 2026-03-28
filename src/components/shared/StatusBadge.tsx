type Status =
  | "active"
  | "inactive"
  | "on-leave"
  | "online"
  | "offline"
  | "maintenance"
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "paid"
  | "unpaid"
  | "waiting"
  | "suspended"
  | string;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> =
  {
    active: { label: "نشط", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
    inactive: {
      label: "غير نشط",
      color: "#6b7280",
      bg: "rgba(107,114,128,0.1)",
    },
    "on-leave": { label: "إجازة", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
    online: { label: "متصل", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
    offline: { label: "غير متصل", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
    maintenance: {
      label: "صيانة",
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
    },
    "in-stock": { label: "متوفر", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
    "low-stock": {
      label: "مخزون منخفض",
      color: "#d97706",
      bg: "rgba(217,119,6,0.1)",
    },
    "out-of-stock": {
      label: "نفد المخزون",
      color: "#dc2626",
      bg: "rgba(220,38,38,0.1)",
    },
    paid: { label: "مدفوع", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
    unpaid: { label: "غير مدفوع", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
    waiting: { label: "انتظار", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
    suspended: { label: "موقوف", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
    not_arrived: { label: "لم يحضر بعد", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
    free: { label: "حر للعمل", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    working: { label: "في العمل", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
    finished: { label: "أنهى يومه", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  };

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.1)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'Cairo', sans-serif",
        color: config.color,
        background: config.bg,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}

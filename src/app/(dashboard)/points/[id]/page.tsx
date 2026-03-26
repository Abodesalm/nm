"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Server,
  Wifi,
  Pencil,
  Network,
  UserCircle,
  Trash2,
  UserPlus,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { PointStatusBadge } from "@/components/points/PointStatusBadge";
import { PointDrawer } from "@/components/points/PointDrawer";
import { MiniMap } from "@/components/points/MiniMap";
import { Pagination } from "@/components/shared/Pagination";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  overflow: "hidden",
};

export default function PointProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [point, setPoint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [custTotal, setCustTotal] = useState(0);
  const [custPage, setCustPage] = useState(1);
  const [custLoading, setCustLoading] = useState(false);

  function fetchPoint() {
    fetch(`/api/points/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setPoint(d.data);
        setLoading(false);
      });
  }

  function fetchCustomers(page: number) {
    setCustLoading(true);
    fetch(`/api/customers?point=${id}&page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.data?.docs ?? []);
        setCustTotal(d.data?.total ?? 0);
        setCustLoading(false);
      });
  }

  useEffect(() => { fetchPoint(); }, [id]);
  useEffect(() => { fetchCustomers(custPage); }, [id, custPage]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "'Tajawal', sans-serif" }}>
          جاري التحميل...
        </p>
      </div>
    );
  }

  if (!point) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "'Tajawal', sans-serif" }}>
          النقطة غير موجودة
        </p>
      </div>
    );
  }

  const usedPct =
    point.totalPorts > 0
      ? Math.round((point.usedPorts / point.totalPorts) * 100)
      : 0;

  const barColor =
    usedPct >= 90 ? "#ef4444" : usedPct >= 70 ? "#f97316" : "#22c55e";

  const freeColor =
    point.freePorts <= 2
      ? "#ef4444"
      : point.freePorts <= 4
        ? "#f97316"
        : "#22c55e";

  const custStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: "فعال",    color: "#16a34a", bg: "rgba(34,197,94,0.1)"  },
    waiting:   { label: "انتظار",  color: "#ca8a04", bg: "rgba(234,179,8,0.1)" },
    suspended: { label: "موقوف",   color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
    inactive:  { label: "غير نشط", color: "#6366f1", bg: "rgba(99,102,241,0.1)"},
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    fontFamily: "'Tajawal', sans-serif",
    textAlign: "right",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "11px 14px",
    fontSize: 13,
    color: "var(--text)",
    fontFamily: "'Tajawal', sans-serif",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Back + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            cursor: "pointer",
          }}
        >
          <ArrowRight size={15} /> رجوع
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push(`/customers?point=${id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <UserPlus size={14} /> إضافة زبون
          </button>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "none",
              background: "#f97316",
              color: "#fff",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
            }}
          >
            <Pencil size={14} /> تعديل
          </button>
        </div>
      </div>

      {/* Header card */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "rgba(249,115,22,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {point.captivePortal?.hasRouter
              ? <Wifi size={28} color="#f97316" />
              : <Server size={28} color="#f97316" />
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "rgba(249,115,22,0.1)",
                  color: "#f97316",
                  padding: "3px 10px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                #{point.point_number}
              </span>
              <h1
                className="font-title font-bold"
                style={{ fontSize: 22, color: "var(--text)" }}
              >
                {point.name}
              </h1>
              <PointStatusBadge status={point.status} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                <MapPin size={13} /> {point.mainRegion} · {point.region}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                <Network size={13} />
                {point.providerPoint
                  ? `#${point.providerPoint.point_number} ${point.providerPoint.name}`
                  : "الجذر — MikroTik المركزي"}
              </span>
              {point.location?.address && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                  <MapPin size={13} /> {point.location.address}
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
            <QuickStat label="الزبائن" value={point.customersCount ?? 0} color="#6366f1" />
            <QuickStat label="فرعية" value={point.childPoints?.length ?? 0} color="#f97316" />
            <QuickStat label="سويتشات" value={point.switches} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* Ports card */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          المنافذ
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <PortStat label="الإجمالي" value={point.totalPorts} color="var(--text)" />
          <PortStat label="مستخدمة" value={point.usedPorts} color="#f97316" />
          <PortStat label="حرة" value={point.freePorts} color={freeColor} />
        </div>
        <div
          style={{
            height: 8,
            background: "var(--border)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${usedPct}%`,
              background: barColor,
              borderRadius: 99,
              transition: "width 0.4s",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 6,
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          {usedPct}% مستخدم
        </p>
      </div>

      {/* Notes */}
      {point.notes && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileText size={13} /> ملاحظات
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--text)",
              fontFamily: "'Tajawal', sans-serif",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {point.notes}
          </p>
        </div>
      )}

      {/* Mini Map */}
      {point.location?.lat && point.location?.lng && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MapPin size={13} /> الموقع الجغرافي
          </p>
          <MiniMap
            lat={point.location.lat}
            lng={point.location.lng}
            label={point.name || `#${point.point_number}`}
          />
          {point.location.address && (
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <MapPin size={11} /> {point.location.address}
            </p>
          )}
        </div>
      )}

      {/* Employees */}
      {point.employees?.length > 0 && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            الموظفون المسؤولون
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {point.employees.map((emp: any) => (
              <div
                key={emp._id}
                onClick={() => router.push(`/employees/${emp._id}`)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#f97316";
                  (e.currentTarget as HTMLDivElement).style.color = "#f97316";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLDivElement).style.color = "var(--text)";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: 8,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--text)",
                  fontFamily: "'Tajawal', sans-serif",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                <UserCircle size={14} />
                {emp.fullName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {point.equipment?.length > 0 && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            المعدات
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {point.equipment.map((eq: any) => (
              <EquipmentCard
                key={eq._id}
                eq={eq}
                pointId={id}
                onRemoved={fetchPoint}
              />
            ))}
          </div>
        </div>
      )}

      {/* Connection Tree */}
      {(point.providerPoint || point.childPoints?.length > 0) && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Network size={13} /> شجرة الاتصال
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {/* Provider */}
            {point.providerPoint && (
              <>
                <TreeNode
                  point={point.providerPoint}
                  highlighted={false}
                  onClick={() => router.push(`/points/${point.providerPoint._id}`)}
                />
                <Connector />
              </>
            )}

            {/* Current point */}
            <TreeNode
              point={point}
              highlighted
              onClick={undefined}
            />

            {/* Children */}
            {point.childPoints?.length > 0 && (
              <>
                <Connector />
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {point.childPoints.map((child: any) => (
                    <TreeNode
                      key={child._id}
                      point={child}
                      highlighted={false}
                      onClick={() => router.push(`/points/${child._id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customers */}
      <div style={{ ...cardStyle }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: custTotal > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            الزبائن ({custTotal})
          </p>
        </div>

        {custLoading ? (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              fontSize: 13,
            }}
          >
            جاري التحميل...
          </div>
        ) : customers.length === 0 ? (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              fontSize: 13,
            }}
          >
            لا يوجد زبائن في هذه النقطة
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["رقم الزبون", "الاسم", "الهاتف", "PPPoE", "الحالة"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c._id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "#f97316",
                            fontWeight: 700,
                          }}
                        >
                          #{c.customer_number}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{c.name}</td>
                      <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{c.phone}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
                        {c.pppoe?.username}
                      </td>
                      <td style={tdStyle}>
                        {custStatusConfig[c.status] && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 10px",
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "'Cairo', sans-serif",
                              color: custStatusConfig[c.status].color,
                              background: custStatusConfig[c.status].bg,
                            }}
                          >
                            {custStatusConfig[c.status].label}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "4px 14px", borderTop: "1px solid var(--border)" }}>
              <Pagination
                page={custPage}
                total={custTotal}
                limit={10}
                onPageChange={setCustPage}
                onLimitChange={() => {}}
              />
            </div>
          </>
        )}
      </div>

      <PointDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { fetchPoint(); setEditOpen(false); }}
        point={point}
      />
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Tajawal', sans-serif", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", marginTop: 3 }}>
        {label}
      </p>
    </div>
  );
}

function PortStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "12px 14px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Tajawal', sans-serif" }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", marginTop: 3 }}>
        {label}
      </p>
    </div>
  );
}

function Connector() {
  return (
    <div
      style={{
        width: 2,
        height: 20,
        background: "var(--border)",
        flexShrink: 0,
      }}
    />
  );
}

function TreeNode({
  point,
  highlighted,
  onClick,
}: {
  point: any;
  highlighted: boolean;
  onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 10,
        border: `2px solid ${highlighted ? "#f97316" : hov && onClick ? "#f97316" : "var(--border)"}`,
        background: highlighted ? "rgba(249,115,22,0.06)" : "var(--bg)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s",
        minWidth: 160,
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 12,
          color: "#f97316",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        #{point.point_number}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "var(--text)",
          fontFamily: "'Tajawal', sans-serif",
          fontWeight: highlighted ? 600 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {point.name}
      </span>
      <PointStatusBadge status={point.status} />
    </div>
  );
}

function EquipmentCard({
  eq,
  pointId,
  onRemoved,
}: {
  eq: any;
  pointId: string;
  onRemoved: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRemove() {
    if (!confirm(`هل تريد إزالة "${eq.itemId?.name ?? "هذا العنصر"}" من معدات النقطة؟`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/points/${pointId}/equipment`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: eq.itemId?._id ?? eq.itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("تمت الإزالة من معدات النقطة");
      onRemoved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: "10px 14px",
        borderRadius: 10,
        background: "var(--bg)",
        border: `1px solid ${hovered ? "var(--border)" : "var(--border)"}`,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "'Tajawal', sans-serif", paddingLeft: 22 }}>
        {eq.itemId?.name ?? "عنصر محذوف"}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontFamily: "'Tajawal', sans-serif" }}>
        الكمية: {eq.quantity} {eq.itemId?.unit ?? ""}
      </p>
      {hovered && (
        <button
          onClick={handleRemove}
          disabled={deleting}
          title="إزالة من المعدات فقط"
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "none",
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            cursor: deleting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

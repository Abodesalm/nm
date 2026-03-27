"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageSpinner } from "@/components/shared/Spinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmployeeDrawer } from "@/components/employees/EmployeeDrawer";
import { AbsentsDrawer } from "@/components/employees/AbsentsDrawer";
import { SalariesDrawer } from "@/components/employees/SalariesDrawer";
import { LoansDrawer } from "@/components/employees/LoansDrawer";
import {
  ArrowRight,
  Pencil,
  Calendar,
  DollarSign,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building2,
  Trash2,
  Download,
  User,
} from "lucide-react";

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    departments: [],
    roles: [],
    defaultExchangeRate: 15000,
  });
  const [loading, setLoading] = useState(true);

  const [editDrawer, setEditDrawer] = useState(false);
  const [absentsDrawer, setAbsentsDrawer] = useState(false);
  const [salariesDrawer, setSalariesDrawer] = useState(false);
  const [loansDrawer, setLoansDrawer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchEmployee = useCallback(async () => {
    const res = await fetch(`/api/employees/${id}`);
    const json = await res.json();
    setEmployee(json.data);
  }, [id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const [_, settingsRes, hrRes] = await Promise.all([
        fetchEmployee(),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/settings/hr").then((r) => r.json()),
      ]);
      setSettings({
        departments: hrRes.data?.departments ?? [],
        roles: hrRes.data?.roles ?? [],
        defaultExchangeRate: settingsRes.data?.defaultExchangeRate ?? 15000,
      });
      setLoading(false);
    }
    init();
  }, [id]);

  async function handleDelete() {
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    router.push("/employees");
  }

  if (loading) return <PageSpinner />;
  if (!employee)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          الموظف غير موجود
        </p>
      </div>
    );

  const now = new Date();
  const currentYear = now.getFullYear();
  const unpaidLoans =
    employee.loans?.filter((l: any) => l.state === "unpaid" && !l.hidden) ?? [];
  const unpaidTotal = unpaidLoans.reduce(
    (acc: number, l: any) => acc + (l.amount?.USD ?? 0),
    0,
  );
  const yearSalaries =
    employee.salaries?.filter((s: any) => s.year === currentYear) ?? [];
  const totalSalariesPaid = yearSalaries.reduce(
    (acc: number, s: any) => acc + (s.amount?.USD ?? 0),
    0,
  );
  const currentMonthAbsents =
    employee.absents?.filter((a: any) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === currentYear;
    }) ?? [];

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    overflow: "hidden",
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
          onClick={() => router.push("/employees")}
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
          {employee.cv && (
            <a
              href={employee.cv}
              target="_blank"
              rel="noopener noreferrer"
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
                textDecoration: "none",
              }}
            >
              <Download size={14} /> تحميل CV
            </a>
          )}
          <button
            onClick={() => setEditDrawer(true)}
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
            <Pencil size={14} /> تعديل
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "none",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </div>

      {/* Header card */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Photo or Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(249,115,22,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#f97316",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {employee.fullName?.[0]}
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, marginTop: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
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
                #{employee.id_num}
              </span>
              <h1
                className="font-title font-bold"
                style={{ fontSize: 22, color: "var(--text)" }}
              >
                {employee.fullName}
              </h1>
              <StatusBadge status={employee.state} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 30,
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: Briefcase, text: employee.role },
                { icon: Building2, text: employee.department },
                ...(employee.phone
                  ? [{ icon: Phone, text: employee.phone }]
                  : []),
                ...(employee.email
                  ? [{ icon: Mail, text: employee.email }]
                  : []),
                ...(employee.address
                  ? [{ icon: MapPin, text: employee.address }]
                  : []),
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Icon
                    size={13}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Salary */}
          {employee.salary?.USD > 0 && (
            <div style={{ textAlign: "left", flexShrink: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 2,
                }}
              >
                الراتب الأساسي
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                ${employee.salary.USD.toFixed(2)}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {employee.salary.SP?.toLocaleString("en")} ل.س
              </p>
            </div>
          )}
        </div>

        {employee.notes && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "var(--bg)",
              borderRadius: 9,
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {employee.notes}
            </p>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {[
          {
            label: "غيابات هذا الشهر",
            value: currentMonthAbsents.length,
            sub: `${currentMonthAbsents.filter((a: any) => a.excused).length} بعذر`,
            color: "#f97316",
            bg: "rgba(249,115,22,0.08)",
            action: () => setAbsentsDrawer(true),
            actionLabel: "عرض الغيابات",
            icon: Calendar,
          },
          {
            label: `رواتب ${currentYear}`,
            value: `$${totalSalariesPaid.toFixed(0)}`,
            sub: `${yearSalaries.length} شهر مدفوع`,
            color: "#22c55e",
            bg: "rgba(34,197,94,0.08)",
            action: () => setSalariesDrawer(true),
            actionLabel: "عرض الرواتب",
            icon: DollarSign,
          },
          {
            label: "السلف غير المدفوعة",
            value: `$${unpaidTotal.toFixed(0)}`,
            sub: `${unpaidLoans.length} سلفة`,
            color: "#ef4444",
            bg: "rgba(239,68,68,0.08)",
            action: () => setLoansDrawer(true),
            actionLabel: "عرض السلف",
            icon: CreditCard,
          },
        ].map(
          ({
            label,
            value,
            sub,
            color,
            bg,
            action,
            actionLabel,
            icon: Icon,
          }) => (
            <div
              key={label}
              style={{
                ...cardStyle,
                padding: 18,
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onClick={action}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0,0,0,0.08)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color,
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {sub}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#f97316",
                  marginTop: 8,
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                {actionLabel} ←
              </p>
            </div>
          ),
        )}
      </div>

      {/* Recent absents */}
      {employee.absents?.length > 0 && (
        <div style={cardStyle}>
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
              آخر الغيابات
            </h3>
            <button
              onClick={() => setAbsentsDrawer(true)}
              style={{
                fontSize: 12,
                color: "#f97316",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              عرض الكل
            </button>
          </div>
          <div
            style={{
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {[...employee.absents]
              .reverse()
              .slice(0, 5)
              .map((a: any) => {
                const d = new Date(a.date);
                return (
                  <div
                    key={a._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: a.excused ? "#22c55e" : "#ef4444",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: a.excused ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      {a.excused ? "بعذر" : "بدون عذر"}
                    </span>
                    {a.reason && (
                      <span
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {a.reason}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent loans */}
      {employee.loans?.length > 0 && (
        <div style={cardStyle}>
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
              السلف
            </h3>
            <button
              onClick={() => setLoansDrawer(true)}
              style={{
                fontSize: 12,
                color: "#f97316",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              عرض الكل
            </button>
          </div>
          <div
            style={{
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {[...employee.loans]
              .filter((l) => !l.hidden)
              .reverse()
              .slice(0, 5)
              .map((l: any) => (
                <div
                  key={l._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      ${l.amount?.USD?.toFixed(2)}
                    </p>
                    {l.notes && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {l.notes}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={l.state} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(l.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Drawers */}
      <EmployeeDrawer
        open={editDrawer}
        onClose={() => setEditDrawer(false)}
        onSaved={fetchEmployee}
        employee={employee}
        settings={settings}
      />
      <AbsentsDrawer
        open={absentsDrawer}
        onClose={() => setAbsentsDrawer(false)}
        employee={employee}
        onUpdate={fetchEmployee}
      />
      <SalariesDrawer
        open={salariesDrawer}
        onClose={() => setSalariesDrawer(false)}
        employee={employee}
        defaultExchange={settings.defaultExchangeRate}
        onUpdate={fetchEmployee}
      />
      <LoansDrawer
        open={loansDrawer}
        onClose={() => setLoansDrawer(false)}
        employee={employee}
        defaultExchange={settings.defaultExchangeRate}
        onUpdate={fetchEmployee}
      />

      {confirmDelete && (
        <ConfirmDialog
          title="حذف الموظف"
          message={`هل أنت متأكد من حذف الموظف ${employee.fullName}؟`}
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, LayoutList, LayoutGrid, RefreshCw } from "lucide-react";
import { FieldWorkTable } from "@/components/fieldwork/FieldWorkTable";
import { FieldWorkCards } from "@/components/fieldwork/FieldWorkCards";
import { StatusChangeDrawer } from "@/components/fieldwork/StatusChangeDrawer";

type View = "table" | "cards";

const STATUS_META: {
  value: string;
  label: string;
  color: string;
}[] = [
  { value: "not_arrived", label: "لم يحضر بعد", color: "#6b7280" },
  { value: "free", label: "حر للعمل", color: "#3b82f6" },
  { value: "working", label: "في العمل", color: "#f97316" },
  { value: "finished", label: "أنهى يومه", color: "#16a34a" },
];

function getStatus(log: any | null) {
  return log?.status ?? "not_arrived";
}

export default function FieldWorkPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.isSuperAdmin;
  const canEdit =
    isSuperAdmin ||
    user?.permissions?.find((p: any) => p.section === "fieldwork")
      ?.permission === "full";

  const [view, setView] = useState<View>("table");
  const [data, setData] = useState<{ employee: any; log: any | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [changeTarget, setChangeTarget] = useState<{
    employee: any;
    log: any | null;
  } | null>(null);

  // Persist view preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fieldwork-view") as View | null;
      if (saved === "table" || saved === "cards") setView(saved);
    } catch {}
  }, []);

  function switchView(v: View) {
    setView(v);
    try {
      localStorage.setItem("fieldwork-view", v);
    } catch {}
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fieldwork");
      const json = await res.json();
      if (json.status === "success") setData(json.data);
    } catch {}
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering
  const filteredData = data.filter((item) => {
    const matchSearch =
      !search ||
      item.employee.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      item.employee.fullName?.includes(search);
    const matchStatus =
      !statusFilter || getStatus(item.log) === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary counts (from full data, not filtered)
  const counts = STATUS_META.reduce(
    (acc, s) => {
      acc[s.value] = data.filter((d) => getStatus(d.log) === s.value).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const today = new Date().toLocaleDateString("ar-SY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        padding: "24px 28px",
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            className="font-title"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.2,
              textWrap: "balance",
            }}
          >
            العمل الميداني
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
              marginTop: 4,
            }}
          >
            {today}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          aria-label="تحديث البيانات"
          disabled={loading}
          style={{
            height: 36,
            width: 36,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text-muted)",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.15s",
            flexShrink: 0,
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) =>
            !loading && (e.currentTarget.style.borderColor = "#f97316")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          <RefreshCw
            size={15}
            aria-hidden="true"
            style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      {/* ── Summary chips ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
        role="group"
        aria-label="فلترة حسب الحالة"
      >
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          aria-pressed={statusFilter === ""}
          style={{
            height: 32,
            padding: "0 14px",
            borderRadius: 99,
            border:
              statusFilter === ""
                ? "1.5px solid #f97316"
                : "1.5px solid var(--border)",
            background:
              statusFilter === "" ? "rgba(249,115,22,0.1)" : "var(--bg)",
            color: statusFilter === "" ? "#f97316" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            fontWeight: statusFilter === "" ? 600 : 400,
            transition: "all 0.15s",
            touchAction: "manipulation",
          }}
        >
          الكل ({data.length})
        </button>
        {STATUS_META.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() =>
              setStatusFilter((v) => (v === s.value ? "" : s.value))
            }
            aria-pressed={statusFilter === s.value}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 99,
              border:
                statusFilter === s.value
                  ? `1.5px solid ${s.color}`
                  : "1.5px solid var(--border)",
              background:
                statusFilter === s.value ? `${s.color}18` : "var(--bg)",
              color: statusFilter === s.value ? s.color : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: statusFilter === s.value ? 600 : 400,
              transition: "all 0.15s",
              touchAction: "manipulation",
            }}
          >
            {s.label} ({counts[s.value] ?? 0})
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search
            size={15}
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <label htmlFor="fieldwork-search" className="sr-only">
            بحث عن موظف
          </label>
          <input
            id="fieldwork-search"
            type="search"
            name="fieldwork-search"
            autoComplete="off"
            placeholder="بحث بالاسم…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: 38,
              padding: "0 36px 0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              outline: "none",
              width: "100%",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* View toggle */}
        <div
          role="group"
          aria-label="طريقة العرض"
          style={{
            display: "flex",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => switchView("table")}
            aria-pressed={view === "table"}
            aria-label="عرض جدول"
            style={{
              width: 38,
              height: 38,
              border: "none",
              borderLeft: "1px solid var(--border)",
              background: view === "table" ? "var(--border)" : "var(--bg)",
              color: view === "table" ? "var(--text)" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
              touchAction: "manipulation",
            }}
          >
            <LayoutList size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => switchView("cards")}
            aria-pressed={view === "cards"}
            aria-label="عرض بطاقات"
            style={{
              width: 38,
              height: 38,
              border: "none",
              background: view === "cards" ? "var(--border)" : "var(--bg)",
              color: view === "cards" ? "var(--text)" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
              touchAction: "manipulation",
            }}
          >
            <LayoutGrid size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
            fontSize: 14,
          }}
          aria-live="polite"
          aria-busy="true"
        >
          جاري التحميل…
        </div>
      ) : view === "table" ? (
        <FieldWorkTable
          data={filteredData}
          onChangeStatus={setChangeTarget}
          canEdit={canEdit}
        />
      ) : (
        <FieldWorkCards
          data={filteredData}
          onChangeStatus={setChangeTarget}
          canEdit={canEdit}
        />
      )}

      {/* ── Status change drawer ── */}
      <StatusChangeDrawer
        open={!!changeTarget}
        onClose={() => setChangeTarget(null)}
        onSaved={fetchData}
        employee={changeTarget?.employee}
        log={changeTarget?.log ?? null}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}

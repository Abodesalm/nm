"use client";

import { useState, useEffect } from "react";
import {
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  Package,
  Search,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { InvoiceTable } from "@/components/finance/InvoiceTable";
import { downloadXLSX } from "@/lib/exportXLSX";

// ─── helpers ─────────────────────────────────────────────────────────────────

function pct(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

function fmtUSD(n: number) {
  return n.toLocaleString("en", { minimumFractionDigits: 0 });
}

function fmtSP(n: number) {
  return n.toLocaleString("en");
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  usd,
  sp,
  prevUsd,
  icon: Icon,
  color,
  invertGood,
}: {
  label: string;
  usd: number;
  sp: number;
  prevUsd: number;
  icon: React.ElementType;
  color: string;
  invertGood: boolean; // true = lower change is good (costs), false = higher is good (earns)
}) {
  const diff = pct(usd, prevUsd);
  const isPositive = diff >= 0;
  const isGood = invertGood ? !isPositive : isPositive;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
          {label}
        </span>
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} style={{ color }} />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", fontFamily: "'Cairo', sans-serif" }}>
            ${fmtUSD(usd)}
          </span>
          <span
            style={{
              fontSize: 12, fontWeight: 600, padding: "2px 7px",
              borderRadius: 20,
              background: isGood ? "#22c55e18" : "#ef444418",
              color: isGood ? "#22c55e" : "#ef4444",
              display: "inline-flex", alignItems: "center", gap: 2,
            }}
          >
            {isPositive ? "+" : ""}{diff}%
          </span>
        </div>
        {sp > 0 && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", marginTop: 2 }}>
            {fmtSP(sp)} ل.س
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", marginTop: 4 }}>
          مقارنةً بالشهر الماضي
        </div>
      </div>
    </div>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 80, height: 14, borderRadius: 6, background: "var(--border)" }} />
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--border)" }} />
      </div>
      <div>
        <div style={{ width: 90, height: 28, borderRadius: 6, background: "var(--border)", marginBottom: 6 }} />
        <div style={{ width: 60, height: 12, borderRadius: 6, background: "var(--border)" }} />
      </div>
    </div>
  );
}

// ─── custom recharts tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "10px 14px", fontSize: 13,
        fontFamily: "'Tajawal', sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--text-muted)" }}>{p.name === "costs" ? "تكاليف" : "دخل"}:</span>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>${fmtUSD(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  // Invoice table filters
  const [search,         setSearch]         = useState("");
  const [filterType,     setFilterType]     = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [refresh,        setRefresh]        = useState(0);
  const [exporting,      setExporting]      = useState(false);

  useEffect(() => { fetchStats(); }, [chartYear]);

  async function fetchStats() {
    setLoading(true);
    const res  = await fetch(`/api/finance/stats?year=${chartYear}`);
    const json = await res.json();
    setStats(json.data);
    setLoading(false);
  }

  async function handleExport() {
    setExporting(true);
    const params = new URLSearchParams({
      page: "1", limit: "10000",
      ...(filterType     && { type: filterType }),
      ...(filterCategory && { category: filterCategory }),
      ...(dateFrom       && { dateFrom }),
      ...(dateTo         && { dateTo }),
      ...(search         && { search }),
    });
    const res  = await fetch(`/api/finance/invoices?${params}`);
    const json = await res.json();
    const rows = (json.data?.invoices ?? []).map((inv: any) => ({
      "رقم الفاتورة": `#${inv.invoiceNumber}`,
      "النوع":        inv.type === "salary" ? "راتب" : inv.type === "subscription" ? "اشتراك" : "تكلفة مخزن",
      "الفئة":        inv.category === "earn" ? "دخل" : "تكلفة",
      "الوصف":        inv.description,
      "المبلغ ($)":   inv.amount?.USD ?? 0,
      "المبلغ (ل.س)": inv.amount?.SP  ?? 0,
      "التاريخ":      new Date(inv.date).toLocaleDateString("ar-SY"),
    }));
    downloadXLSX(rows, `فواتير-${new Date().toISOString().slice(0, 10)}`);
    setExporting(false);
  }

  const c  = stats?.currentMonth;
  const p  = stats?.prevMonth;
  const ct = stats?.byType?.current;
  const pt = stats?.byType?.prev;

  return (
    <main style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "'Cairo', sans-serif", margin: 0 }}>
          المالية
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", margin: "4px 0 0" }}>
          إجماليات الدخل والتكاليف والفواتير
        </p>
      </div>

      {/* ── Row 1: 2 big stat cards + monthly chart ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 2fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, height: 220 }} />
          </>
        ) : (
          <>
            <StatCard
              label="إجمالي التكاليف هذا الشهر"
              usd={c?.costs?.USD ?? 0}
              sp={c?.costs?.SP ?? 0}
              prevUsd={p?.costs?.USD ?? 0}
              icon={TrendingDown}
              color="#ef4444"
              invertGood={true}
            />
            <StatCard
              label="إجمالي الدخل هذا الشهر"
              usd={c?.earns?.USD ?? 0}
              sp={c?.earns?.SP ?? 0}
              prevUsd={p?.earns?.USD ?? 0}
              icon={TrendingUp}
              color="#22c55e"
              invertGood={false}
            />

            {/* Monthly chart */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "'Cairo', sans-serif" }}>
                  التكاليف والدخل الشهري
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => setChartYear((y) => y - 1)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
                  >
                    <ChevronRight size={15} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "'Cairo', sans-serif", minWidth: 42, textAlign: "center" }}>
                    {chartYear}
                  </span>
                  <button
                    onClick={() => setChartYear((y) => y + 1)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={stats?.chart ?? []} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="colorEarns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontFamily: "'Tajawal', sans-serif" }}
                    formatter={(value) => value === "costs" ? "تكاليف" : "دخل"}
                  />
                  <Area type="monotone" dataKey="costs" name="costs" stroke="#ef4444" strokeWidth={2} fill="url(#colorCosts)" dot={false} />
                  <Area type="monotone" dataKey="earns" name="earns" stroke="#22c55e" strokeWidth={2} fill="url(#colorEarns)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* ── Row 2: 3 sub-stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <StatCard
              label="الرواتب هذا الشهر"
              usd={ct?.salary?.USD ?? 0}
              sp={ct?.salary?.SP ?? 0}
              prevUsd={pt?.salary?.USD ?? 0}
              icon={Users}
              color="#3b82f6"
              invertGood={true}
            />
            <StatCard
              label="الاشتراكات هذا الشهر"
              usd={ct?.subscription?.USD ?? 0}
              sp={ct?.subscription?.SP ?? 0}
              prevUsd={pt?.subscription?.USD ?? 0}
              icon={Wifi}
              color="#22c55e"
              invertGood={false}
            />
            <StatCard
              label="تكاليف المخزن هذا الشهر"
              usd={ct?.storage_action?.USD ?? 0}
              sp={ct?.storage_action?.SP ?? 0}
              prevUsd={pt?.storage_action?.USD ?? 0}
              icon={Package}
              color="#f97316"
              invertGood={true}
            />
          </>
        )}
      </div>

      {/* ── Invoice Table Section ── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", fontFamily: "'Cairo', sans-serif", margin: "0 0 14px" }}>
          الفواتير
        </h2>

        {/* Filters bar */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
            <Search
              size={14}
              style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم أو وصف..."
              style={{
                width: "100%", height: 38, paddingRight: 34, paddingLeft: 12,
                borderRadius: 8, border: "1px solid var(--border)",
                background: "var(--bg)", color: "var(--text)",
                fontSize: 13, fontFamily: "'Tajawal', sans-serif",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              height: 38, padding: "0 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: 13,
              fontFamily: "'Tajawal', sans-serif", outline: "none", cursor: "pointer",
            }}
          >
            <option value="">كل الأنواع</option>
            <option value="salary">رواتب</option>
            <option value="subscription">اشتراكات</option>
            <option value="storage_action">تكاليف مخزن</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              height: 38, padding: "0 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: 13,
              fontFamily: "'Tajawal', sans-serif", outline: "none", cursor: "pointer",
            }}
          >
            <option value="">كل الفئات</option>
            <option value="cost">تكلفة</option>
            <option value="earn">دخل</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              height: 38, padding: "0 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: dateFrom ? "var(--text)" : "var(--text-muted)",
              fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              height: 38, padding: "0 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: dateTo ? "var(--text)" : "var(--text-muted)",
              fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none",
            }}
          />

          {/* Clear filters */}
          {(search || filterType || filterCategory || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setFilterType(""); setFilterCategory(""); setDateFrom(""); setDateTo(""); }}
              style={{
                height: 38, padding: "0 14px", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", fontSize: 13,
                fontFamily: "'Tajawal', sans-serif", cursor: "pointer",
              }}
            >
              مسح الفلاتر
            </button>
          )}

          {/* Export — pushed to left (RTL: start) */}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              height: 38, padding: "0 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-muted)", fontSize: 13,
              fontFamily: "'Tajawal', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              marginRight: "auto",
            }}
          >
            <FileDown size={14} />
            {exporting ? "جاري التصدير..." : "تصدير XLSX"}
          </button>
        </div>

        <InvoiceTable
          key={refresh}
          refresh={refresh}
          search={search}
          filterType={filterType}
          filterCategory={filterCategory}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/shared/Spinner";
import {
  ArrowRight,
  Wallet,
  Plus,
  Minus,
  ChevronDown,
  Settings,
} from "lucide-react";

function fmtSP(n: number) {
  return (+n.toFixed(1)).toLocaleString("en");
}
function fmtUSD(n: number) {
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

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

interface Sums {
  depositSP: number;
  depositUSD: number;
  withdrawSP: number;
  withdrawUSD: number;
  count: number;
}

interface CategoryStats {
  category: string;
  name: string;
  lifetime: Sums;
  monthly: Sums;
  entries: any[];
}

const selectStyle: React.CSSProperties = {
  height: 38,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  cursor: "pointer",
};

export default function FinanceCategoriesPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/finance/categories?month=${month}&year=${year}`,
    );
    const json = await res.json();
    setCategories(json.data?.categories ?? []);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  if (loading && categories.length === 0) return <PageSpinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/finance")}
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
          <div>
            <h1
              className="font-title font-bold"
              style={{ fontSize: 22, color: "var(--text)" }}
            >
              الصناديق
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              تصنيفات حركات الخزينة — إحصائيات شهرية وإجمالية لكل صندوق
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            style={selectStyle}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            style={selectStyle}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => router.push("/settings/finance")}
            title="إدارة الصناديق"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <Settings size={14} /> إدارة الصناديق
          </button>
        </div>
      </div>

      {/* Category cards */}
      {categories.length === 0 ? (
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          لا يوجد صناديق — أضفها من إعدادات المالية
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {categories.map((c) => {
            const isOpen = expanded === c.category;
            const monthNetSP = c.monthly.depositSP - c.monthly.withdrawSP;
            const lifeNetSP = c.lifetime.depositSP - c.lifetime.withdrawSP;
            return (
              <div
                key={c.category}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* Card header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : c.category)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px 20px",
                    cursor: "pointer",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "rgba(249,115,22,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Wallet size={17} style={{ color: "#f97316" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <p
                      className="font-title font-semibold"
                      style={{ fontSize: 15.5, color: "var(--text)" }}
                    >
                      {c.name}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {c.monthly.count} حركة هذا الشهر — {c.lifetime.count} حركة
                      إجمالاً
                    </p>
                  </div>

                  {/* Monthly stats */}
                  <StatBlock
                    title={`${MONTHS[month - 1]} ${year}`}
                    inSP={c.monthly.depositSP}
                    outSP={c.monthly.withdrawSP}
                    netSP={monthNetSP}
                  />
                  {/* Lifetime stats */}
                  <StatBlock
                    title="كل الوقت"
                    inSP={c.lifetime.depositSP}
                    outSP={c.lifetime.withdrawSP}
                    netSP={lifeNetSP}
                  />

                  <ChevronDown
                    size={17}
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  />
                </div>

                {/* Records of the selected month */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding: "12px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {c.entries.length === 0 ? (
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-muted)",
                          textAlign: "center",
                          padding: "10px 0",
                        }}
                      >
                        لا توجد حركات في هذا الشهر
                      </p>
                    ) : (
                      c.entries.map((e: any) => (
                        <div
                          key={e._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 9,
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              flexShrink: 0,
                              background:
                                e.type === "deposit"
                                  ? "#22c55e18"
                                  : "#ef444418",
                              color:
                                e.type === "deposit" ? "#22c55e" : "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {e.type === "deposit" ? (
                              <Plus size={13} />
                            ) : (
                              <Minus size={13} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text)",
                                fontFamily: "'Tajawal', sans-serif",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {e.description}
                            </p>
                            <p
                              style={{
                                fontSize: 11.5,
                                color: "var(--text-muted)",
                              }}
                            >
                              {new Date(e.date).toLocaleDateString("en-GB")}
                              {e.notes ? ` — ${e.notes}` : ""}
                            </p>
                          </div>
                          <div style={{ textAlign: "left", flexShrink: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color:
                                  e.type === "deposit" ? "#22c55e" : "#ef4444",
                                fontFamily: "'Cairo', sans-serif",
                              }}
                            >
                              {e.type === "deposit" ? "+" : "−"}
                              {fmtSP(e.amount?.SP ?? 0)} ل.س
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              ${fmtUSD(e.amount?.USD ?? 0)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBlock({
  title,
  inSP,
  outSP,
  netSP,
}: {
  title: string;
  inSP: number;
  outSP: number;
  netSP: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "6px 14px",
        borderRadius: 10,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        minWidth: 150,
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          color: "var(--text-muted)",
          fontFamily: "'Cairo', sans-serif",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: 11.5, color: "#22c55e" }}>
        + {fmtSP(inSP)} ل.س
      </span>
      <span style={{ fontSize: 11.5, color: "#ef4444" }}>
        − {fmtSP(outSP)} ل.س
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: "'Cairo', sans-serif",
          color: netSP >= 0 ? "var(--text)" : "#ef4444",
        }}
      >
        الصافي: {fmtSP(netSP)} ل.س
      </span>
    </div>
  );
}

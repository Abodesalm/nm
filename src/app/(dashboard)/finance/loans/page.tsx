"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Drawer } from "@/components/shared/Drawer";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { PageSpinner, Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import {
  ArrowRight,
  Plus,
  Trash2,
  HandCoins,
  Handshake,
  Search,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function fmtSP(n: number) {
  return n.toLocaleString("en");
}
function fmtUSD(n: number) {
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <LoansPageInner />
    </Suspense>
  );
}

function LoansPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loans, setLoans] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [defaultExchange, setDefaultExchange] = useState(15000);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [direction, setDirection] = useState(
    searchParams.get("direction") ?? "",
  );
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");

  const [addDrawer, setAddDrawer] = useState(false);
  const [payLoan, setPayLoan] = useState<any>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(direction && { direction }),
      ...(status && { status }),
      ...(search && { search }),
    });
    const res = await fetch(`/api/finance/loans?${params}`);
    const json = await res.json();
    setLoans(json.data?.loans ?? []);
    setSummary(json.data?.summary ?? null);
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }, [page, limit, direction, status, search]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.defaultExchangeRate)
          setDefaultExchange(d.data.defaultExchangeRate);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [direction, status, search]);

  async function handleDelete(id: string) {
    await fetch(`/api/finance/loans/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchLoans();
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 20,
  };

  return (
    <main style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/finance")}
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
            <ArrowRight size={15} /> المالية
          </button>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "'Cairo', sans-serif",
                margin: 0,
              }}
            >
              الديون والقروض
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
                margin: "4px 0 0",
              }}
            >
              ديون الشركة — علينا ولنا
            </p>
          </div>
        </div>
        <button
          onClick={() => setAddDrawer(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 40,
            padding: "0 18px",
            borderRadius: 9,
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontSize: 13.5,
            fontFamily: "'Tajawal', sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }}
        >
          <Plus size={15} /> إضافة دين
        </button>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "ديون علينا (مفتوحة)",
            data: summary?.on_us,
            color: "#ef4444",
            icon: HandCoins,
          },
          {
            label: "ديون لنا (مفتوحة)",
            data: summary?.for_us,
            color: "#22c55e",
            icon: Handshake,
          },
        ].map(({ label, data, color, icon: Icon }) => (
          <div key={label} style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
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
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={17} style={{ color }} />
              </div>
            </div>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                color,
                fontFamily: "'Cairo', sans-serif",
                marginTop: 8,
              }}
            >
              {fmtSP(data?.SP ?? 0)} <span style={{ fontSize: 13 }}>ل.س</span>
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
                marginTop: 2,
              }}
            >
              {data?.count ?? 0} دين — ≈ ${fmtUSD(data?.USD ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
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
        <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              right: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الطرف..."
            style={{ ...inputStyle, width: "100%", paddingRight: 34 }}
          />
        </div>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">كل الاتجاهات</option>
          <option value="on_us">علينا</option>
          <option value="for_us">لنا</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">كل الحالات</option>
          <option value="open">مفتوح</option>
          <option value="paid">مسدد</option>
        </select>
      </div>

      {/* Loans list */}
      {loading ? (
        <PageSpinner />
      ) : loans.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            padding: "50px 20px",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            لا توجد ديون مطابقة
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loans.map((loan) => {
            const isOnUs = loan.direction === "on_us";
            const dirColor = isOnUs ? "#ef4444" : "#22c55e";
            const paidSP =
              (loan.amount?.SP ?? 0) - (loan.remaining?.SP ?? 0);
            const expanded = expandedLoan === loan._id;
            return (
              <div
                key={loan._id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() =>
                    setExpandedLoan(expanded ? null : loan._id)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Direction badge */}
                  <span
                    style={{
                      padding: "3px 12px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 700,
                      background: `${dirColor}18`,
                      color: dirColor,
                      fontFamily: "'Cairo', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {isOnUs ? "علينا" : "لنا"}
                  </span>

                  {/* Party + meta */}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <p
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: "var(--text)",
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      {loan.party}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(loan.date).toLocaleDateString("en-GB")}
                      {loan.relatedStorageItem?.name
                        ? ` — مشتريات: ${loan.relatedStorageItem.name}`
                        : ""}
                      {loan.notes ? ` — ${loan.notes}` : ""}
                    </p>
                  </div>

                  {/* Amounts */}
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text)",
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {fmtSP(loan.remaining?.SP ?? 0)} ل.س
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      من أصل {fmtSP(loan.amount?.SP ?? 0)} — مدفوع{" "}
                      {fmtSP(Math.max(0, paidSP))}
                    </p>
                  </div>

                  {/* Status */}
                  <span
                    style={{
                      padding: "3px 12px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        loan.status === "paid" ? "#22c55e18" : "#f9731618",
                      color: loan.status === "paid" ? "#22c55e" : "#f97316",
                      fontFamily: "'Tajawal', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {loan.status === "paid" ? "مسدد" : "مفتوح"}
                  </span>

                  {/* Actions */}
                  <div
                    style={{ display: "flex", gap: 6, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {loan.status !== "paid" && (
                      <button
                        onClick={() => setPayLoan(loan)}
                        title={isOnUs ? "تسديد دفعة" : "استلام دفعة"}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(249,115,22,0.4)",
                          background: "rgba(249,115,22,0.06)",
                          color: "#f97316",
                          fontSize: 12.5,
                          fontFamily: "'Tajawal', sans-serif",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Wallet size={13} /> دفعة
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(loan._id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(239,68,68,0.08)",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      {expanded ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Payments detail */}
                {expanded && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding: "12px 16px",
                      background: "var(--bg)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        fontFamily: "'Cairo', sans-serif",
                        marginBottom: 8,
                      }}
                    >
                      الدفعات ({loan.payments?.length ?? 0})
                    </p>
                    {(loan.payments?.length ?? 0) === 0 ? (
                      <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                        لا توجد دفعات بعد
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                        }}
                      >
                        {loan.payments.map((p: any) => (
                          <div
                            key={p._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "7px 10px",
                              borderRadius: 8,
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#22c55e",
                                fontFamily: "'Cairo', sans-serif",
                              }}
                            >
                              {fmtSP(p.amount?.SP ?? 0)} ل.س
                            </span>
                            <span
                              style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                            >
                              ${fmtUSD(p.amount?.USD ?? 0)}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                fontSize: 12,
                                color: "var(--text-muted)",
                                fontFamily: "'Tajawal', sans-serif",
                              }}
                            >
                              {p.notes ?? ""}
                            </span>
                            <span
                              style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                            >
                              {new Date(p.date).toLocaleDateString("en-GB")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Drawers & dialogs */}
      <AddLoanDrawer
        open={addDrawer}
        onClose={() => setAddDrawer(false)}
        onSaved={fetchLoans}
        defaultExchange={defaultExchange}
      />
      <PaymentDrawer
        loan={payLoan}
        onClose={() => setPayLoan(null)}
        onSaved={fetchLoans}
        defaultExchange={defaultExchange}
      />
      {confirmDelete && (
        <ConfirmDialog
          title="حذف الدين"
          message="هل أنت متأكد من حذف هذا الدين؟ ستُحذف حركات الخزينة المرتبطة به."
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </main>
  );
}

// ─── Add loan drawer ─────────────────────────────────────────────────────────

function AddLoanDrawer({
  open,
  onClose,
  onSaved,
  defaultExchange,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultExchange: number;
}) {
  const [direction, setDirection] = useState<"on_us" | "for_us">("on_us");
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState({ USD: 0, SP: 0, exchange: 0 });
  const [affectsTreasury, setAffectsTreasury] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setDirection("on_us");
      setParty("");
      setAmount({ USD: 0, SP: 0, exchange: 0 });
      setAffectsTreasury(true);
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setError("");
    }
  }, [open]);

  async function handleSave() {
    if (!party.trim()) {
      setError("اسم الطرف مطلوب");
      return;
    }
    if (!amount.SP && !amount.USD) {
      setError("المبلغ مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/finance/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        party,
        amount,
        affectsTreasury,
        date,
        notes,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="إضافة دين" width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="اتجاه الدين">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {(
              [
                {
                  value: "on_us",
                  label: "علينا (نحن مدينون)",
                  color: "#ef4444",
                },
                {
                  value: "for_us",
                  label: "لنا (مدينون لنا)",
                  color: "#22c55e",
                },
              ] as const
            ).map((d) => (
              <button
                key={d.value}
                onClick={() => setDirection(d.value)}
                style={{
                  height: 40,
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `2px solid ${direction === d.value ? d.color : "var(--border)"}`,
                  background:
                    direction === d.value ? `${d.color}18` : "transparent",
                  color: direction === d.value ? d.color : "var(--text-muted)",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: direction === d.value ? 600 : 400,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={direction === "on_us" ? "الدائن (من أعطانا)" : "المدين (من أخذ منا)"}>
          <input
            style={{ ...inputStyle, height: 40 }}
            value={party}
            onChange={(e) => setParty(e.target.value)}
            placeholder="اسم الشخص أو الجهة..."
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>

        <Field label="المبلغ">
          <MoneyInput
            value={amount}
            onChange={setAmount}
            defaultExchange={defaultExchange}
          />
        </Field>

        {/* Affects treasury toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 9,
            background: affectsTreasury
              ? "rgba(249,115,22,0.06)"
              : "var(--surface)",
            border: `1px solid ${affectsTreasury ? "rgba(249,115,22,0.25)" : "var(--border)"}`,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: affectsTreasury ? "#f97316" : "var(--text)",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              يؤثر على الخزينة
            </p>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              {direction === "on_us"
                ? "استلمنا المبلغ نقداً — سيُضاف للخزينة"
                : "أعطينا المبلغ نقداً — سيُخصم من الخزينة"}
            </p>
          </div>
          <button
            onClick={() => setAffectsTreasury(!affectsTreasury)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 99,
              background: affectsTreasury ? "#f97316" : "var(--border)",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                right: affectsTreasury ? 3 : undefined,
                left: affectsTreasury ? undefined : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "all 0.2s",
              }}
            />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="التاريخ">
            <input
              style={{ ...inputStyle, height: 40 }}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="ملاحظات">
            <input
              style={{ ...inputStyle, height: 40 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات..."
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>

        {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 9,
              border: "none",
              background: "#f97316",
              color: "#fff",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {saving && <Spinner size={16} />}
            {saving ? "جاري الحفظ..." : "إضافة الدين"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Payment drawer ──────────────────────────────────────────────────────────

function PaymentDrawer({
  loan,
  onClose,
  onSaved,
  defaultExchange,
}: {
  loan: any;
  onClose: () => void;
  onSaved: () => void;
  defaultExchange: number;
}) {
  const [amount, setAmount] = useState({ USD: 0, SP: 0, exchange: 0 });
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loan) {
      setAmount({ USD: 0, SP: 0, exchange: 0 });
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setError("");
    }
  }, [loan]);

  async function handleSave() {
    if (!amount.SP && !amount.USD) {
      setError("مبلغ الدفعة مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/finance/loans/${loan._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addPayment", amount, notes, date }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    onSaved();
    onClose();
  }

  const isOnUs = loan?.direction === "on_us";

  return (
    <Drawer
      open={!!loan}
      onClose={onClose}
      title={loan ? `${isOnUs ? "تسديد دفعة إلى" : "استلام دفعة من"} ${loan.party}` : ""}
      width={440}
    >
      {loan && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                المتبقي
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f97316",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {fmtSP(loan.remaining?.SP ?? 0)} ل.س
              </p>
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                أصل الدين
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {fmtSP(loan.amount?.SP ?? 0)} ل.س
              </p>
            </div>
          </div>

          <Field label="مبلغ الدفعة">
            <MoneyInput
              value={amount}
              onChange={setAmount}
              defaultExchange={loan.amount?.exchange || defaultExchange}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="التاريخ">
              <input
                style={{ ...inputStyle, height: 40 }}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="ملاحظات">
              <input
                style={{ ...inputStyle, height: 40 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات..."
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </Field>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            {isOnUs
              ? "سيُخصم مبلغ الدفعة من رصيد الخزينة."
              : "سيُضاف مبلغ الدفعة إلى رصيد الخزينة."}
          </p>

          {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={onClose}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 9,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 13.5,
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 9,
                border: "none",
                background: "#f97316",
                color: "#fff",
                fontSize: 13.5,
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {saving && <Spinner size={16} />}
              {saving ? "جاري الحفظ..." : "حفظ الدفعة"}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

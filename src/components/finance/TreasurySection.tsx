"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/shared/Drawer";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Spinner } from "@/components/shared/Spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import {
  Vault,
  Plus,
  Minus,
  List,
  Trash2,
  HandCoins,
  Handshake,
  Wallet,
} from "lucide-react";

function fmtSP(n: number) {
  return n.toLocaleString("en");
}
function fmtUSD(n: number) {
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

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
  transition: "border-color 0.15s",
};

const SOURCE_LABELS: Record<string, string> = {
  manual: "يدوي",
  invoice: "فاتورة",
  loan: "دين",
};

export function TreasurySection() {
  const router = useRouter();
  const [balance, setBalance] = useState<{ SP: number; USD: number } | null>(
    null,
  );
  const [loansSummary, setLoansSummary] = useState<any>(null);
  const [defaultExchange, setDefaultExchange] = useState(15000);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"list" | "deposit" | "withdraw">(
    "list",
  );

  const fetchData = useCallback(async () => {
    const [tRes, lRes, sRes] = await Promise.all([
      fetch("/api/finance/treasury?limit=1").then((r) => r.json()),
      fetch("/api/finance/loans?limit=1").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setBalance(tRes.data?.balance ?? { SP: 0, USD: 0 });
    setLoansSummary(lRes.data?.summary ?? null);
    if (sRes.data?.defaultExchangeRate)
      setDefaultExchange(sRes.data.defaultExchangeRate);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openDrawer(mode: "list" | "deposit" | "withdraw") {
    setDrawerMode(mode);
    setDrawerOpen(true);
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 20,
  };

  const actionBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 32,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
    fontSize: 12.5,
    fontFamily: "'Tajawal', sans-serif",
    cursor: "pointer",
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Treasury balance — the money box */}
        <div
          style={{
            ...cardStyle,
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.07), var(--surface) 60%)",
            border: "1px solid rgba(249,115,22,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                رصيد الخزينة
              </span>
              {balance === null ? (
                <div
                  style={{
                    width: 160,
                    height: 34,
                    borderRadius: 6,
                    background: "var(--border)",
                    marginTop: 8,
                  }}
                />
              ) : (
                <>
                  <p
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: "var(--text)",
                      fontFamily: "'Cairo', sans-serif",
                      margin: "4px 0 0",
                    }}
                  >
                    {fmtSP(balance.SP)}{" "}
                    <span style={{ fontSize: 15, color: "#f97316" }}>ل.س</span>
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      fontFamily: "'Tajawal', sans-serif",
                      marginTop: 2,
                    }}
                  >
                    ≈ ${fmtUSD(balance.USD)}
                  </p>
                </>
              )}
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "rgba(249,115,22,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Vault size={20} style={{ color: "#f97316" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              onClick={() => openDrawer("deposit")}
              style={{ ...actionBtn, color: "#22c55e", borderColor: "rgba(34,197,94,0.35)" }}
            >
              <Plus size={13} /> دخل
            </button>
            <button
              onClick={() => openDrawer("withdraw")}
              style={{ ...actionBtn, color: "#ef4444", borderColor: "rgba(239,68,68,0.35)" }}
            >
              <Minus size={13} /> خرج
            </button>
            <button onClick={() => openDrawer("list")} style={actionBtn}>
              <List size={13} /> الحركات
            </button>
            <button
              onClick={() => router.push("/finance/categories")}
              style={{ ...actionBtn, color: "#f97316", borderColor: "rgba(249,115,22,0.35)" }}
            >
              <Wallet size={13} /> الصناديق
            </button>
          </div>
        </div>

        {/* Open loans on us */}
        <LoanSummaryCard
          label="ديون علينا"
          data={loansSummary?.on_us}
          color="#ef4444"
          icon={HandCoins}
          onClick={() => router.push("/finance/loans?direction=on_us")}
        />
        {/* Open loans for us */}
        <LoanSummaryCard
          label="ديون لنا"
          data={loansSummary?.for_us}
          color="#22c55e"
          icon={Handshake}
          onClick={() => router.push("/finance/loans?direction=for_us")}
        />
      </div>

      <TreasuryDrawer
        open={drawerOpen}
        mode={drawerMode}
        onClose={() => setDrawerOpen(false)}
        onUpdate={fetchData}
        defaultExchange={defaultExchange}
      />
    </>
  );
}

function LoanSummaryCard({
  label,
  data,
  color,
  icon: Icon,
  onClick,
}: {
  label: string;
  data?: { SP: number; USD: number; count: number };
  color: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
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
          fontSize: 22,
          fontWeight: 700,
          color,
          fontFamily: "'Cairo', sans-serif",
          marginTop: 8,
        }}
      >
        {fmtSP(data?.SP ?? 0)} <span style={{ fontSize: 12 }}>ل.س</span>
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "'Tajawal', sans-serif",
          marginTop: 2,
        }}
      >
        {data?.count ?? 0} دين مفتوح — ≈ ${fmtUSD(data?.USD ?? 0)}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "#f97316",
          marginTop: 8,
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        عرض الديون ←
      </p>
    </div>
  );
}

function TreasuryDrawer({
  open,
  mode,
  onClose,
  onUpdate,
  defaultExchange,
}: {
  open: boolean;
  mode: "list" | "deposit" | "withdraw";
  onClose: () => void;
  onUpdate: () => void;
  defaultExchange: number;
}) {
  const [entries, setEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState<{ SP: number; USD: number }>({
    SP: 0,
    USD: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState({ USD: 0, SP: 0, exchange: 0 });
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [funds, setFunds] = useState<{ _id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fundName = useCallback(
    (id?: string | null) => funds.find((f) => f._id === id)?.name ?? null,
    [funds],
  );

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/finance/treasury?page=${page}&limit=${limit}`);
    const json = await res.json();
    setEntries(json.data?.entries ?? []);
    setBalance(json.data?.balance ?? { SP: 0, USD: 0 });
    setTotal(json.data?.total ?? 0);
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    if (open) {
      fetchEntries();
      if (mode === "deposit" || mode === "withdraw") {
        setShowForm(true);
        setFormType(mode);
      } else {
        setShowForm(false);
      }
      setAmount({ USD: 0, SP: 0, exchange: 0 });
      setDescription("");
      setNotes("");
      setCategory("");
      setError("");
      fetch("/api/settings/finance")
        .then((r) => r.json())
        .then((d) => setFunds(d.data?.funds ?? []))
        .catch(() => {});
    }
  }, [open, mode, fetchEntries]);

  async function handleSave() {
    if (!amount.SP && !amount.USD) {
      setError("المبلغ مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/finance/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formType,
        amount,
        description,
        notes,
        category: category || null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    setShowForm(false);
    setAmount({ USD: 0, SP: 0, exchange: 0 });
    setDescription("");
    setNotes("");
    setCategory("");
    await fetchEntries();
    onUpdate();
  }

  async function handleDelete(entryId: string) {
    await fetch("/api/finance/treasury", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId }),
    });
    setConfirmDelete(null);
    await fetchEntries();
    onUpdate();
  }

  return (
    <Drawer open={open} onClose={onClose} title="الخزينة" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Balance */}
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              الرصيد الحالي
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#f97316",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {fmtSP(balance.SP)} ل.س
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              ≈ ${fmtUSD(balance.USD)}
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setFormType("deposit");
            }}
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
            }}
          >
            <Plus size={14} /> حركة جديدة
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Type toggle */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
            >
              {(
                [
                  { value: "deposit", label: "دخل", color: "#22c55e" },
                  { value: "withdraw", label: "خرج", color: "#ef4444" },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFormType(t.value)}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `2px solid ${formType === t.value ? t.color : "var(--border)"}`,
                    background:
                      formType === t.value ? `${t.color}18` : "transparent",
                    color: formType === t.value ? t.color : "var(--text-muted)",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    fontWeight: formType === t.value ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                المبلغ
              </label>
              <MoneyInput
                value={amount}
                onChange={setAmount}
                defaultExchange={defaultExchange}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                الوصف
              </label>
              <input
                style={inputStyle}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={formType === "deposit" ? "مثال: رأس مال، دخل خارجي..." : "مثال: مصروف خارجي..."}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                الصندوق (اختياري)
              </label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">بدون صندوق</option>
                {funds.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                ملاحظات
              </label>
              <input
                style={inputStyle}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات..."
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
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
                onClick={handleSave}
                disabled={saving}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: formType === "deposit" ? "#22c55e" : "#ef4444",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "جاري الحفظ..."
                  : formType === "deposit"
                    ? "دخل"
                    : "خرج"}
              </button>
            </div>
          </div>
        )}

        {/* Entries list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
            <Spinner size={26} />
          </div>
        ) : entries.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            لا توجد حركات بعد — أضف دخلاً لتحديد رصيد الخزينة الحقيقي
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map((e) => (
                <div
                  key={e._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      flexShrink: 0,
                      background:
                        e.type === "deposit" ? "#22c55e18" : "#ef444418",
                      color: e.type === "deposit" ? "#22c55e" : "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {e.type === "deposit" ? (
                      <Plus size={14} />
                    ) : (
                      <Minus size={14} />
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
                    <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      {SOURCE_LABELS[e.source] ?? e.source} —{" "}
                      {new Date(e.date).toLocaleDateString("en-GB")}
                      {fundName(e.category) ? (
                        <span style={{ color: "#f97316" }}>
                          {" "}
                          — {fundName(e.category)}
                        </span>
                      ) : null}
                      {e.notes ? ` — ${e.notes}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: e.type === "deposit" ? "#22c55e" : "#ef4444",
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {e.type === "deposit" ? "+" : "−"}
                      {fmtSP(e.amount?.SP ?? 0)} ل.س
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      ${fmtUSD(e.amount?.USD ?? 0)}
                    </p>
                  </div>
                  {e.source === "manual" && (
                    <button
                      onClick={() => setConfirmDelete(e._id)}
                      title="حذف الحركة"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "1px solid rgba(239,68,68,0.3)",
                        background: "rgba(239,68,68,0.08)",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(ev) =>
                        (ev.currentTarget.style.background =
                          "rgba(239,68,68,0.18)")
                      }
                      onMouseLeave={(ev) =>
                        (ev.currentTarget.style.background =
                          "rgba(239,68,68,0.08)")
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
          </>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="حذف الحركة"
          message="هل أنت متأكد من حذف هذه الحركة؟ سيتغير رصيد الخزينة."
          confirmLabel="حذف"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Drawer>
  );
}

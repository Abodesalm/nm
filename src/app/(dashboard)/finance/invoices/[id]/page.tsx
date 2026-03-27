"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, Building2, User, Package, Wifi } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  salary:         "راتب",
  subscription:   "اشتراك",
  storage_action: "تكلفة مخزن",
};

const TYPE_COLORS: Record<string, string> = {
  salary:         "#3b82f6",
  subscription:   "#22c55e",
  storage_action: "#f97316",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ar-SY", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function fmtUSD(n: number) { return n.toLocaleString("en", { minimumFractionDigits: 2 }); }
function fmtSP(n: number)  { return n.toLocaleString("en"); }

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice,     setInvoice]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    setDownloading(true);
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF       = (await import("jspdf")).default;
    const el = document.getElementById("invoice-print")!;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    pdf.save(`فاتورة-${invoice.invoiceNumber}.pdf`);
    setDownloading(false);
  }

  useEffect(() => {
    fetch(`/api/finance/invoices/${id}`)
      .then((r) => r.json())
      .then((j) => { setInvoice(j.data); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <main style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
          جاري التحميل...
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
          الفاتورة غير موجودة
        </div>
      </main>
    );
  }

  const isCost   = invoice.category === "cost";
  const typeColor = TYPE_COLORS[invoice.type] ?? "#f97316";

  return (
    <main style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
        {/* Action bar — hidden on print */}
        <div
          className="no-print"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}
        >
          <button
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            <ArrowRight size={16} /> رجوع
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              height: 38, padding: "0 18px",
              borderRadius: 9, border: "none",
              background: downloading ? "#d97706" : "#f97316", color: "#fff",
              fontSize: 13, fontWeight: 600,
              fontFamily: "'Tajawal', sans-serif",
              cursor: downloading ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
              opacity: downloading ? 0.8 : 1,
            }}
          >
            <Download size={15} />
            {downloading ? "جاري التحميل..." : "تحميل PDF"}
          </button>
        </div>

        {/* ── Invoice card (this is what prints) ── */}
        <div
          id="invoice-print"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Header strip */}
          <div
            style={{
              background: `${typeColor}12`,
              borderBottom: `3px solid ${typeColor}`,
              padding: "24px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 size={22} style={{ color: typeColor }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "'Cairo', sans-serif" }}>
                  NM System
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", marginTop: 4 }}>
                فاتورة رسمية
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: typeColor, fontFamily: "'Cairo', sans-serif" }}>
                #{invoice.invoiceNumber}
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontSize: 12, fontWeight: 600,
                  background: `${typeColor}20`,
                  color: typeColor,
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                {TYPE_LABELS[invoice.type] ?? invoice.type}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Meta row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <InfoBlock label="التاريخ" value={fmtDate(invoice.date)} />
              <InfoBlock
                label="الفئة"
                value={isCost ? "تكلفة" : "دخل"}
                valueColor={isCost ? "#ef4444" : "#22c55e"}
              />
              <InfoBlock label="تاريخ الإنشاء" value={fmtDate(invoice.createdAt)} />
            </div>

            <Divider />

            {/* Related entity */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Cairo', sans-serif", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                الطرف المعني
              </div>
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {invoice.employee && (
                  <>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#3b82f618", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={18} style={{ color: "#3b82f6" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontFamily: "'Tajawal', sans-serif" }}>
                        {invoice.employee.fullName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                        رقم الموظف: #{invoice.employee.id_num}
                        {invoice.employee.department && ` · ${invoice.employee.department}`}
                        {invoice.employee.role       && ` · ${invoice.employee.role}`}
                      </div>
                    </div>
                  </>
                )}
                {invoice.customer && (
                  <>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#22c55e18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Wifi size={18} style={{ color: "#22c55e" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontFamily: "'Tajawal', sans-serif" }}>
                        {invoice.customer.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                        رقم الزبون: #{invoice.customer.customer_number}
                        {invoice.customer.phone && ` · ${invoice.customer.phone}`}
                      </div>
                    </div>
                  </>
                )}
                {invoice.storageItem && (
                  <>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f9731618", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={18} style={{ color: "#f97316" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontFamily: "'Tajawal', sans-serif" }}>
                        {invoice.storageItem.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                        {invoice.storageItem.category && `${invoice.storageItem.category} · `}
                        {invoice.storageItem.unit}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Divider />

            {/* Description */}
            {invoice.description && (
              <InfoBlock label="الوصف" value={invoice.description} />
            )}

            {/* Notes */}
            {invoice.notes && (
              <InfoBlock label="ملاحظات" value={invoice.notes} />
            )}

            <Divider />

            {/* Amount breakdown */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Cairo', sans-serif", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                المبلغ
              </div>
              <div
                style={{
                  background: `${typeColor}08`,
                  border: `1px solid ${typeColor}30`,
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                    المبلغ بالدولار
                  </span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: typeColor, fontFamily: "'Cairo', sans-serif" }}>
                    ${fmtUSD(invoice.amount?.USD ?? 0)}
                  </span>
                </div>
                {(invoice.amount?.SP ?? 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
                      المبلغ بالليرة السورية
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Cairo', sans-serif" }}>
                      {fmtSP(invoice.amount.SP)} ل.س
                    </span>
                  </div>
                )}
                {(invoice.amount?.exchange ?? 0) > 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", marginTop: 8, textAlign: "left" }}>
                    سعر الصرف المستخدم: {fmtSP(invoice.amount.exchange)} ل.س/$
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "14px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg)",
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
              NM System · فاتورة #{invoice.invoiceNumber}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif" }}>
              {fmtDate(invoice.date)}
            </span>
          </div>
        </div>
      </main>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function InfoBlock({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Cairo', sans-serif", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: valueColor ?? "var(--text)", fontFamily: "'Tajawal', sans-serif", fontWeight: valueColor ? 600 : 400 }}>
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border)" }} />;
}

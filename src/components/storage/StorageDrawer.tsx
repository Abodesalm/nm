"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { Spinner } from "@/components/shared/Spinner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: any;
}

const inputStyle: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13.5,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

function CategoryPicker({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value,
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={inputStyle}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={(e) => { e.target.style.borderColor = "#f97316"; setOpen(true); }}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        placeholder="مثال: كابلات"
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            left: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {filtered.map((cat) => (
            <div
              key={cat}
              onMouseDown={() => { onChange(cat); setOpen(false); }}
              style={{
                padding: "9px 12px",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--text)",
                fontFamily: "'Tajawal', sans-serif",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  name: "",
  category: "",
  unit: "",
  minQuantity: "",
  notes: "",
};

export function StorageDrawer({ open, onClose, onSaved, item }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const isEdit = !!item;

  // Load existing categories once when drawer opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/storage?limit=1")
      .then((r) => r.json())
      .then((d) => {
        const cats: string[] = d.data?.categories ?? [];
        setAllCategories(cats);
      });
  }, [open]);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        unit: item.unit,
        minQuantity: String(item.minQuantity),
        notes: item.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [item, open]);

  async function handleSave() {
    if (!form.name.trim()) {
      setError("اسم العنصر مطلوب");
      return;
    }
    if (!form.category.trim()) {
      setError("الفئة مطلوبة");
      return;
    }
    if (!form.unit.trim()) {
      setError("الوحدة مطلوبة");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch(
      isEdit ? `/api/storage/${item._id}` : "/api/storage",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          minQuantity: Number(form.minQuantity) || 0,
        }),
      },
    );
    const json = await res.json();
    setSaving(false);

    if (json.status !== "success") {
      setError(json.message);
      return;
    }
    onSaved();
    onClose();
  }

  function field(label: string, content: React.ReactNode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {label}
        </label>
        {content}
      </div>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل عنصر" : "إضافة عنصر جديد"}
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Name */}
        {field(
          "اسم العنصر",
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثال: كابل شبكة"
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />,
        )}

        {/* Category + Unit */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {field(
            "الفئة",
            <CategoryPicker
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              suggestions={allCategories}
            />,
          )}
          {field(
            "الوحدة",
            <input
              style={inputStyle}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="مثال: متر، قطعة"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
        </div>

        {/* Min Quantity */}
        {field(
          "الحد الأدنى للمخزون",
          <input
            style={{ ...inputStyle, maxWidth: 160 }}
            type="number"
            value={form.minQuantity}
            onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
            placeholder="0"
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />,
        )}

        {/* Notes */}
        {field(
          "ملاحظات",
          <textarea
            style={{
              ...inputStyle,
              height: 80,
              padding: "10px 12px",
              resize: "vertical",
            }}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="ملاحظات إضافية..."
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />,
        )}

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "#ef4444",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            {error}
          </p>
        )}

        {/* Actions */}
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
            {saving
              ? "جاري الحفظ..."
              : isEdit
                ? "حفظ التعديلات"
                : "إضافة العنصر"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

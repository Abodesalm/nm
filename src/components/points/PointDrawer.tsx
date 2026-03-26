"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { toast } from "sonner";
import { Loader2, MapPin, Search } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  point?: any;
  prefilledProvider?: {
    _id: string;
    point_number: number;
    name: string;
  } | null;
  prefilledRegion?: {
    mainRegion: string;
    region: string;
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-muted)",
        fontFamily: "'Tajawal', sans-serif",
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  );
}

function inputStyle(focused?: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 38,
    padding: "0 12px",
    borderRadius: 8,
    border: `1px solid ${focused ? "#f97316" : "var(--border)"}`,
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
    fontFamily: "'Tajawal', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
}

function selectStyle(focused?: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 38,
    padding: "0 10px",
    borderRadius: 8,
    border: `1px solid ${focused ? "#f97316" : "var(--border)"}`,
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
    fontFamily: "'Tajawal', sans-serif",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
}

function FocusInput({
  type = "text",
  placeholder,
  value,
  onChange,
  min,
  step,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  step?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      step={step}
      style={inputStyle(focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusSelect({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ ...selectStyle(focused), opacity: disabled ? 0.5 : 1 }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: checked ? "#f97316" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s",
        }}
      />
    </div>
  );
}

export function PointDrawer({
  open,
  onClose,
  onSaved,
  point,
  prefilledProvider,
  prefilledRegion,
}: Props) {
  const isEdit = !!point;
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [form, setForm] = useState({
    point_number: "",
    name: "",
    mainRegion: "",
    region: "",
    address: "",
    lat: "",
    lng: "",
    providerPointNumber: "",
    providerPointId: "",
    switches: "1",
    hasRouter: false,
    notes: "",
    selectedEmployees: [] as string[],
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.data));
    fetch("/api/employees?limit=200")
      .then((r) => r.json())
      .then((d) => setEmployees(d.data?.employees ?? []));
  }, []);

  useEffect(() => {
    if (open) {
      if (isEdit && point) {
        setForm({
          point_number: String(point.point_number),
          name: point.name,
          mainRegion: point.mainRegion,
          region: point.region,
          address: point.location?.address ?? "",
          lat: String(point.location?.lat ?? ""),
          lng: String(point.location?.lng ?? ""),
          providerPointNumber: point.providerPoint?.point_number
            ? String(point.providerPoint.point_number)
            : "",
          providerPointId: point.providerPoint?._id ?? "",
          switches: String(point.switches ?? 1),
          hasRouter: point.captivePortal?.hasRouter ?? false,
          notes: point.notes ?? "",
          selectedEmployees: (point.employees ?? []).map(
            (e: any) => e._id ?? e,
          ),
        });
      } else {
        setForm({
          point_number: "",
          name: "",
          mainRegion: prefilledRegion?.mainRegion ?? "",
          region: prefilledRegion?.region ?? "",
          address: "",
          lat: "",
          lng: "",
          providerPointNumber: prefilledProvider
            ? String(prefilledProvider.point_number)
            : "",
          providerPointId: prefilledProvider?._id ?? "",
          switches: "1",
          hasRouter: false,
          notes: "",
          selectedEmployees: [],
        });
      }
    }
  }, [open, point, prefilledProvider]);

  const filteredRegions =
    settings?.regions?.filter(
      (r: any) => !form.mainRegion || r.mainRegion === form.mainRegion,
    ) ?? [];

  async function resolveProvider(num: string) {
    if (!num || !form.mainRegion) return;
    try {
      const res = await fetch(
        `/api/points?mainRegion=${encodeURIComponent(form.mainRegion)}`,
      );
      const d = await res.json();
      const found = (d.data ?? []).find(
        (p: any) => String(p.point_number) === num,
      );
      if (found) {
        setForm((f) => ({ ...f, providerPointId: found._id }));
        toast.success(`تم العثور على النقطة: ${found.name}`);
      } else {
        setForm((f) => ({ ...f, providerPointId: "" }));
        toast.error("لم يتم العثور على النقطة برقم " + num);
      }
    } catch {}
  }

  async function handleSave() {
    if (!form.point_number) return toast.error("رقم النقطة مطلوب");
    if (!form.mainRegion) return toast.error("المنطقة الرئيسية مطلوبة");
    if (!form.region) return toast.error("المنطقة مطلوبة");

    setSaving(true);
    try {
      const payload = {
        point_number: Number(form.point_number),
        name: form.name.trim(),
        mainRegion: form.mainRegion,
        region: form.region,
        location: {
          address: form.address,
          lat: form.lat ? Number(form.lat) : 0,
          lng: form.lng ? Number(form.lng) : 0,
        },
        providerPoint: form.providerPointId || null,
        switches: Number(form.switches),
        captivePortal: { hasRouter: form.hasRouter },
        notes: form.notes,
        employees: form.selectedEmployees,
      };

      const url = isEdit ? `/api/points/${point._id}` : "/api/points";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(isEdit ? "تم تحديث النقطة" : "تمت إضافة النقطة");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const toggleEmployee = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedEmployees: f.selectedEmployees.includes(id)
        ? f.selectedEmployees.filter((e) => e !== id)
        : [...f.selectedEmployees, id],
    }));
  };

  const totalPorts =
    Number(form.switches) > 1
      ? Number(form.switches) * 8 - (Number(form.switches) - 1) * 2
      : 8;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل النقطة" : "إضافة نقطة جديدة"}
      width={520}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Row 1: رقم النقطة + الاسم */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
          <div>
            <FieldLabel>رقم النقطة *</FieldLabel>
            <FocusInput
              type="number"
              placeholder="1"
              value={form.point_number}
              onChange={(v) => setForm((f) => ({ ...f, point_number: v }))}
            />
          </div>
          <div>
            <FieldLabel>اسم النقطة *</FieldLabel>
            <FocusInput
              placeholder="مثال: حي السلام"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
          </div>
        </div>

        {/* Row 2: المنطقة الرئيسية + المنطقة */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <FieldLabel>المنطقة الرئيسية *</FieldLabel>
            <FocusSelect
              value={form.mainRegion}
              onChange={(v) => setForm((f) => ({ ...f, mainRegion: v, region: "" }))}
            >
              <option value="">اختر...</option>
              {(settings?.mainRegions ?? []).map((mr: any) => (
                <option key={mr._id} value={mr.name}>{mr.name}</option>
              ))}
            </FocusSelect>
          </div>
          <div>
            <FieldLabel>المنطقة *</FieldLabel>
            <FocusSelect
              value={form.region}
              onChange={(v) => setForm((f) => ({ ...f, region: v }))}
              disabled={!form.mainRegion}
            >
              <option value="">اختر...</option>
              {filteredRegions.map((r: any) => (
                <option key={r._id} value={r.name}>{r.name}</option>
              ))}
            </FocusSelect>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)" }} />

        {/* نقطة المزود */}
        <div>
          <FieldLabel>نقطة المزود</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <FocusInput
                type="number"
                placeholder="رقم نقطة المزود (اتركه فارغاً للجذر)"
                value={form.providerPointNumber}
                onChange={(v) =>
                  setForm((f) => ({ ...f, providerPointNumber: v, providerPointId: "" }))
                }
              />
            </div>
            <SearchBtn
              disabled={!form.providerPointNumber || !form.mainRegion}
              onClick={() => resolveProvider(form.providerPointNumber)}
            />
          </div>
          {form.providerPointId && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#16a34a",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              ✓ تم ربط نقطة المزود
            </div>
          )}
          {form.providerPointNumber && !form.providerPointId && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#f97316",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              اضغط "بحث" للتحقق من النقطة
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)" }} />

        {/* الموقع */}
        <div>
          <FieldLabel>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={12} /> الموقع
            </span>
          </FieldLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FocusInput
              placeholder="العنوان"
              value={form.address}
              onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <FocusInput
                type="number"
                placeholder="خط العرض (lat)"
                value={form.lat}
                onChange={(v) => setForm((f) => ({ ...f, lat: v }))}
                step="any"
              />
              <FocusInput
                type="number"
                placeholder="خط الطول (lng)"
                value={form.lng}
                onChange={(v) => setForm((f) => ({ ...f, lng: v }))}
                step="any"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)" }} />

        {/* السويتشات + الراوتر */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <FieldLabel>عدد السويتشات</FieldLabel>
            <FocusInput
              type="number"
              min="1"
              value={form.switches}
              onChange={(v) => setForm((f) => ({ ...f, switches: v }))}
            />
            {form.switches && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                المنافذ الإجمالية: {totalPorts}
              </div>
            )}
          </div>
          <div>
            <FieldLabel>بوابة تسجيل الدخول</FieldLabel>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 38,
              }}
            >
              <Toggle
                checked={form.hasRouter}
                onChange={(v) => setForm((f) => ({ ...f, hasRouter: v }))}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                {form.hasRouter ? "يوجد راوتر" : "لا يوجد راوتر"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)" }} />

        {/* الموظفون */}
        <div>
          <FieldLabel>الموظفون المسؤولون</FieldLabel>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              maxHeight: 120,
              overflowY: "auto",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg)",
            }}
          >
            {employees.length === 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                لا يوجد موظفون
              </span>
            )}
            {employees.map((emp: any) => {
              const selected = form.selectedEmployees.includes(emp._id);
              return (
                <EmpTag
                  key={emp._id}
                  label={emp.fullName}
                  selected={selected}
                  onClick={() => toggleEmployee(emp._id)}
                />
              );
            })}
          </div>
        </div>

        {/* ملاحظات */}
        <div>
          <FieldLabel>ملاحظات</FieldLabel>
          <NotesArea
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 8,
              border: "none",
              background: saving ? "rgba(249,115,22,0.6)" : "#f97316",
              color: "#fff",
              fontSize: 14,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: saving ? "none" : "0 4px 12px rgba(249,115,22,0.3)",
              transition: "all 0.15s",
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {isEdit ? "حفظ التعديلات" : "إضافة النقطة"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "'Tajawal', sans-serif",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            إلغاء
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Drawer>
  );
}

function SearchBtn({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 38,
        padding: "0 14px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: hovered && !disabled ? "var(--bg)" : "transparent",
        color: disabled ? "var(--text-muted)" : "var(--text)",
        fontSize: 13,
        fontFamily: "'Tajawal', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
        transition: "background 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Search size={13} /> بحث
    </button>
  );
}

function EmpTag({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "3px 10px",
        borderRadius: 99,
        border: `1px solid ${selected ? "#f97316" : hovered ? "#f97316" : "var(--border)"}`,
        background: selected ? "#f97316" : "transparent",
        color: selected ? "#fff" : "var(--text)",
        fontSize: 12,
        fontFamily: "'Tajawal', sans-serif",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function NotesArea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      placeholder="ملاحظات اختيارية..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${focused ? "#f97316" : "var(--border)"}`,
        background: "var(--bg)",
        color: "var(--text)",
        fontSize: 13,
        fontFamily: "'Tajawal', sans-serif",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
      }}
    />
  );
}

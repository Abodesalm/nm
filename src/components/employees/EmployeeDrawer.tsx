"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/shared/Drawer";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Spinner } from "@/components/shared/Spinner";
import { Camera, FileText, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee?: any;
  settings: { departments: any[]; roles: any[]; defaultExchangeRate: number };
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

const emptyForm = {
  id_num: "",
  fullName: "",
  email: "",
  phone: "",
  address: "",
  role: "",
  department: "",
  state: "active",
  notes: "",
  salary: { USD: 0, SP: 0, exchange: 0 },
};

export function EmployeeDrawer({
  open,
  onClose,
  onSaved,
  employee,
  settings,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // CV
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvName, setCvName] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const isEdit = !!employee;

  useEffect(() => {
    if (employee) {
      setForm({
        id_num: String(employee.id_num),
        fullName: employee.fullName,
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        address: employee.address ?? "",
        role: employee.role,
        department: employee.department,
        state: employee.state,
        notes: employee.notes ?? "",
        salary: employee.salary ?? { USD: 0, SP: 0, exchange: 0 },
      });
      setPhotoPreview(employee.photo ?? "");
      setCvName(employee.cv ? "CV موجود" : "");
    } else {
      setForm(emptyForm);
      setPhotoPreview("");
      setCvName("");
    }
    setPhotoFile(null);
    setCvFile(null);
    setError("");
  }, [employee, open]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("الصورة يجب أن تكون أقل من 2MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("الـ CV يجب أن يكون أقل من 10MB");
      return;
    }
    setCvFile(file);
    setCvName(file.name);
  }

  async function uploadFiles(empId: string) {
    if (photoFile) {
      setUploadingPhoto(true);
      const fd = new FormData();
      fd.append("type", "photo");
      fd.append("file", photoFile);
      await fetch(`/api/employees/${empId}/upload`, {
        method: "POST",
        body: fd,
      });
      setUploadingPhoto(false);
    }
    if (cvFile) {
      setUploadingCv(true);
      const fd = new FormData();
      fd.append("type", "cv");
      fd.append("file", cvFile);
      await fetch(`/api/employees/${empId}/upload`, {
        method: "POST",
        body: fd,
      });
      setUploadingCv(false);
    }
  }

  async function handleSave() {
    if (!form.fullName.trim()) {
      setError("الاسم الكامل مطلوب");
      return;
    }
    if (!form.id_num) {
      setError("رقم الموظف مطلوب");
      return;
    }
    if (!form.role) {
      setError("المسمى الوظيفي مطلوب");
      return;
    }
    if (!form.department) {
      setError("القسم مطلوب");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch(
      isEdit ? `/api/employees/${employee._id}` : "/api/employees",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id_num: Number(form.id_num) }),
      },
    );
    const json = await res.json();

    if (json.status !== "success") {
      setSaving(false);
      setError(json.message);
      return;
    }

    const empId = isEdit ? employee._id : json.data._id;
    await uploadFiles(empId);

    setSaving(false);
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

  const isUploading = uploadingPhoto || uploadingCv;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل موظف" : "إضافة موظف جديد"}
      width={520}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Photo upload */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            onClick={() => photoRef.current?.click()}
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              flexShrink: 0,
              background: photoPreview ? "transparent" : "var(--bg)",
              border: "2px dashed var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#f97316")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            {photoPreview ? (
              <>
                <img
                  src={photoPreview}
                  alt="photo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <Camera size={18} style={{ color: "#fff" }} />
                </div>
              </>
            ) : (
              <Camera size={22} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              صورة الموظف
            </p>
            <p
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              JPG أو PNG، أقل من 2MB
            </p>
            <button
              onClick={() => photoRef.current?.click()}
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#f97316",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Tajawal', sans-serif",
                padding: 0,
              }}
            >
              {photoPreview ? "تغيير الصورة" : "رفع صورة"}
            </button>
          </div>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
          />
        </div>

        {/* Row 1 */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {field(
            "الاسم الكامل",
            <input
              style={inputStyle}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="محمد أحمد"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
          {field(
            "رقم الموظف",
            <input
              style={inputStyle}
              type="number"
              value={form.id_num}
              onChange={(e) => setForm({ ...form, id_num: e.target.value })}
              placeholder="1001"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
        </div>

        {/* Row 2 */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {field(
            "رقم الهاتف",
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09xxxxxxxx"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
          {field(
            "البريد الإلكتروني",
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />,
          )}
        </div>

        {/* Row 3 */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {field(
            "القسم",
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">اختر القسم</option>
              {settings.departments.map((d: any) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>,
          )}
          {field(
            "المسمى الوظيفي",
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">اختر المسمى</option>
              {settings.roles.map((r: any) => (
                <option key={r._id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>,
          )}
        </div>

        {/* State */}
        {field(
          "الحالة",
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          >
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="on-leave">إجازة</option>
          </select>,
        )}

        {/* Address */}
        {field(
          "العنوان",
          <input
            style={inputStyle}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="المدينة، الحي..."
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />,
        )}

        {/* Salary */}
        {field(
          "الراتب",
          <MoneyInput
            value={form.salary}
            onChange={(val) => setForm({ ...form, salary: val })}
            defaultExchange={settings.defaultExchangeRate}
          />,
        )}

        {/* CV Upload */}
        {field(
          "السيرة الذاتية (CV)",
          <div
            onClick={() => cvRef.current?.click()}
            style={{
              height: 40,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px dashed var(--border)",
              background: "var(--bg)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#f97316")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <FileText
              size={15}
              style={{
                color: cvName ? "#f97316" : "var(--text-muted)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: cvName ? "var(--text)" : "var(--text-muted)",
                fontFamily: "'Tajawal', sans-serif",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cvName || "اختر ملف PDF"}
            </span>
            {cvName && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCvFile(null);
                  setCvName("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>,
        )}
        <input
          ref={cvRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={handleCvChange}
        />

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
            disabled={saving || isUploading}
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
              cursor: saving || isUploading ? "not-allowed" : "pointer",
              opacity: saving || isUploading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {(saving || isUploading) && <Spinner size={16} />}
            {saving
              ? "جاري الحفظ..."
              : isUploading
                ? "جاري رفع الملفات..."
                : isEdit
                  ? "حفظ التعديلات"
                  : "إضافة الموظف"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

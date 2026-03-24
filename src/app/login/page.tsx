"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const searchParams = useSearchParams();
  const forced = searchParams.get("reason") === "forced";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; direction: rtl; }

        .login-root {
          min-height: 100vh;
          background: #0c0a08;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cairo', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.18;
          pointer-events: none;
        }
        .blob-1 {
          width: 520px; height: 520px;
          background: #f97316;
          top: -160px; right: -120px;
          animation: drift 13s ease-in-out infinite alternate;
        }
        .blob-2 {
          width: 420px; height: 420px;
          background: #c2410c;
          bottom: -120px; left: -100px;
          animation: drift 16s ease-in-out infinite alternate-reverse;
        }
        .blob-3 {
          width: 280px; height: 280px;
          background: #fb923c;
          top: 55%; left: 48%;
          transform: translate(-50%, -50%);
          animation: drift 11s ease-in-out infinite alternate;
        }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(28px, -28px) scale(1.08); }
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }

        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 48px 40px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.07);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
        }
        .logo-icon {
          width: 46px; height: 46px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 8px 24px rgba(249,115,22,0.45);
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
          margin-top: 2px;
        }

        .card-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 0 28px 0;
        }

        .heading {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        .subheading {
          font-size: 14px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 32px;
          font-weight: 400;
        }

        .field { margin-bottom: 20px; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        .input-wrap { position: relative; }
        .field input {
          width: 100%;
          height: 50px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 0 16px;
          color: #fff;
          font-size: 15px;
          font-family: 'Cairo', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          direction: ltr;
          text-align: right;
        }
        .field input::placeholder { color: rgba(255,255,255,0.18); }
        .field input:focus {
          border-color: #f97316;
          background: rgba(249,115,22,0.07);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
        }
        .field input.has-toggle { padding-left: 48px; }

        .toggle-btn {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .toggle-btn:hover { color: rgba(255,255,255,0.65); }

        .submit-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(249,115,22,0.4);
          letter-spacing: 0.3px;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(249,115,22,0.5);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .spin {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: rgba(255,255,255,0.18);
        }
      `}</style>

      <div className="login-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="grid-overlay" />

        <div className="card">
          <div className="logo-wrap">
            <div className="logo-icon">📡</div>
            <div>
              <div className="logo-text">NM System</div>
              <div className="logo-sub">نظام إدارة شركة الإنترنت</div>
            </div>
          </div>

          <div className="card-divider" />

          <h2 className="heading">تسجيل الدخول</h2>
          <p className="subheading">أدخل بياناتك للوصول إلى لوحة التحكم</p>

          {forced && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#ef4444",
                fontFamily: "'Tajawal', sans-serif",
                marginBottom: 8,
              }}
            >
              تم تسجيل خروجك من قبل المسؤول
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <div className="input-wrap">
                <input
                  id="email"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">كلمة المرور</label>
              <div className="input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  autoComplete="current-password"
                  className="has-toggle"
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spin" />
                  جاري الدخول...
                </>
              ) : (
                "دخول →"
              )}
            </button>
          </form>

          <div className="footer">NM System v1.0.0 — جميع الحقوق محفوظة</div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  {
    value: "light",
    label: "فاتح",
    icon: Sun,
    desc: "واجهة بيضاء مريحة للعيون في النهار",
  },
  {
    value: "dark",
    label: "داكن",
    icon: Moon,
    desc: "واجهة داكنة مريحة في الليل",
  },
];

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2
          className="font-title font-bold"
          style={{ fontSize: 18, color: "var(--text)" }}
        >
          المظهر
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          تخصيص مظهر النظام
        </p>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h3
          className="font-title font-semibold"
          style={{ fontSize: 14, color: "var(--text)" }}
        >
          ثيم النظام
        </h3>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {themes.map(({ value, label, icon: Icon, desc }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `2px solid ${isActive ? "#f97316" : "var(--border)"}`,
                  background: isActive ? "rgba(249,115,22,0.06)" : "var(--bg)",
                  transition: "all 0.15s",
                  textAlign: "right",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.borderColor = "var(--text-muted)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: isActive
                      ? "rgba(249,115,22,0.15)"
                      : "var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? "#f97316" : "var(--text-muted)",
                    }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isActive ? "#f97316" : "var(--text)",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {desc}
                  </p>
                </div>
                {/* Active dot */}
                <div style={{ marginRight: "auto", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${isActive ? "#f97316" : "var(--border)"}`,
                      background: isActive ? "#f97316" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#fff",
                        }}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

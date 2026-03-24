"use client";

import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Bell, LogOut, User, ChevronDown } from "lucide-react";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className="flex items-center justify-between shrink-0 px-5"
      style={{
        height: 60,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Right — page title */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full"
          style={{
            width: 3,
            height: 18,
            background: "var(--primary)",
            display: "block",
          }}
        />
        <span
          className="font-title font-semibold"
          style={{ fontSize: 14, color: "var(--text)" }}
        >
          لوحة التحكم
        </span>
      </div>

      {/* Left — controls */}
      <div className="flex items-center" style={{ gap: 4 }}>
        {/* Theme */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{
            width: 36,
            height: 36,
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Bell */}
        <button
          className="relative flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{
            width: 36,
            height: 36,
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Bell size={17} />
          <span
            className="absolute rounded-full"
            style={{
              width: 7,
              height: 7,
              background: "var(--primary)",
              top: 8,
              right: 8,
              border: "2px solid var(--surface)",
            }}
          />
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--border)",
            margin: "0 6px",
          }}
        />

        {/* User dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center rounded-lg transition-colors cursor-pointer"
            style={{
              gap: 8,
              height: 36,
              padding: "0 8px",
              border: "none",
              background: open ? "var(--bg)" : "transparent",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg)")
            }
            onMouseLeave={(e) => {
              if (!open) e.currentTarget.style.background = "transparent";
            }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 30,
                height: 30,
                background: "var(--primary)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {initials}
            </div>
            <span
              className="font-medium hidden md:block truncate"
              style={{ fontSize: 13, color: "var(--text)", maxWidth: 110 }}
            >
              {session?.user?.name}
            </span>
            <ChevronDown
              size={13}
              className="hidden md:block"
              style={{
                color: "var(--text-muted)",
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className="absolute left-0 top-full rounded-xl overflow-hidden"
              style={{
                marginTop: 6,
                width: 220,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                zIndex: 100,
              }}
            >
              {/* User info */}
              <div
                className="flex items-center"
                style={{
                  gap: 10,
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-semibold truncate"
                    style={{ fontSize: 13, color: "var(--text)" }}
                  >
                    {session?.user?.name}
                  </span>
                  <span
                    className="truncate"
                    style={{ fontSize: 11, color: "var(--text-muted)" }}
                  >
                    {session?.user?.email}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "6px" }}>
                <button
                  className="w-full flex items-center rounded-lg cursor-pointer transition-colors"
                  style={{
                    gap: 10,
                    padding: "9px 10px",
                    border: "none",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    textAlign: "right",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <User
                    size={15}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                  الملف الشخصي
                </button>

                <div
                  style={{
                    height: 1,
                    background: "var(--border)",
                    margin: "4px 0",
                  }}
                />

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center rounded-lg cursor-pointer transition-colors"
                  style={{
                    gap: 10,
                    padding: "9px 10px",
                    border: "none",
                    background: "transparent",
                    color: "var(--danger)",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    textAlign: "right",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut size={15} style={{ flexShrink: 0 }} />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

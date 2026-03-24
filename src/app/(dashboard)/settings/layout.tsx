"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Map, Users, Wifi, UserCog, Palette } from "lucide-react";

const settingsNav = [
  { href: "/settings/general", label: "عام", icon: Settings },
  { href: "/settings/regions", label: "المناطق", icon: Map },
  { href: "/settings/hr", label: "الموظفين", icon: Users },
  { href: "/settings/customers", label: "الزبائن", icon: Wifi },
  { href: "/settings/users", label: "المستخدمين", icon: UserCog },
  { href: "/settings/appearance", label: "المظهر", icon: Palette },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 8,
          flexShrink: 0,
          position: "sticky",
          top: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 600,
            color: "var(--text-muted)",
            padding: "6px 10px 8px",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          الإعدادات
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {settingsNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 10px",
                  borderRadius: 9,
                  fontSize: 13.5,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: "none",
                  color: isActive ? "#f97316" : "var(--text-muted)",
                  background: isActive
                    ? "rgba(249,115,22,0.08)"
                    : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

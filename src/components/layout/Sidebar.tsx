"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import logo from "@/app/icon-1.png";
import {
  LayoutDashboard,
  Users,
  Package,
  History,
  MapPin,
  Wifi,
  AlertTriangle,
  DollarSign,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  HardHat,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";

const topItems = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: LayoutDashboard,
    section: null,
  },
];

const navItems = [
  { href: "/employees", label: "الموظفين", icon: Users, section: "employees" },
  { href: "/storage", label: "التخزين", icon: Package, section: "storage" },
  { href: "/history", label: "السجل", icon: History, section: "history" },
  /*   { href: "/points", label: "العُلب", icon: MapPin, section: "points" },
  { href: "/customers", label: "الزبائن", icon: Wifi, section: "customers" },
  {
    href: "/problems",
    label: "المشاكل",
    icon: AlertTriangle,
    section: "problems",
  }, */
  { href: "/finance", label: "المالية", icon: DollarSign, section: "finance" },
  /*   {
    href: "/documents",
    label: "الوثائق",
    icon: FileText,
    section: "documents",
  }, */
  {
    href: "/fieldwork",
    label: "تفقد العمل",
    icon: HardHat,
    section: "fieldwork",
  },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: Settings,
    section: "settings",
  },
];

function NavTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div
        className={cn(
          "absolute left-0 -translate-x-full pointer-events-none z-[999] transition-all duration-150",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ paddingLeft: 8 }}
      >
        <div className="relative flex items-center">
          <div
            className="absolute -right-[5px]"
            style={{
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: "6px solid #09090b",
            }}
          />
          <div
            style={{
              background: "#09090b",
              color: "#fafafa",
              fontSize: 12,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 500,
              padding: "5px 11px",
              borderRadius: 8,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  isActive: boolean;
}) {
  const linkEl = (
    <Link
      href={href}
      className={cn(
        "relative flex items-center rounded-lg transition-all duration-150 no-underline",
        collapsed
          ? "w-10 h-10 justify-center mx-auto"
          : "w-full h-10 px-3 gap-2.5",
        isActive
          ? "bg-orange-500/10 text-orange-500"
          : cn(
              "text-zinc-500 dark:text-zinc-400",
              "hover:bg-zinc-100 dark:hover:bg-white/8",
              "hover:text-zinc-900 dark:hover:text-white",
            ),
      )}
      style={{
        fontSize: 13.5,
        fontFamily: "'Tajawal', sans-serif",
        fontWeight: isActive ? 600 : 400,
        textDecoration: "none",
      }}
    >
      {isActive && (
        <span
          className="absolute rounded-l-full bg-orange-500"
          style={{
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 18,
          }}
        />
      )}
      <Icon size={17} style={{ flexShrink: 0 }} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) return <NavTooltip label={label}>{linkEl}</NavTooltip>;
  return <div>{linkEl}</div>;
}

interface SidebarPref {
  key: string;
  order: number;
  label?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [prefs, setPrefs] = useState<SidebarPref[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const user = session?.user as any;
  const isSuperAdmin = user?.isSuperAdmin;
  const permissions: { section: string; permission: string }[] =
    user?.permissions ?? [];

  const loggedIn = !!user;
  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/me/sidebar")
      .then((r) => r.json())
      .then((d) => setPrefs(d.data?.sidebarPrefs ?? []))
      .catch(() => {});
  }, [loggedIn]);

  function canAccess(section: string | null) {
    if (!section) return true;
    if (isSuperAdmin) return true;
    const perm = permissions.find((p) => p.section === section);
    return perm && perm.permission !== "none";
  }

  // Apply the user's order + label overrides on top of the defaults
  const visibleNavItems = navItems
    .filter((item) => canAccess(item.section))
    .map((item, i) => {
      const p = prefs.find((x) => x.key === item.href);
      return {
        ...item,
        label: p?.label || item.label,
        order: p ? p.order : i + 100,
      };
    })
    .sort((a, b) => a.order - b.order);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen shrink-0 transition-all duration-300",
        "bg-white dark:bg-zinc-900",
        "border-l border-zinc-200 dark:border-zinc-800",
        collapsed ? "w-[60px]" : "w-[220px]",
      )}
    >
      {/* Header */}
      <div
        className="flex items-center shrink-0 border-b border-zinc-200 dark:border-zinc-800"
        style={{ height: 60, padding: "0 10px", gap: 8 }}
      >
        <div
          className="flex items-center justify-center"
          /* style={{
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }} */
        >
          {/* <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="white" stroke="none" />
          </svg> */}
          <Image
            src={logo}
            alt="logo"
            width={38}
            height={38}
            className="w-full m-0"
          />
        </div>

        {!collapsed && (
          <span
            className="font-title font-bold truncate flex-1 text-zinc-900 dark:text-white"
            style={{ fontSize: 15, marginTop: 0 }}
          >
            NM System
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "shrink-0 flex items-center justify-center rounded-md transition-colors cursor-pointer",
            "text-zinc-400 hover:text-zinc-700 dark:hover:text-white",
            "hover:bg-zinc-100 dark:hover:bg-white/10",
            collapsed && "mx-auto",
          )}
          style={{
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
          }}
        >
          {collapsed ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ padding: "8px 8px", gap: 2 }}
      >
        {/* Dashboard */}
        {topItems.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            collapsed={collapsed}
            isActive={pathname === href}
          />
        ))}

        {/* Separator */}
        <div
          className="border-t border-zinc-200 dark:border-zinc-800"
          style={{ margin: "6px 4px" }}
        />

        {/* Sections */}
        {visibleNavItems.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            collapsed={collapsed}
            isActive={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}
      </nav>

      {/* Customize */}
      <div
        className="border-t border-zinc-200 dark:border-zinc-800"
        style={{ padding: "8px 8px" }}
      >
        <button
          onClick={() => setCustomizeOpen(true)}
          className={cn(
            "flex items-center rounded-lg transition-all duration-150 cursor-pointer",
            "text-zinc-500 dark:text-zinc-400",
            "hover:bg-zinc-100 dark:hover:bg-white/8",
            "hover:text-zinc-900 dark:hover:text-white",
            collapsed ? "w-10 h-9 justify-center mx-auto" : "w-full h-9 px-3 gap-2.5",
          )}
          style={{
            fontSize: 12.5,
            fontFamily: "'Tajawal', sans-serif",
            border: "none",
            background: "transparent",
          }}
          title="تخصيص القائمة"
        >
          <SlidersHorizontal size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>تخصيص القائمة</span>}
        </button>
        {!collapsed && (
          <div
            className="text-center text-zinc-400"
            style={{ paddingTop: 6, fontSize: 11 }}
          >
            v1.0.0
          </div>
        )}
      </div>

      {customizeOpen && (
        <SidebarCustomizer
          items={visibleNavItems}
          onClose={() => setCustomizeOpen(false)}
          onSaved={(newPrefs) => {
            setPrefs(newPrefs);
            setCustomizeOpen(false);
          }}
        />
      )}
    </aside>
  );
}

/** تخصيص القائمة الجانبية — per-user order + label overrides */
function SidebarCustomizer({
  items,
  onClose,
  onSaved,
}: {
  items: { href: string; label: string }[];
  onClose: () => void;
  onSaved: (prefs: SidebarPref[]) => void;
}) {
  const defaultLabels: Record<string, string> = {};
  for (const n of navItems) defaultLabels[n.href] = n.label;

  const [list, setList] = useState(
    items.map((i) => ({ key: i.href, label: i.label })),
  );
  const [saving, setSaving] = useState(false);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
  }

  async function save(prefsToSave: SidebarPref[]) {
    setSaving(true);
    await fetch("/api/me/sidebar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sidebarPrefs: prefsToSave }),
    });
    setSaving(false);
    onSaved(prefsToSave);
  }

  function handleSave() {
    save(
      list.map((item, i) => ({
        key: item.key,
        order: i,
        label:
          item.label.trim() && item.label.trim() !== defaultLabels[item.key]
            ? item.label.trim()
            : undefined,
      })),
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 20,
          width: 380,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <p
            className="font-title font-semibold"
            style={{ fontSize: 15, color: "var(--text)" }}
          >
            تخصيص القائمة الجانبية
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            رتّب الأزرار وغيّر أسماءها — التخصيص خاص بحسابك فقط
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((item, i) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 8px",
                borderRadius: 9,
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  style={{
                    width: 22,
                    height: 18,
                    border: "none",
                    background: "transparent",
                    color: i === 0 ? "var(--border)" : "var(--text-muted)",
                    cursor: i === 0 ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1}
                  style={{
                    width: 22,
                    height: 18,
                    border: "none",
                    background: "transparent",
                    color:
                      i === list.length - 1
                        ? "var(--border)"
                        : "var(--text-muted)",
                    cursor: i === list.length - 1 ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <input
                value={item.label}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...item, label: e.target.value };
                  setList(next);
                }}
                maxLength={30}
                style={{
                  flex: 1,
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "'Tajawal', sans-serif",
                  outline: "none",
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                  flexShrink: 0,
                }}
              >
                {defaultLabels[item.key]}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => save([])}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 34,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 12,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={12} /> استعادة الافتراضي
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                height: 34,
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
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 8,
                border: "none",
                background: "#f97316",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'Tajawal', sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

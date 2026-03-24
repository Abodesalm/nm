"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  { href: "/points", label: "النقاط", icon: MapPin, section: "points" },
  { href: "/customers", label: "الزبائن", icon: Wifi, section: "customers" },
  {
    href: "/problems",
    label: "المشاكل",
    icon: AlertTriangle,
    section: "problems",
  },
  { href: "/finance", label: "المالية", icon: DollarSign, section: "finance" },
  {
    href: "/documents",
    label: "الوثائق",
    icon: FileText,
    section: "documents",
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

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user as any;
  const isSuperAdmin = user?.isSuperAdmin;
  const permissions: { section: string; permission: string }[] =
    user?.permissions ?? [];

  function canAccess(section: string | null) {
    if (!section) return true;
    if (isSuperAdmin) return true;
    const perm = permissions.find((p) => p.section === section);
    return perm && perm.permission !== "none";
  }

  const visibleNavItems = navItems.filter((item) => canAccess(item.section));

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
            style={{ fontSize: 15, marginTop: 8 }}
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

      {!collapsed && (
        <div
          className="text-center border-t border-zinc-200 dark:border-zinc-800 text-zinc-400"
          style={{ padding: "10px 16px", fontSize: 11 }}
        >
          v1.0.0
        </div>
      )}
    </aside>
  );
}

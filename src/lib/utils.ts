import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format money
export function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatSP(amount: number) {
  return new Intl.NumberFormat("ar-SY", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount) + " ل.س";
}

// Calculate money field
export function calcMoney(
  field: "USD" | "SP",
  value: number,
  exchange: number
) {
  if (field === "USD") {
    return { USD: value, SP: +(value * exchange).toFixed(1), exchange };
  } else {
    return { SP: value, USD: +(value / exchange).toFixed(2), exchange };
  }
}

// Seniority — how long an employee has been in the company
export function seniorityParts(hireDate: Date | string) {
  const start = new Date(hireDate);
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);
  return { years: Math.floor(months / 12), months: months % 12 };
}

export function formatSeniority(hireDate: Date | string) {
  const { years, months } = seniorityParts(hireDate);
  if (years === 0 && months === 0) return "أقل من شهر";
  const y =
    years === 0
      ? ""
      : years === 1
        ? "سنة"
        : years === 2
          ? "سنتان"
          : `${years} سنوات`;
  const m =
    months === 0
      ? ""
      : months === 1
        ? "شهر"
        : months === 2
          ? "شهران"
          : `${months} أشهر`;
  return [y, m].filter(Boolean).join(" و");
}

// Port calculation for points
export function calcPorts(switches: number) {
  const totalPorts = switches * 8 - (switches - 1) * 2;
  return totalPorts;
}

// Status color
export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: "bg-green-500",
    online: "bg-green-500",
    waiting: "bg-yellow-500",
    suspended: "bg-red-500",
    offline: "bg-red-500",
    inactive: "bg-blue-500",
    "on-leave": "bg-orange-500",
    maintenance: "bg-orange-500",
    "in-stock": "bg-green-500",
    "low-stock": "bg-yellow-500",
    "out-of-stock": "bg-red-500",
  };
  return colors[status] ?? "bg-gray-500";
}

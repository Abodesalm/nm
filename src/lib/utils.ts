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

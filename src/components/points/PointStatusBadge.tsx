"use client";

const config = {
  online: {
    label: "متصل",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  offline: {
    label: "غير متصل",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  maintenance: {
    label: "صيانة",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

export function PointStatusBadge({ status }: { status: string }) {
  const cfg = config[status as keyof typeof config] ?? config.offline;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ml-1.5 ${
          status === "online"
            ? "bg-green-500"
            : status === "maintenance"
              ? "bg-orange-500"
              : "bg-red-500"
        }`}
      />
      {cfg.label}
    </span>
  );
}

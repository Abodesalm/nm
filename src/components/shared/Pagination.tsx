"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: Props) {
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  const btnStyle = (
    active?: boolean,
    disabled?: boolean,
  ): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 7,
    border: active ? "none" : "1px solid var(--border)",
    background: active ? "#f97316" : "transparent",
    color: active ? "#fff" : disabled ? "var(--text-muted)" : "var(--text)",
    fontSize: 13,
    fontFamily: "'Tajawal', sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.4 : 1,
    transition: "all 0.15s",
  });

  // Generate page numbers
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 4px",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      {/* Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          {start}–{end} من {total}
        </span>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
            onPageChange(1);
          }}
          style={{
            height: 32,
            padding: "0 8px",
            borderRadius: 7,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "'Tajawal', sans-serif",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n} لكل صفحة
            </option>
          ))}
        </select>
      </div>

      {/* Pages */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
        >
          <ChevronRight size={14} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              style={{
                width: 32,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={btnStyle(page === p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    </div>
  );
}

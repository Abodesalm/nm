"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Clock, FileText } from "lucide-react";

interface RowData {
  employee: any;
  log: any | null;
}

interface Props {
  data: RowData[];
  onChangeStatus: (item: RowData) => void;
  canEdit: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  not_arrived: "#6b7280",
  free: "#3b82f6",
  working: "#f97316",
  finished: "#16a34a",
};

function getStatus(log: any | null) {
  return log?.status ?? "not_arrived";
}

function Avatar({ employee }: { employee: any }) {
  const color = STATUS_COLORS[getStatus(null)];
  if (employee.photo) {
    return (
      <img
        src={employee.photo}
        alt=""
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid var(--border)",
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "#f97316",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "'Cairo', sans-serif",
        flexShrink: 0,
        border: "2px solid var(--border)",
      }}
    >
      {employee.fullName?.charAt(0) ?? "؟"}
    </div>
  );
}

export function FieldWorkCards({ data, onChangeStatus, canEdit }: Props) {
  if (data.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "var(--text-muted)",
          fontFamily: "'Tajawal', sans-serif",
          fontSize: 14,
        }}
      >
        لا يوجد موظفون مطابقون للبحث
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
        gap: 16,
      }}
    >
      {data.map((item) => {
        const { employee, log } = item;
        const status = getStatus(log);
        const statusColor = STATUS_COLORS[status] ?? "#6b7280";

        return (
          <article
            key={employee._id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              borderRight: `4px solid ${statusColor}`,
              transition: "box-shadow 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 20px rgba(0,0,0,0.08)";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
          >
            {/* Card body */}
            <div style={{ padding: "16px 16px 12px", flex: 1 }}>
              {/* Top row: avatar + name + status */}
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <Avatar employee={employee} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: "var(--text)",
                      fontFamily: "'Tajawal', sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {employee.fullName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "'Tajawal', sans-serif",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {employee.role}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge status={status} />
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {/* Arrival time */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    color: log?.arrivedAt ? "var(--text)" : "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Clock
                    size={13}
                    style={{ color: log?.arrivedAt ? "#3b82f6" : "var(--text-muted)", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  {log?.arrivedAt ? `حضر الساعة ${log.arrivedAt}` : "لم يسجل حضوره بعد"}
                </div>

                {/* Current note */}
                {log?.currentNote && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                      fontSize: 12.5,
                      color: "var(--text)",
                      fontFamily: "'Tajawal', sans-serif",
                    }}
                  >
                    <FileText
                      size={13}
                      style={{
                        color: "#f97316",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {log.currentNote}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card footer */}
            {canEdit && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "10px 16px",
                }}
              >
                <button
                  type="button"
                  onClick={() => onChangeStatus(item)}
                  aria-label={`تغيير حالة ${employee.fullName}`}
                  style={{
                    width: "100%",
                    height: 34,
                    borderRadius: 7,
                    border: `1px solid ${statusColor}40`,
                    background: `${statusColor}0d`,
                    color: statusColor,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "'Tajawal', sans-serif",
                    fontWeight: 600,
                    transition: "background 0.15s, border-color 0.15s",
                    touchAction: "manipulation",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${statusColor}20`;
                    e.currentTarget.style.borderColor = statusColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${statusColor}0d`;
                    e.currentTarget.style.borderColor = `${statusColor}40`;
                  }}
                >
                  تغيير الحالة
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

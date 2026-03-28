"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";

interface RowData {
  employee: any;
  log: any | null;
}

interface Props {
  data: RowData[];
  onChangeStatus: (item: RowData) => void;
  canEdit: boolean;
}

function getStatus(log: any | null) {
  return log?.status ?? "not_arrived";
}

export function FieldWorkTable({ data, onChangeStatus, canEdit }: Props) {
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
        overflowX: "auto",
        borderRadius: 12,
        border: "1px solid var(--border)",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse" }}
        aria-label="قائمة الموظفين وحالاتهم"
      >
        <thead>
          <tr>
            {[
              { key: "id", label: "#", w: 60 },
              { key: "name", label: "الاسم" },
              { key: "dept", label: "القسم", w: 140 },
              { key: "status", label: "الحالة", w: 140 },
              { key: "arrived", label: "وقت الحضور", w: 120 },
              { key: "note", label: "ملاحظة" },
              ...(canEdit ? [{ key: "action", label: "إجراءات", w: 130 }] : []),
            ].map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  padding: "10px 14px",
                  color: "var(--text-muted)",
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 500,
                  fontSize: 12.5,
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  ...(col.w ? { width: col.w } : {}),
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const { employee, log } = item;
            const status = getStatus(log);
            return (
              <tr
                key={employee._id}
                style={{
                  borderBottom:
                    idx < data.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* # */}
                <td
                  style={{
                    padding: "12px 14px",
                    color: "var(--text-muted)",
                    fontFamily: "'Cairo', sans-serif",
                    fontSize: 13,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {employee.id_num}
                </td>

                {/* Name */}
                <td style={{ padding: "12px 14px", minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {employee.photo ? (
                      <img
                        src={employee.photo}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#f97316",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "'Cairo', sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        {employee.fullName?.charAt(0) ?? "؟"}
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: "'Tajawal', sans-serif",
                        fontSize: 13.5,
                        color: "var(--text)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {employee.fullName}
                    </span>
                  </div>
                </td>

                {/* Department */}
                <td
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Tajawal', sans-serif",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {employee.department || "—"}
                </td>

                {/* Status */}
                <td style={{ padding: "12px 14px" }}>
                  <StatusBadge status={status} />
                </td>

                {/* Arrived At */}
                <td
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Cairo', sans-serif",
                    fontSize: 13,
                    color: log?.arrivedAt ? "var(--text)" : "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {log?.arrivedAt ?? "—"}
                </td>

                {/* Note */}
                <td
                  style={{
                    padding: "12px 14px",
                    maxWidth: 220,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Tajawal', sans-serif",
                      fontSize: 13,
                      color: log?.currentNote
                        ? "var(--text)"
                        : "var(--text-muted)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {log?.currentNote || "—"}
                  </span>
                </td>

                {/* Action */}
                {canEdit && (
                  <td style={{ padding: "12px 14px" }}>
                    <button
                      type="button"
                      onClick={() => onChangeStatus(item)}
                      aria-label={`تغيير حالة ${employee.fullName}`}
                      style={{
                        height: 32,
                        padding: "0 12px",
                        borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "var(--bg)",
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontFamily: "'Tajawal', sans-serif",
                        whiteSpace: "nowrap",
                        transition: "border-color 0.15s, background 0.15s",
                        touchAction: "manipulation",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#f97316";
                        e.currentTarget.style.color = "#f97316";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text)";
                      }}
                    >
                      تغيير الحالة
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

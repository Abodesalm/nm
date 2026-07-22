"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AttendanceCalendar } from "@/components/fieldwork/AttendanceCalendar";

export default function FieldworkEmployeePage() {
  const { id } = useParams();
  const router = useRouter();
  const [info, setInfo] = useState<any>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/fieldwork")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowRight size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1
            className="font-title font-bold"
            style={{ fontSize: 21, color: "var(--text)" }}
          >
            ملف الدوام{info?.employee ? ` — ${info.employee.fullName}` : ""}
          </h1>
          {info?.employee && (
            <p
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}
            >
              {info.employee.role} — {info.employee.department} — الدوام القياسي{" "}
              {info.standardWorkHours} ساعات
            </p>
          )}
        </div>
      </div>

      <AttendanceCalendar
        employeeId={String(id)}
        showStats
        onData={setInfo}
      />
    </div>
  );
}

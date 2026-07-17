import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Employee from "@/lib/db/models/Employee";
import FieldWorkLog from "@/lib/db/models/FieldWorkLog";
import Settings from "@/lib/db/models/Settings";
import { permissionGuard, ok, err } from "@/lib/api-factory";

/**
 * كشف الدوام الآلي — attendance is DERIVED, never stored:
 * - A manual absents[] record for a day always wins (hard override).
 * - Otherwise the day's FieldWorkLog decides: no log or "not_arrived" → absent,
 *   anything else → present. Hours = arrivedAt → last "finished" status change;
 *   longer than Settings.standardWorkHours → overtime.
 * - Weekend days (Settings.weekendDays) are skipped by auto detection.
 */

type DayStatus =
  | "present"
  | "absent"
  | "excused"
  | "weekend"
  | "future"
  | "before_hire";

interface DayInfo {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  overtime: boolean;
  hours: number | null;
  arrivedAt: string | null;
  source: "auto" | "manual" | null;
  manualId: string | null;
  reason?: string | null;
  note?: string | null;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function computeHours(log: any): { hours: number | null; arrivedAt: string | null } {
  const arrivedAt: string | null = log?.arrivedAt ?? null;
  if (!arrivedAt) return { hours: null, arrivedAt: null };
  const finished = [...(log.statusHistory ?? [])]
    .reverse()
    .find((h: any) => h.status === "finished");
  if (!finished?.changedAt) return { hours: null, arrivedAt };
  const [h, m] = arrivedAt.split(":").map(Number);
  if (Number.isNaN(h)) return { hours: null, arrivedAt };
  const start = new Date(log.date);
  start.setHours(h, m || 0, 0, 0);
  const end = new Date(finished.changedAt);
  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  if (hours <= 0 || hours > 24) return { hours: null, arrivedAt };
  return { hours: +hours.toFixed(2), arrivedAt };
}

function buildDay(
  day: Date,
  today: Date,
  hireDate: Date,
  logsByKey: Map<string, any>,
  absentsByKey: Map<string, any>,
  weekendDays: number[],
  standardHours: number,
): DayInfo {
  const key = dateKey(day);
  const base: DayInfo = {
    date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
    status: "absent",
    overtime: false,
    hours: null,
    arrivedAt: null,
    source: null,
    manualId: null,
  };

  if (day.getTime() > today.getTime()) return { ...base, status: "future" };
  if (day.getTime() < hireDate.getTime())
    return { ...base, status: "before_hire" };

  const manual = absentsByKey.get(key);
  if (manual) {
    // Hard manual override — beats everything the automation says
    const log = logsByKey.get(key);
    const { hours, arrivedAt } = log ? computeHours(log) : { hours: null, arrivedAt: null };
    return {
      ...base,
      status:
        manual.isAbsent === false
          ? "present"
          : manual.excused
            ? "excused"
            : "absent",
      overtime: !!manual.overtime,
      hours,
      arrivedAt,
      source: "manual",
      manualId: manual._id.toString(),
      reason: manual.reason ?? null,
      note: manual.note ?? null,
    };
  }

  const log = logsByKey.get(key);
  if (log && log.status !== "not_arrived") {
    const { hours, arrivedAt } = computeHours(log);
    return {
      ...base,
      status: "present",
      overtime: hours !== null && hours > standardHours,
      hours,
      arrivedAt,
      source: "auto",
    };
  }

  if (weekendDays.includes(day.getDay()))
    return { ...base, status: "weekend" };

  return { ...base, status: "absent", source: "auto" };
}

function emptyStats() {
  return { worked: 0, absents: 0, excused: 0, unexcused: 0, overtime: 0, totalHours: 0 };
}

function addToStats(stats: ReturnType<typeof emptyStats>, d: DayInfo) {
  if (d.status === "present") {
    stats.worked++;
    if (d.overtime) stats.overtime++;
    if (d.hours) stats.totalHours += d.hours;
  } else if (d.status === "absent") {
    stats.absents++;
    stats.unexcused++;
  } else if (d.status === "excused") {
    stats.absents++;
    stats.excused++;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await permissionGuard("fieldwork", "readonly", "view");
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await connectDB();
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

    const [employee, settings, logs] = await Promise.all([
      Employee.findById(id).select(
        "fullName id_num role department photo hireDate createdAt absents",
      ),
      Settings.findOne().lean<any>(),
      FieldWorkLog.find({ employee: id }).lean(),
    ]);
    if (!employee) return err("الموظف غير موجود", 404);

    const standardHours = settings?.standardWorkHours ?? 8;
    const weekendDays: number[] = settings?.weekendDays ?? [5];

    const logsByKey = new Map<string, any>();
    for (const log of logs) logsByKey.set(dateKey(new Date(log.date)), log);
    const absentsByKey = new Map<string, any>();
    for (const a of employee.absents ?? [])
      absentsByKey.set(dateKey(new Date(a.date)), a);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hireDate = new Date(employee.hireDate ?? (employee as any).createdAt);
    hireDate.setHours(0, 0, 0, 0);

    // Selected month, day by day
    const days: DayInfo[] = [];
    const monthStats = emptyStats();
    const cursor = new Date(year, month - 1, 1);
    while (cursor.getMonth() === month - 1) {
      const info = buildDay(
        new Date(cursor),
        today,
        hireDate,
        logsByKey,
        absentsByKey,
        weekendDays,
        standardHours,
      );
      days.push(info);
      addToStats(monthStats, info);
      cursor.setDate(cursor.getDate() + 1);
    }

    // All-time, from hire date to today
    const allTime = emptyStats();
    const allCursor = new Date(hireDate);
    while (allCursor.getTime() <= today.getTime()) {
      addToStats(
        allTime,
        buildDay(
          new Date(allCursor),
          today,
          hireDate,
          logsByKey,
          absentsByKey,
          weekendDays,
          standardHours,
        ),
      );
      allCursor.setDate(allCursor.getDate() + 1);
    }

    return ok({
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        id_num: (employee as any).id_num,
        role: (employee as any).role,
        department: (employee as any).department,
        photo: (employee as any).photo,
        hireDate: employee.hireDate,
      },
      standardWorkHours: standardHours,
      weekendDays,
      month,
      year,
      days,
      monthStats: {
        ...monthStats,
        totalHours: +monthStats.totalHours.toFixed(1),
      },
      allTime: { ...allTime, totalHours: +allTime.totalHours.toFixed(1) },
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

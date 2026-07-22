"use client";

import { Drawer } from "@/components/shared/Drawer";
import { AttendanceCalendar } from "@/components/fieldwork/AttendanceCalendar";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: any;
  onUpdate?: () => void;
}

/**
 * Absences in the employee profile are the SAME attendance as تفقد العمل —
 * one source of truth. This drawer just embeds the shared AttendanceCalendar
 * (auto-detected + manual overrides), so the numbers always match the
 * تفقد العمل profile.
 */
export function AbsentsDrawer({ open, onClose, employee }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`الدوام والغيابات — ${employee?.fullName ?? ""}`}
      width={620}
    >
      {open && employee?._id && (
        <AttendanceCalendar employeeId={String(employee._id)} showStats />
      )}
    </Drawer>
  );
}

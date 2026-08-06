/**
 * Fine-grained permission actions per section.
 *
 * Model: every user still has a per-section level (none/readonly/full) — that
 * is the DEFAULT. A section entry may also carry an `actions` map
 * (action key → boolean). When an action is present in the map it OVERRIDES
 * the level for that specific operation; missing actions fall back to the
 * level. Section level "none" always hides the section entirely.
 *
 * Enforced by permissionGuard(section, level, action?) in api-factory.ts.
 * This catalog is the single source of truth for the users-settings UI.
 *
 * NOTE: a few keys are RESTRICTIONS rather than grants — turning them ON takes
 * a capability away instead of adding one, and they are enforced by their own
 * dedicated guard, never by permissionGuard's grant-shaped fallback. They are
 * marked with a comment below (currently: storage `action_delete_same_day_only`).
 */

export interface PermissionAction {
  key: string;
  label: string;
}

export const SECTION_ACTIONS: Record<string, PermissionAction[]> = {
  employees: [
    { key: "view", label: "عرض الموظفين" },
    { key: "add", label: "إضافة موظف" },
    { key: "edit", label: "تعديل موظف" },
    { key: "delete", label: "حذف موظف" },
    { key: "salaries_add", label: "إضافة راتب" },
    { key: "salaries_delete", label: "حذف راتب" },
    { key: "absents_add", label: "تسجيل حضور/غياب" },
    { key: "absents_edit", label: "تعديل حضور/غياب" },
    { key: "absents_delete", label: "حذف حضور/غياب" },
    { key: "bonuses_add", label: "إضافة مكافأة" },
    { key: "bonuses_delete", label: "حذف مكافأة" },
    { key: "hr_points_add", label: "إضافة نقاط تقييم" },
    { key: "hr_points_delete", label: "حذف نقاط تقييم" },
    { key: "loans_add", label: "إضافة سلفة" },
    { key: "loans_manage", label: "تعديل/حذف سلفة" },
  ],
  storage: [
    { key: "view", label: "عرض المستودع" },
    { key: "item_add", label: "إضافة عنصر" },
    { key: "item_edit", label: "تعديل عنصر" },
    { key: "item_delete", label: "حذف عنصر" },
    // A RESTRICTION, not a grant: when ON, this user can only delete an action
    // on the same day it was recorded (see requireDeletableToday).
    { key: "action_delete_same_day_only", label: "حذف الحركات في نفس اليوم فقط" },
    { key: "income_access", label: "الوصول إلى صفحة الدخل" },
    { key: "outcome_access", label: "الوصول إلى صفحة الخرج" },
  ],
  finance: [
    { key: "view", label: "عرض المالية" },
    { key: "treasury_add", label: "دخل/خرج في الخزينة" },
    { key: "treasury_delete", label: "حذف حركة خزينة" },
    { key: "loans_add", label: "إضافة دين" },
    { key: "loans_manage", label: "تعديل/تسديد/حذف دين" },
    { key: "funds_manage", label: "إدارة الصناديق" },
  ],
  // History is a read-only audit trail — no delete action exists for it.
  history: [{ key: "view", label: "عرض السجل" }],
  fieldwork: [
    { key: "view", label: "عرض تفقد العمل" },
    { key: "status_change", label: "تغيير حالة موظف" },
  ],
  points: [],
  customers: [],
  problems: [],
  documents: [],
  settings: [],
};

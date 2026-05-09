import type { User } from '../types/auth';

export type Role = User['role'];

/** Canonical permission slugs (mirror backend config/rbac.php + DB). */
export const PERMISSIONS = {
  USERS_MANAGE: 'users.manage',
  ACADEMIC_MANAGE: 'academic.manage',
  GROUPS_MANAGE: 'groups.manage',
  GROUPS_READ: 'groups.read',
  MODULES_MANAGE: 'modules.manage',
  AFFECTATIONS_MANAGE: 'affectations.manage',
  ATTENDANCE_WRITE: 'attendance.write',
  ATTENDANCE_READ: 'attendance.read',
  GRADES_WRITE: 'grades.write',
  GRADES_READ: 'grades.read',
  STAGES_MANAGE: 'stages.manage',
  FEEDBACKS_READ: 'feedbacks.read',
  TIMETABLE_READ: 'timetable.read',
  TIMETABLE_MANAGE: 'timetable.manage',
  MODULES_READ_CATALOG: 'modules.read_catalog',
  EVALUATIONS_READ: 'evaluations.read',
  EVALUATIONS_WRITE: 'evaluations.write',
  EXPORTS_RUN: 'exports.run',
  ANALYTICS_READ: 'analytics.read',
  AI_USE: 'ai.use',
  MESSAGES_USE: 'messages.use',
  NOTIFICATIONS_READ: 'notifications.read',
  ADMIN_PARENT_LINKS: 'admin.parent_links',
  COURSE_FILES_READ: 'course_files.read',
  PROGRESS_READ: 'progress.read',
  DASHBOARD_READ: 'dashboard.read',
  PARENT_PORTAL: 'parent.portal',
  FEEDBACK_SUBMIT: 'feedback.submit',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  admin: '/dashboard/admin',
  directeur: '/dashboard/admin',
  secretariat: '/dashboard/admin',
  teacher: '/dashboard/formateur',
  formateur: '/dashboard/formateur',
  student: '/dashboard/stagiaire',
  stagiaire: '/dashboard/stagiaire',
  parent: '/dashboard/parent',
};

export function resolveDashboardPath(role?: Role): string {
  if (!role) {
    return '/dashboard';
  }

  return ROLE_DASHBOARD_PATH[role] ?? '/dashboard';
}

export function hasAnyPermission(granted: string[] | undefined, required: string[]): boolean {
  if (required.length === 0) {
    return true;
  }
  const g = granted ?? [];
  return required.some((slug) => g.includes(slug));
}

import type { User } from '../types/auth';

export type Role = User['role'];

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

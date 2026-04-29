import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface ChildStagiaire {
  id: number;
  cef_number: string;
  status: string;
  user?: { name: string; email: string };
  groupes?: { label: string; filiere?: { label: string } }[];
}

export interface ParentDashboardStagiaire {
  id: number;
  name: string | null;
  filiere: string | null;
  groupe: string | null;
  modules: string[];
}

export interface ParentAccountRow {
  id: number;
  name: string | null;
  email: string | null;
  linked_children_count: number;
}

/** Catalogue pour l’écran d’association (tous les stagiaires + métadonnées de lien). */
export interface LinkableStagiaireRow {
  id: number;
  cef_number: string;
  status: string;
  user?: { name?: string; email?: string };
  filiere?: { label?: string } | null;
  groupe?: { label?: string } | null;
  linked_to_me: boolean;
  has_other_parents: boolean;
}

export type ChildGradeRow = { evaluation?: { item_label: string }; valeur: number };

export interface ChildAttendanceResponse {
  attendances: unknown[];
  summary: { from: string; to: string; present_count: number; total_count: number; rate_percent: number };
}

export interface ParentChildDetailsResponse {
  child: {
    id: number;
    name: string | null;
    email: string | null;
    cef_number: string | null;
    status: string | null;
    filiere: { id: number; code: string | null; label: string | null } | null;
    groups: { id: number; label: string | null }[];
  };
  notes: {
    id: number;
    value: number;
    evaluation: { id: number; label: string | null } | null;
    module: { id: number; code: string | null; label: string | null } | null;
    date: string | null;
  }[];
  timetable: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    type: string;
    module: { id: number; code: string | null; label: string | null } | null;
    group: { id: number; label: string | null } | null;
    teacher: { id: number; name: string | null } | null;
  }[];
  absences: {
    id: number;
    date: string;
    seance_id: number | null;
    module: { id: number; code: string | null; label: string | null } | null;
    group: { id: number; label: string | null } | null;
  }[];
}

export const parentApi = {
  getChildren: () => api.get<ApiResponse<ChildStagiaire[]>>('/parent/children').then(unwrapData),
  /** Same payload as getChildren — backend limits to authenticated parent’s stagiaires only. */
  getStagiaires: () =>
    api
      .get<ApiResponse<{ stagiaires: ParentDashboardStagiaire[] }>>('/parent/stagiaires')
      .then(unwrapData)
      .then((data) => {
        const list = Array.isArray(data?.stagiaires) ? data.stagiaires : [];
        return list;
      }),
  getChildGrades: (stagiaireId: number) =>
    api.get<ApiResponse<ChildGradeRow[]>>(`/parent/children/${stagiaireId}/grades`).then(unwrapData),
  getChildAttendance: (stagiaireId: number, params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<ChildAttendanceResponse>>(`/parent/children/${stagiaireId}/attendance`, { params }).then(unwrapData),
  getChildDetails: (stagiaireId: number) =>
    api.get<ApiResponse<ParentChildDetailsResponse>>(`/parent/stagiaire/${stagiaireId}`).then(unwrapData),

  // Admin-only: assign children to a selected parent account
  getParentAccounts: () => api.get<ApiResponse<ParentAccountRow[]>>('/admin/parent-links/parents').then(unwrapData),
  getAdminLinkableStagiaires: (parentId: number) =>
    api
      .get<ApiResponse<LinkableStagiaireRow[]>>(`/admin/parent-links/parents/${parentId}/linkable-stagiaires`)
      .then(unwrapData),
  adminLinkStagiaires: (parentId: number, stagiaire_ids: number[]) =>
    api
      .post<ApiResponse<{ linked_ids: number[]; count: number }>>(`/admin/parent-links/parents/${parentId}/link-stagiaires`, {
        stagiaire_ids,
      })
      .then(unwrapData),
};

import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface SyllabusItem {
  id: number;
  module_id: number;
  label: string;
  estimated_hours: number;
  order: number;
}

export interface Module {
  id: number;
  filiere_id: number;
  code: string;
  label: string;
  masse_horaire: number;
  coefficient: number;
  semester: string;
  niveau?: string;
  filiere?: { id: number; label: string };
  syllabusItems?: SyllabusItem[];
}

export interface AcademicCatalogFiliere {
  id: number;
  code: string;
  label: string;
  type: string;
  required_level: string;
  duration_years: number;
  modules: Module[];
}

/** Module assigné au formateur avec progression (GET /my-modules). */
export interface MyModuleProgress {
  progression: number;
  last_session: string | null;
}

export interface MyModuleRow {
  id: number;
  code: string;
  label: string;
  semester?: string;
  masse_horaire?: number;
  coefficient?: number;
  filiere: { id: number; code: string; label: string } | null;
  progress: MyModuleProgress;
}

export interface MyModulesPayload {
  modules: MyModuleRow[];
  meta: {
    academic_year?: number;
  };
}

export const modulesApi = {
  list: (params?: { filiere_id?: number }) =>
    api.get<ApiResponse<Module[]>>('/modules', { params }).then(unwrapData),
  academicCatalog: () =>
    api.get<ApiResponse<AcademicCatalogFiliere[]>>('/modules/academic-catalog').then(unwrapData),
  get: (id: number) => api.get<ApiResponse<Module>>(`/modules/${id}`).then(unwrapData),
  getSyllabus: (id: number) =>
    api.get<ApiResponse<SyllabusItem[]>>(`/modules/${id}/syllabus`).then(unwrapData),
  create: (body: { filiere_id: number; code: string; label: string; masse_horaire: number; coefficient: number; semester: string }) =>
    api.post<ApiResponse<Module>>('/modules', body).then(unwrapData),
  update: (id: number, body: Partial<Module>) =>
    api.put<ApiResponse<Module>>(`/modules/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/modules/${id}`),
  updateSyllabus: (id: number, items: { label: string; estimated_hours: number; order: number }[]) =>
    api.post<ApiResponse<unknown>>(`/modules/${id}/syllabus`, { items }).then(unwrapData),

  myModules: async (params?: { academic_year?: number; date?: string }): Promise<MyModulesPayload> => {
    const res = await api.get<ApiResponse<MyModuleRow[]>>('/my-modules', { params });
    const body = res.data;
    if (body && typeof body === 'object' && body.success === false) {
      throw new Error(body.message || 'Erreur chargement des modules.');
    }
    const rows = Array.isArray(body?.data) ? body.data : [];
    const meta = body?.meta ?? {};
    const academicYear =
      typeof meta === 'object' && meta !== null && 'academic_year' in meta
        ? (meta as { academic_year?: number }).academic_year
        : undefined;
    return { modules: rows, meta: { academic_year: academicYear } };
  },

  updateModuleProgress: (
    moduleId: number,
    body: { progression: number; last_session?: string | null },
    params?: { academic_year?: number; date?: string },
  ) =>
    api.put<ApiResponse<MyModuleRow>>(`/modules/${moduleId}/progress`, body, { params }).then(unwrapData),
};
